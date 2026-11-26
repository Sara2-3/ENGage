// Rules and workflow of the role dashboards. Run after the build: npm run test:engage
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assess } = require("../dist/rules/engine");
const { applyEvents, validateEvent } = require("../dist/rules/workflow");
const cases = require("../data/cases.json");
const evidence = require("../data/evidence.json");
const facts = require("../data/facts.json");

const expected = {
  "ONB-001": [[], "GREY"],
  "ONB-002": [["ACCESS_NOT_USABLE"], "RED"],
  "ONB-003": [["MISSING_PROJECT", "STALE_STATUS"], "AMBER"],
  "ONB-004": [["MISSING_MANAGER"], "AMBER"],
  "ONB-005": [["READINESS_CONFLICT"], "RED"],
  "ONB-006": [["STATUS_DATE_MISMATCH"], "AMBER"],
  "ONB-007": [["STALE_STATUS"], "AMBER"],
  "ONB-008": [["BLOCKED_NO_DETAIL"], "RED"],
  "ONB-009": [["MISSING_PROJECT", "UNANSWERED_REQUEST"], "RED"],
  "ONB-010": [["NOT_VALIDATED", "NO_REVIEW_DATE"], "AMBER"],
};

for (const c of cases) {
  test(`${c.id} ${c.employee}`, () => {
    const result = assess(c, facts[c.id] ?? {}, evidence.filter((e) => e.caseId === c.id));
    const [codes, colour] = expected[c.id];
    assert.deepEqual(result.flags.map((f) => f.code).sort(), [...codes].sort());
    assert.equal(result.colour, colour);
    assert.notEqual(result.decision, "CAN_CLOSE");
  });
}

const eva = cases.find((c) => c.id === "ONB-005");
const events = [];
const state = () => applyEvents(eva, facts["ONB-005"], events);
const result = () => {
  const s = state();
  return assess(s.case, s.facts, [...evidence.filter((e) => e.caseId === eva.id), ...s.evidence]);
};
const send = (type, actorRole, payload) => {
  const error = validateEvent({ type, actorRole, payload }, state().facts);
  if (!error) events.push({ id: events.length + 1, caseId: eva.id, date: "2026-10-14", type, actorRole, payload });
  return error;
};

test("roles are limited to their own records", () => {
  assert.ok(send("VALIDATE", "ADDITIONAL_MANAGER", { sufficient: false, note: "x" }));
  assert.ok(send("ASSIGN", "HR", { project: "Atlas" })); // HR only finds people
  assert.ok(send("ASSIGN", "MANAGEMENT", { project: "Atlas" }));
  assert.ok(send("BLOCKER", "EMPLOYEE", { description: "password: abc" }));
});

test("Eva closes only after the technical owner validates real evidence", () => {
  assert.equal(send("VALIDATE", "TECH_LEAD", { sufficient: false, note: "Not observed yet" }), null);
  assert.equal(result().decision, "CANNOT_CLOSE");
  send("ASSIGN", "ADDITIONAL_MANAGER", { role: "Analyst", lineManager: "Luca Gray", techLead: "TL (demo)", ktOwner: "KT (demo)" });
  send("PLAN", "TECH_LEAD", { systems: ["Portal"], reviewDate: "2026-10-21", docsLocation: "/Team/Orion" });
  send("ACCESS", "EMPLOYEE", { system: "Portal", state: "USABLE" });
  for (const name of ["Standard requests", "Complex scenario 1", "Complex scenario 2"]) {
    send("ACTIVITY", "TECH_LEAD", { name, level: "INDEPENDENT" });
  }
  assert.equal(send("VALIDATE", "TECH_LEAD", { sufficient: true, outcome: "READY", note: "Observed" }), null);
  assert.equal(result().decision, "CAN_CLOSE");
});

test("moving to another project restarts onboarding", () => {
  const move = { id: 1, caseId: eva.id, date: "2026-10-14", type: "ASSIGN", actorRole: "ADDITIONAL_MANAGER", payload: { project: "Atlas" } };
  const s = applyEvents(eva, facts["ONB-005"], [move]);
  assert.equal(s.case.movement, "REALLOCATION");
  assert.deepEqual(s.facts.activities, []);
});
