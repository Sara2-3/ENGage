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
