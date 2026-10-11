import "dotenv/config";

function required(name, value) {
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const writeApiKey = required("PRODUCT_WRITE_API_KEY", process.env.PRODUCT_WRITE_API_KEY);
if (writeApiKey.length < 32) {
  throw new Error("PRODUCT_WRITE_API_KEY must contain at least 32 characters");
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "127.0.0.1",
  port,
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  productWriteApiKey: writeApiKey,
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});
