import assert from "node:assert/strict";
import { execSync, spawn } from "node:child_process";
import { closeSync, openSync, readFileSync, rmSync } from "node:fs";
import { after, before, describe, it } from "node:test";

/**
 * Route-level tests. These boot the real Next server (no mocks) against the
 * local Wrangler D1 database, so they cover what the unit tests cannot: the
 * admin throttle, the submission guard, the organiser approval gate, the
 * export endpoint and the erasure action.
 *
 * Run with: npm run test:integration
 */

const PORT = 3100 + Math.floor(Math.random() * 60);
const BASE = `http://localhost:${PORT}`;
const LOG = "freebuff.integration.log";
const CONFIG = "freebuff.wrangler.jsonc";
const DB = "freebuff-next-db-local";

function d1(sql) {
  const out = execSync(
    `npx wrangler d1 execute ${DB} --local --config ${CONFIG} --command "${sql}" --json`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const start = out.indexOf("[");
  return JSON.parse(out.slice(start))[0].results ?? [];
}

function signup(name, email) {
  return fetch(`${BASE}/api/signup`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({
      name,
      email,
      phone: `9${String(Date.now()).slice(-9)}`,
      college: "IT Test College",
      year: "Final year",
      branch: "CSE",
    }),
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      // A 200 also proves the D1 binding is initialised, which the admin routes
      // need before they can query attempt limits.
      const response = await fetch(`${BASE}/api/stats`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await sleep(750);
  }
  let tail = "";
  try {
    tail = readFileSync(LOG, "utf8").split("\n").slice(-25).join("\n");
  } catch {
    tail = "(no server log)";
  }
  throw new Error(`Next dev server did not start on ${BASE}\n${tail}`);
}

let server;
let cookie = "";

function stopServer() {
  if (!server) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: "ignore" });
    } catch {
      server.kill("SIGKILL");
    }
  } else {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      server.kill("SIGKILL");
    }
  }
  server = null;
}

function startServer() {
  // A dev cache from an interrupted run can start the server without bindings.
  rmSync(".next/dev", { recursive: true, force: true });
  const log = openSync(LOG, "w");
  // Spawn the Next CLI directly: a real PID instead of a shell wrapper, so the
  // teardown cannot leave a dev server holding the .next lock.
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--port", String(PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, GROQ_API_KEY: "", SMTP2GO_API_KEY: "", SMTP2GO_SENDER: "" },
      stdio: ["ignore", log, log],
      detached: process.platform !== "win32",
    },
  );
  closeSync(log);
}

before(async () => {
  // The Cloudflare dev proxy can be hit before it has its bindings; when that
  // happens getCloudflareContext caches an empty env for the process, so retry
  // with a fresh server rather than waiting forever on a broken one.
  startServer();
  try {
    await waitForServer(45_000);
  } catch {
    stopServer();
    await sleep(1500);
    startServer();
    await waitForServer();
  }
  d1("DELETE FROM admin_attempts");
  d1("DELETE FROM error_log");
  // A previous run (or a manual demo) may have left simulation mode on.
  d1("DELETE FROM submissions WHERE is_demo = 1 AND demo_kind = 'sim'");
  d1(
    "DELETE FROM captains WHERE registrant_id IN (SELECT id FROM registrants WHERE is_demo = 1 AND demo_kind = 'sim')",
  );
  d1("DELETE FROM events WHERE is_demo = 1 AND demo_kind = 'sim'");
  d1("DELETE FROM registrants WHERE is_demo = 1 AND demo_kind = 'sim'");
  d1("DELETE FROM app_settings WHERE key = 'data_mode'");

  // Sign in once so the approval checks run as an organiser. The throttle suite
  // later clears attempts and signs in again before the operations suite.
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ passcode: "ship2026" }),
  });
  assert.equal(login.status, 200, "local admin login should succeed on loopback");
  cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
});

after(async () => {
  try {
    // Never leave a test run presenting a simulation, and never leave its rows behind.
    d1("DELETE FROM submissions WHERE is_demo = 1 AND demo_kind = 'sim'");
    d1(
      "DELETE FROM captains WHERE registrant_id IN (SELECT id FROM registrants WHERE is_demo = 1 AND demo_kind = 'sim')",
    );
    d1("DELETE FROM events WHERE is_demo = 1 AND demo_kind = 'sim'");
    d1("DELETE FROM registrants WHERE is_demo = 1 AND demo_kind = 'sim'");
    d1("DELETE FROM app_settings WHERE key = 'data_mode'");
    d1("DELETE FROM submissions WHERE registrant_id IN (SELECT id FROM registrants WHERE name LIKE 'IT Test%')");
    d1("DELETE FROM events WHERE ref_code IN (SELECT ref_code FROM registrants WHERE name LIKE 'IT Test%')");
    d1("DELETE FROM registrants WHERE name LIKE 'IT Test%'");
    d1("DELETE FROM colleges WHERE name = 'IT Test College' AND id NOT IN (SELECT DISTINCT college_id FROM registrants)");
    d1("DELETE FROM admin_attempts");
  } catch {
    // cleanup is best-effort
  }
  stopServer();
});

