const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BLOCKED_ORIGINS = new Set(["*", "null", "NULL"]);

function csv(name, fallback) {
  const raw = process.env[name] ?? fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !BLOCKED_ORIGINS.has(item));
}

const DEFAULT_ORIGINS =
  "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006";

const port = Number(process.env.PORT ?? "4000");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid PORT. Use an integer between 1 and 65535.");
}

const corsOrigins = csv("CORS_ORIGINS", DEFAULT_ORIGINS);
if (corsOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must list at least one exact origin. Do not use * or null.");
}

const config = Object.freeze({
  port,
  corsOrigins,
  openaiApiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  elevenLabsApiKey: (process.env.ELEVENLABS_API_KEY ?? "").trim(),
  jsonLimit: process.env.JSON_LIMIT ?? "8mb",
});

module.exports = { config };
