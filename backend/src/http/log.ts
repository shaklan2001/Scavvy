const SENSITIVE_KEY = /password|token|secret|authorization|api[_-]?key|card_number|cvv|ssn|cookie/i;

function sanitize(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).flatMap(([key, value]) => {
      if (SENSITIVE_KEY.test(key)) return [];
      if (typeof value === 'string' && value.length > 180) return [[key, `${value.slice(0, 40)}…`]];
      return [[key, value]];
    }),
  );
}

export function logEvent(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
