const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");

const config = getDefaultConfig(__dirname);
const API_PROXY_PORT = Number(process.env.SCAVVY_API_PROXY_PORT || 4000);

function proxyToApi(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${API_PROXY_PORT}` };
  delete headers["connection"];
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: API_PROXY_PORT,
      path: req.url,
      method: req.method,
      headers,
      timeout: 55_000,
    },
    (incoming) => {
      res.writeHead(incoming.statusCode || 502, incoming.headers);
      incoming.pipe(res);
    },
  );
  upstream.on("timeout", () => {
    upstream.destroy();
    if (!res.headersSent) res.writeHead(504);
    res.end();
  });
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ error: "API is not reachable" }));
  });
  req.pipe(upstream);
}

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, metroServer) => {
    const inner = previousEnhance ? previousEnhance(metroMiddleware, metroServer) : metroMiddleware;
    return (req, res, next) => {
      if (typeof req.url === "string" && req.url.startsWith("/api")) {
        proxyToApi(req, res);
        return;
      }
      return inner(req, res, next);
    };
  },
};

module.exports = config;
