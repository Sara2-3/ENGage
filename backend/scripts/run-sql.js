const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const { Client } = require("pg");

async function main() {
  const sqlPath = process.argv[2];
  const connectionString = process.env.DATABASE_URL;

  if (!sqlPath) {
    throw new Error("A SQL file path is required.");
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const sql = await readFile(resolve(process.cwd(), sqlPath), "utf8");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Applied ${sqlPath}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Database command failed: ${message}`);
  process.exitCode = 1;
});
