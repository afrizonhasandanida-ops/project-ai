import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { env } from "../config/env.js";
import { pool } from "../config/database.js";

if (env.nodeEnv === "production") {
  console.error("Seed data is disabled in production.");
  process.exitCode = 1;
} else {
  const thisDirectory = dirname(fileURLToPath(import.meta.url));
  const seedFile = join(thisDirectory, "../../database/seeds/001_mw75.sql");
  try {
    const sql = await readFile(seedFile, "utf8");
    await pool.query(sql);
    console.log("Development seed applied.");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  }
}

await pool.end();
