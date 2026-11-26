export interface OnboardingCase {
  caseId: string;
  employeeName: string;
  projectName: string;
  reportedStatus: string;
  evidence: Array<{
    sourceId: string;
    authorRole: string;
    date: string;
    originalText: string;
  }>;
}
