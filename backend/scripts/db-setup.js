// Prepares PostgreSQL for ENGage. Run in the backend folder, with the backend stopped:
//   npm run build   then   npm run db:setup
// DATABASE_URL comes from backend/.env (ignored by Git). Creates the database if it is missing,
// creates and seeds the tables, and copies what was saved in runtime/state.json into it once.
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { Client } = require("pg");

const root = join(__dirname, "..");
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));

async function sql(connectionString, run) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function createDatabase(url) {
  const name = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error("Give the database a simple name, for example engage.");
  const server = new URL(url);
  server.pathname = "/postgres";
  await sql(server.href, async (client) => {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!found.rowCount) {
      await client.query(`CREATE DATABASE "${name}"`);
      console.log(`Database ${name} created.`);
    }
  });
}

// What was entered while the app ran without a database. Records keep their order, so their ids
// match the ones used in the file. Skipped when the database already holds records.
async function copySaved(url, repository) {
  const file = join(root, "runtime", "state.json");
  if (!existsSync(file)) return console.log("No saved file to copy.");
  const used = await sql(url, (client) => client.query(
    "SELECT (SELECT count(*) FROM events) + (SELECT count(*) FROM staffing_requests) AS n"));
  if (Number(used.rows[0].n)) return console.log("The database already holds records; the saved file was not copied.");

  const state = JSON.parse(readFileSync(file, "utf8"));
  for (const c of state.addedCases) await repository.addCase(c);
  for (const e of state.events) await repository.addEvent(e.caseId, e, e.date);
  for (const r of state.reviews) await repository.addReview(r);
  for (const [i, s] of state.staffing.entries()) {
    await repository.addStaffing(s.project, s.need, s.specs, s.date);
    if (s.status === "FILLED") await repository.fillStaffing(i + 1, s.caseId);
  }
  for (const [id, data] of Object.entries(state.cvs)) await repository.saveCv(id, Buffer.from(data, "base64"));
  console.log(`Copied ${state.events.length} records and ${state.staffing.length} requests from the saved file.`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in backend/.env first.");
  const url = new URL(process.env.DATABASE_URL);
  await createDatabase(url);
  for (const file of ["schema.sql", "seed.sql"]) {
    await sql(url.href, (client) => client.query(readFileSync(join(root, "db", file), "utf8")));
  }
  const repository = require("../dist/engage/db/repository");
  await repository.initStorage();
  try {
    await copySaved(url.href, repository);
  } finally {
    await repository.closeStorage();
  }
  console.log("PostgreSQL is ready.");
}

main().catch((error) => {
  console.error(`Database setup failed: ${error.message}`);
  process.exitCode = 1;
});
