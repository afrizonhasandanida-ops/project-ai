import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";

await pool.query("SELECT 1");
const app = await createApp();
const server = app.listen(env.port, env.host, () => {
  console.log(JSON.stringify({ level: "info", message: "Product API listening", host: env.host, port: env.port, environment: env.nodeEnv }));
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: "info", message: "Shutting down", signal }));
  server.close(async (error) => {
    if (error) console.error(JSON.stringify({ level: "error", message: "HTTP server close failed", error: error.message }));
    await pool.end();
    process.exit(error ? 1 : 0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
