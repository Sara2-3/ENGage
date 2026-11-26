const assert = require("node:assert/strict");
const test = require("node:test");

const { FollowUpService } = require("../dist/onboarding/follow-up.service.js");

const existingTaskRow = {
  task_id: "task-existing",
  case_id: "ONB-005",
  task_type: "Technical Review",
  description: "Original review description",
  assignee_role: "Technical Lead",
  status: "Open",
  created_at: "2026-11-26T12:00:00.000Z",
};

test("returns the existing open task without overwriting its description", async () => {
  const calls = [];
  const databaseService = {
    isConfigured: () => true,
    query: async (text, values) => {
      calls.push({ text, values });
      return calls.length === 1 ? { rows: [] } : { rows: [existingTaskRow] };
    },
  };
  const onboardingService = {
    getCase: async () => ({ caseId: "ONB-005", evidence: [] }),
  };
  const service = new FollowUpService(databaseService, onboardingService);

  const task = await service.createTechnicalReview(
    "ONB-005",
    "A replacement description",
  );

  assert.equal(calls.length, 2);
  assert.match(calls[0].text, /ON CONFLICT/);
  assert.equal(calls[0].values[3], "A replacement description");
  assert.equal(task.description, "Original review description");
  assert.equal(task.assigneeRole, "Technical Lead");
  assert.equal(task.status, "Open");
});

test("rejects an empty description before accessing the database", async () => {
  let databaseCalled = false;
  const databaseService = {
    isConfigured: () => true,
    query: async () => {
      databaseCalled = true;
      return { rows: [] };
    },
  };
  const onboardingService = {
    getCase: async () => ({ caseId: "ONB-005", evidence: [] }),
  };
  const service = new FollowUpService(databaseService, onboardingService);

  await assert.rejects(
    service.createTechnicalReview("ONB-005", "   "),
    (error) =>
      error.getStatus() === 400 &&
      error.getResponse().status === "invalid_description",
  );
  assert.equal(databaseCalled, false);
});

test("keeps one open task in memory for repeated demo requests", async () => {
  const databaseService = {
    isConfigured: () => false,
    query: async () => {
      throw new Error("The mock demo must not query PostgreSQL");
    },
  };
  const onboardingService = {
    getCase: async () => ({ caseId: "ONB-005", evidence: [] }),
  };
  const service = new FollowUpService(databaseService, onboardingService);

  const first = await service.createTechnicalReview(
    "ONB-005",
    "Original demo task",
  );
  const repeated = await service.createTechnicalReview(
    "ONB-005",
    "Replacement text",
  );
  const loaded = await service.listForCase("ONB-005");

  assert.equal(repeated.taskId, first.taskId);
  assert.equal(repeated.description, "Original demo task");
  assert.deepEqual(loaded, [first]);
});