describe("submission route", () => {
  it("refuses a link back to the site before scoring", async () => {
    const response = await fetch(`${BASE}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "no-such-code",
        title: "nsbsghGHX",
        url: `${BASE}/submit/no-such-code`,
        description: "SBASHGCAH",
      }),
    });
    assert.equal(response.status, 422);
  });

  it("stores an AI baseline and withholds the certificate until approval", async () => {
    const created = await signup("IT Test One", `it.one.${Date.now()}@example.com`);
    assert.equal(created.status, 201);
    const { code } = await created.json();

    const submitted = await fetch(`${BASE}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        title: "CampusBus",
        url: "https://campusbus.example.workers.dev",
        description:
          "I built a live shuttle tracker for one campus route. Students open the page and see the next bus, its position on a small map, and a walking ETA; the driver taps one button when leaving the gate. I used Next.js and Cloudflare D1, then tested it with forty students for a week.",
      }),
    });
    assert.equal(submitted.status, 201);
    const body = await submitted.json();
    assert.equal(body.reviewStatus, "pending");
    assert.match(body.linkCheck ?? "", /^(ok|unreachable|blocked)/);

    const certificate = await fetch(`${BASE}/certificate/${code}`);
    const html = await certificate.text();
    assert.equal(certificate.status, 200);
    assert.match(html, /With the organiser/);
    assert.doesNotMatch(html, /Certificate ID/);

    const [row] = d1(`SELECT id FROM registrants WHERE ref_code = '${code}'`);
    const approved = await fetch(`${BASE}/api/admin/action`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "approve-submission", id: row.id, score: 88 }),
    });
    assert.equal(approved.status, 200);

    const after = await (await fetch(`${BASE}/certificate/${code}`)).text();
    assert.match(after, /Set by the organiser/);
    assert.match(after, />88</);
    assert.doesNotMatch(after, /With the organiser/);
  });
});

