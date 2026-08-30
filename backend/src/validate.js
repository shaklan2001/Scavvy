function fail(field, reason) {
  const error = new Error(`${field}: ${reason}`);
  error.status = 400;
  error.field = field;
  return error;
}

function optionalString(body, field, { max = 400, fallback = "" } = {}) {
  const value = body[field];
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") throw fail(field, "must be a string");
  if (value.length > max) throw fail(field, `must be at most ${max} characters`);
  return value;
}

function requiredString(body, field, { max = 400 } = {}) {
  const value = optionalString(body, field, { max, fallback: "" });
  if (!value) throw fail(field, "is required");
  return value;
}

function optionalInt(body, field, { min = 0, max = 100, fallback = 0 } = {}) {
  const value = body[field];
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw fail(field, "must be an integer");
  if (parsed < min || parsed > max) throw fail(field, `must be between ${min} and ${max}`);
  return parsed;
}

function optionalObject(body, field) {
  const value = body[field];
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw fail(field, "must be an object");
  return value;
}

function optionalStringList(body, field, { maxItems = 3 } = {}) {
  const value = body[field];
  if (value == null) return [];
  if (!Array.isArray(value)) throw fail(field, "must be an array");
  if (value.length > maxItems) throw fail(field, `must have at most ${maxItems} items`);
  if (value.some((item) => typeof item !== "string")) throw fail(field, "items must be strings");
  return value;
}

module.exports = {
  optionalString,
  requiredString,
  optionalInt,
  optionalObject,
  optionalStringList,
};
