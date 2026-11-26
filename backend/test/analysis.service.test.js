const assert = require("node:assert/strict");
const test = require("node:test");

const { AnalysisService } = require("../dist/analysis.service.js");

const onboardingCase = {
  caseId: "ONB-005",
  employeeName: "Eva Stone",
  projectName: "Project Orion",
  reportedStatus: "Ready with Support",
  evidence: [
    {
      sourceId: "Email 3",
      authorRole: "Technical Lead",
      date: "2026-10-13",
      originalText:
        "Eva completed the first training topics and can handle standard requests with occasional support. Two complex scenarios still need to be covered. The Technical Lead classifies her as Ready with Support.",
    },
    {
      sourceId: "Email 4",
      authorRole: "Line Manager",
      date: "2026-10-13",
      originalText:
        "From the local side everything looks complete and Eva is working independently. The Line Manager considers onboarding closed.",
    },
  ],
};

const validAnalysis = {
  findings: [
    {
      claim:
        "Eva can handle standard requests with occasional support and has two complex scenarios left to cover.",
      sourceId: "Email 3",
      quote:
        "can handle standard requests with occasional support. Two complex scenarios still need to be covered.",
    },
    {
      claim: "The Line Manager considers local onboarding closed.",
      sourceId: "Email 4",
      quote: "The Line Manager considers onboarding closed.",
    },
  ],
  evidenceGap: {
    text: "It is unclear whether local closure includes the two complex scenarios.",
    sourceIds: ["Email 3", "Email 4"],
  },
  suggestedNextAction: {
    text: "Ask the Technical Lead to review the two scenarios and record what Eva can perform independently.",
    sourceIds: ["Email 3", "Email 4"],
  },
};

function createService(modelOutput) {
  const onboardingService = {
    getCase: async () => onboardingCase,
  };
  const analysisModel = {
    analyzeEvidence: async () => modelOutput,
  };

  return new AnalysisService(onboardingService, analysisModel);
}

test("accepts valid findings whose citations match case evidence", async () => {
  const result = await createService(validAnalysis).analyzeCase("ONB-005");

  assert.deepEqual(result, validAnalysis);
});

test("rejects a finding with an unknown source ID", async () => {
  const invalidAnalysis = structuredClone(validAnalysis);
  invalidAnalysis.findings[0].sourceId = "Email 99";

  await assert.rejects(
    createService(invalidAnalysis).analyzeCase("ONB-005"),
    (error) =>
      error.getStatus() === 502 &&
      error.getResponse().status === "invalid_analysis",
  );
});

test("rejects a quote that is missing from its source text", async () => {
  const invalidAnalysis = structuredClone(validAnalysis);
  invalidAnalysis.findings[0].quote = "Eva completed every complex scenario.";

  await assert.rejects(
    createService(invalidAnalysis).analyzeCase("ONB-005"),
    (error) =>
      error.getStatus() === 502 &&
      error.getResponse().status === "invalid_analysis",
  );
});
