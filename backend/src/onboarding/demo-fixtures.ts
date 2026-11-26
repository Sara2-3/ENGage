import type { OnboardingCase } from "./onboarding.service";

export const DEMO_ONBOARDING_CASE: OnboardingCase = {
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
