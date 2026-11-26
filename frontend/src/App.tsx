import { useEffect, useState } from "react";

type ViewState = "loading" | "ready" | "not-found" | "unavailable";

interface Evidence {
  sourceId: string;
  authorRole: string;
  date: string;
  originalText: string;
}

interface OnboardingCase {
  caseId: string;
  employeeName: string;
  projectName: string;
  reportedStatus: string;
  evidence: Evidence[];
}

interface EvidenceAnalysis {
  findings: Array<{
    claim: string;
    sourceId: string;
    quote: string;
  }>;
  evidenceGap: {
    text: string;
    sourceIds: string[];
  };
  suggestedNextAction: {
    text: string;
    sourceIds: string[];
  };
}

type AnalysisState = "idle" | "loading" | "ready" | "error";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const DEMO_CASE_ID = "ONB-005";

function StatusMessage({ state }: { state: Exclude<ViewState, "ready"> }) {
  const messages = {
    loading: {
      title: "Loading onboarding case",
      detail: "Contacting the ENGage API and PostgreSQL database...",
    },
    "not-found": {
      title: "Onboarding case not found",
      detail: `The API could not find case ${DEMO_CASE_ID}. Run the database seed and try again.`,
    },
    unavailable: {
      title: "Onboarding data unavailable",
      detail: "The API or PostgreSQL database could not be reached. Check the local services and try again.",
    },
  } as const;
  const message = messages[state];

  return (
    <section className={`message message--${state}`} aria-live="polite">
      <span className="message__dot" aria-hidden="true" />
      <div>
        <h2>{message.title}</h2>
        <p>{message.detail}</p>
      </div>
    </section>
  );
}

function CaseView({ onboardingCase }: { onboardingCase: OnboardingCase }) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysis, setAnalysis] = useState<EvidenceAnalysis | null>(null);

  async function analyzeEvidence() {
    setAnalysisState("loading");
    setAnalysis(null);

    try {
      const response = await fetch(
        `${API_URL}/onboarding/cases/${onboardingCase.caseId}/analyze`,
        { method: "POST" },
      );

      if (!response.ok) {
        setAnalysisState("error");
        return;
      }

      const result = (await response.json()) as EvidenceAnalysis;
      setAnalysis(result);
      setAnalysisState("ready");
    } catch {
      setAnalysisState("error");
    }
  }

  return (
    <>
      <section className="case-header">
        <div>
          <p className="eyebrow">PMO onboarding case</p>
          <h1>{onboardingCase.employeeName}</h1>
          <p className="case-reference">
            {onboardingCase.projectName} <span aria-hidden="true">·</span>{" "}
            {onboardingCase.caseId}
          </p>
        </div>
        <p className="service-state">API and database connected</p>
      </section>

      <section className="reported-status" aria-label="Reported tracker status">
        <span>Reported status</span>
        <strong>{onboardingCase.reportedStatus}</strong>
        <p>This is the status reported in the onboarding tracker.</p>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Source records</p>
          <h2>Evidence</h2>
        </div>

        <div className="evidence-list">
          {onboardingCase.evidence.map((source) => (
            <details className="evidence" key={source.sourceId}>
              <summary>
                <span>
                  <strong>{source.sourceId}</strong>
                  <small>{source.authorRole}</small>
                </span>
                <span className="evidence__date">{source.date}</span>
              </summary>
              <div className="evidence__body">
                <dl>
                  <div>
                    <dt>Source ID</dt>
                    <dd>{source.sourceId}</dd>
                  </div>
                  <div>
                    <dt>Author role</dt>
                    <dd>{source.authorRole}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{source.date}</dd>
                  </div>
                </dl>
                <p>{source.originalText}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="review-note">
        <p className="eyebrow">Evidence gap</p>
        <h2>Technical review needed</h2>
        <p>
          The Line Manager reports that local onboarding is closed, while the
          Technical Lead identifies two complex scenarios that Eva still needs
          to cover. The supplied evidence does not confirm whether the local
          assessment includes those scenarios.
        </p>
        <p className="readiness">
          <strong>Final technical readiness:</strong> Not confirmed in the
          supplied evidence. The reported tracker status remains Ready with
          Support.
        </p>
      </section>

      <section className="analysis-panel">
        <div className="analysis-panel__header">
          <div>
            <p className="eyebrow">AI-assisted review</p>
            <h2>Evidence analysis</h2>
            <p>
              Generate traceable suggestions from the original case evidence.
            </p>
          </div>
          <button
            className="analyze-button"
            disabled={analysisState === "loading"}
            onClick={() => void analyzeEvidence()}
            type="button"
          >
            {analysisState === "loading"
              ? "Analyzing evidence..."
              : "Analyze evidence"}
          </button>
        </div>

        {analysisState === "error" && (
          <p className="analysis-error" role="alert">
            Evidence analysis is unavailable. The reported status and original
            emails remain unchanged; check the backend configuration and try
            again.
          </p>
        )}

        {analysisState === "ready" && analysis && (
          <div className="analysis-results">
            <h3>What the evidence supports</h3>
            <div className="finding-list">
              {analysis.findings.map((finding, index) => (
                <article className="finding" key={`${finding.sourceId}-${index}`}>
                  <span className="source-label">{finding.sourceId}</span>
                  <p>{finding.claim}</p>
                  <blockquote>{finding.quote}</blockquote>
                </article>
              ))}
            </div>

            <div className="analysis-summary">
              <article>
                <h3>What still needs verification</h3>
                <p>{analysis.evidenceGap.text}</p>
                <p className="source-trace">
                  Sources: {analysis.evidenceGap.sourceIds.join(", ")}
                </p>
              </article>
              <article>
                <h3>Suggested next action</h3>
                <p>{analysis.suggestedNextAction.text}</p>
                <p className="source-trace">
                  Sources: {analysis.suggestedNextAction.sourceIds.join(", ")}
                </p>
              </article>
            </div>

            <p className="analysis-disclaimer">
              This is an AI-generated suggestion for PMO review. The reported
              tracker status remains unchanged, and the Technical Lead confirms
              final technical readiness.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function App() {
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [onboardingCase, setOnboardingCase] =
    useState<OnboardingCase | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCase() {
      try {
        const response = await fetch(
          `${API_URL}/onboarding/cases/${DEMO_CASE_ID}`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          setViewState("not-found");
          return;
        }

        if (!response.ok) {
          setViewState("unavailable");
          return;
        }

        const caseData = (await response.json()) as OnboardingCase;
        setOnboardingCase(caseData);
        setViewState("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setViewState("unavailable");
      }
    }

    void loadCase();
    return () => controller.abort();
  }, []);

  return (
    <main className="page-shell">
      <div className="app-frame">
        <header className="brand-bar">
          <a href="/" aria-label="ENGage home">
            ENGage
          </a>
          <span>Team ONYX</span>
        </header>

        {viewState === "ready" && onboardingCase ? (
          <CaseView onboardingCase={onboardingCase} />
        ) : (
          <StatusMessage state={viewState === "ready" ? "unavailable" : viewState} />
        )}
      </div>
    </main>
  );
}

export default App;
