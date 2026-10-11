import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: env.nodeEnv === "production" ? { rejectUnauthorized: true } : false,
});

pool.on("error", (error) => {
  console.error(JSON.stringify({ level: "error", message: "Unexpected idle PostgreSQL client error", error: error.message }));
});