describe("admin login throttle", () => {
  it("locks an address after five wrong passcodes and refuses a correct one during the lock", async () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await fetch(`${BASE}/api/admin/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode: `wrong-${attempt}` }),
      });
      assert.equal(response.status, 401, `attempt ${attempt}`);
    }
    const locked = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: "ship2026" }),
    });
    assert.equal(locked.status, 429);
    assert.ok(Number(locked.headers.get("retry-after")) > 0);
  });

  it("signs in once the lock window is cleared", async () => {
    d1("DELETE FROM admin_attempts");
    const response = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: "ship2026" }),
    });
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    assert.match(cookie, /^sw_admin=/);
  });
});

describe("admin operations", () => {
  it("refuses the export without a session", async () => {
    const response = await fetch(`${BASE}/api/admin/export`);
    assert.equal(response.status, 401);
  });

  it("exports the campaign data as JSON", async () => {
    const response = await fetch(`${BASE}/api/admin/export`, { headers: { cookie } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-disposition") ?? "", /attachment/);
    const payload = await response.json();
    assert.ok(Array.isArray(payload.registrants));
    assert.ok(Array.isArray(payload.submissions));
  });

  it("deletes a student and their data on request", async () => {
    const before = await (await fetch(`${BASE}/api/stats`)).json();
    const created = await signup("IT Test Erase", `it.erase.${Date.now()}@example.com`);
    const { code } = await created.json();
    const [row] = d1(`SELECT id FROM registrants WHERE ref_code = '${code}'`);

    const response = await fetch(`${BASE}/api/admin/action`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "delete-registrant", id: row.id }),
    });
    assert.equal(response.status, 200);

    const certificate = await fetch(`${BASE}/certificate/${code}`);
    assert.equal(certificate.status, 404);
    const afterDelete = await (await fetch(`${BASE}/api/stats`)).json();
    assert.ok(afterDelete.total <= before.total);
  });

  it("revokes every admin session", async () => {
    const response = await fetch(`${BASE}/api/admin/action`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "revoke-sessions" }),
    });
    assert.equal(response.status, 200);

    const dashboard = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
    assert.equal(dashboard.status, 307);
    assert.match(dashboard.headers.get("location") ?? "", /\/admin\/login/);
  });
});

describe("simulation mode", () => {
  let simStudents = 0;
  let liveBaseline = 0;

  async function login() {
    d1("DELETE FROM admin_attempts");
    const response = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: "ship2026" }),
    });
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  }

  /**
   * The Next dev proxy occasionally closes an idle keep-alive socket, which
   * shows up as a reset before the request is handled. Retrying once keeps the
   * suite about behaviour instead of socket reuse.
   */
  async function action(body, attempt = 1) {
    try {
      return await fetch(`${BASE}/api/admin/action`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify(body),
      });
    } catch (caught) {
      if (attempt >= 3) throw caught;
      await sleep(500);
      return action(body, attempt + 1);
    }
  }

  /** Same keep-alive reset workaround for reads. */
  async function getText(path, attempt = 1) {
    try {
      return await (await fetch(`${BASE}${path}`)).text();
    } catch (caught) {
      if (attempt >= 3) throw caught;
      await sleep(500);
      return getText(path, attempt + 1);
    }
  }

  async function getDashboard(attempt = 1) {
    try {
      return await (await fetch(`${BASE}/admin`, { headers: { cookie } })).text();
    } catch (caught) {
      if (attempt >= 3) throw caught;
      await sleep(500);
      return getDashboard(attempt + 1);
    }
  }

  async function getJson(path, attempt = 1) {
    try {
      return await (await fetch(`${BASE}${path}`)).json();
    } catch (caught) {
      if (attempt >= 3) throw caught;
      await sleep(500);
      return getJson(path, attempt + 1);
    }
  }

  it("generates a 300+ student campaign that is tagged as simulation", async () => {
    await login();
    liveBaseline = d1("SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 0")[0].n;

    const response = await action({ action: "seed-simulation" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.students >= 300, `expected 300+ simulated students, got ${body.students}`);
    assert.ok(body.submissions > 0);
    simStudents = body.students;

    const [tagged] = d1(
      "SELECT COUNT(*) AS n, COUNT(DISTINCT email) AS emails, COUNT(DISTINCT phone) AS phones, COUNT(DISTINCT ref_code) AS codes FROM registrants WHERE is_demo = 1 AND demo_kind = 'sim'",
    );
    assert.equal(tagged.n, simStudents);
    assert.equal(tagged.emails, simStudents, "simulated emails must be unique");
    assert.equal(tagged.phones, simStudents, "simulated phones must be unique");
    assert.equal(tagged.codes, simStudents, "simulated referral codes must be unique");

    const [orphans] = d1(
      "SELECT COUNT(*) AS n FROM submissions s WHERE s.demo_kind = 'sim' AND NOT EXISTS (SELECT 1 FROM registrants r WHERE r.id = s.registrant_id AND r.demo_kind = 'sim')",
    );
    assert.equal(orphans.n, 0);

    const liveUntouched = d1("SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 0")[0].n;
    assert.equal(liveUntouched, liveBaseline, "seeding must not touch live students");
  });

  it("presents the simulation everywhere and marks it as simulated", async () => {
    const stats = await getJson("/api/stats");
    assert.equal(stats.mode, "simulation");
    assert.equal(stats.total, simStudents);
    assert.ok(stats.verified > 0);

    const home = await getText("/");
    assert.match(home, /Simulation\./);

    const board = await getJson("/api/leaderboard");
    assert.equal(board.stats.mode, "simulation");
    assert.ok(board.people.length > 0);
    assert.ok(board.people.every((row) => row.ref_code.startsWith("sim-")));

    const dashboard = await getDashboard();
    assert.match(dashboard, /SIMULATION MODE/);
    assert.match(dashboard, /Back to live data/);
  });

  it("returns to live data without deleting the simulation", async () => {
    const response = await action({ action: "set-mode", mode: "live" });
    assert.equal(response.status, 200);

    const stats = await getJson("/api/stats");
    assert.equal(stats.mode, "live");
    assert.equal(stats.total, liveBaseline);

    const [kept] = d1("SELECT COUNT(*) AS n FROM registrants WHERE demo_kind = 'sim'");
    assert.equal(kept.n, simStudents);
  });

  it("clears the simulation and leaves live and base-demo rows alone", async () => {
    // Turn the simulation back on through the real endpoint, then clear it.
    const switched = await action({ action: "set-mode", mode: "simulation" });
    assert.equal(switched.status, 200);
    const demoBefore = d1("SELECT COUNT(*) AS n FROM registrants WHERE demo_kind = 'demo'")[0].n;

    const response = await action({ action: "clear-simulation" });
    assert.equal(response.status, 200);

    const [remaining] = d1("SELECT COUNT(*) AS n FROM registrants WHERE demo_kind = 'sim'");
    assert.equal(remaining.n, 0);
    const demoAfter = d1("SELECT COUNT(*) AS n FROM registrants WHERE demo_kind = 'demo'")[0].n;
    assert.equal(demoAfter, demoBefore);

    const stats = await getJson("/api/stats");
    assert.equal(stats.mode, "live");
  });
});
