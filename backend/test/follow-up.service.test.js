const assert = require("node:assert/strict");
const test = require("node:test");

const { FollowUpService } = require("../dist/follow-up.service.js");

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
