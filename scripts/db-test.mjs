// Runs the pgTAP files in supabase/tests/database against the database in
// SUPABASE_DB_URL. Same tests as `supabase test db --remote`, without Docker.
// Every test file wraps itself in begin/rollback, so nothing is left behind.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const TEST_DIR = path.join("supabase", "tests", "database");

function loadEnv() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: fall back to variables already set in the shell.
  }
}

function tapLines(results) {
  const list = Array.isArray(results) ? results : [results];
  return list
    .flatMap((result) => result.rows ?? [])
    .flatMap((row) => Object.values(row))
    .filter((value) => typeof value === "string")
    .flatMap((value) => value.split("\n"))
    .filter((line) => /^(ok|not ok|#|1\.\.)/.test(line));
}

async function runFile(client, file) {
  const sql = await readFile(path.join(TEST_DIR, file), "utf8");
  try {
    const lines = tapLines(await client.query(sql));
    const passed = lines.filter((line) => line.startsWith("ok")).length;
    const failed = lines.filter((line) => line.startsWith("not ok")).length;
    const details = failed ? lines.filter((line) => line.startsWith("not ok") || line.startsWith("#")) : [];
    return { passed, failed, details };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    return { passed: 0, failed: 1, details: [`error: ${error.message}`] };
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("SUPABASE_DB_URL is not set. Add the Session pooler connection string to .env.local (see README).");
    process.exit(1);
  }

  const only = process.argv.slice(2);
  const files = (await readdir(TEST_DIR))
    .filter((file) => file.endsWith(".test.sql"))
    .filter((file) => only.length === 0 || only.some((name) => file.includes(name)))
    .sort();

  // Supabase's pooler certificate is signed by Supabase's own CA, which Node
  // doesn't trust by default. The connection is still encrypted.
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let totalPassed = 0;
  let totalFailed = 0;
  try {
    for (const file of files) {
      const { passed, failed, details } = await runFile(client, file);
      totalPassed += passed;
      totalFailed += failed;
      console.log(`${failed === 0 ? "PASS" : "FAIL"}  ${file}  (${passed} passed${failed ? `, ${failed} failed` : ""})`);
      for (const line of details) console.log(`      ${line}`);
    }
  } finally {
    await client.end();
  }

  console.log(`\n${files.length} files, ${totalPassed} passed, ${totalFailed} failed`);
  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
