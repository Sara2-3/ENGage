// Evidence Brief for PMO, Additional Manager and Technical Lead.
// Evidence, gaps and actions come from the deterministic rules. The AI only words the conflict
// explanation, "what would change the decision" and the draft message. A human approves the draft.
import { useState } from 'react';

import { api, words } from './api';

interface Brief {
  evidence: { id: string; authorRole: string; quote: string; text: string }[];
  gaps: {
    flags: { code: string; severity?: string; message: string; evidenceIds?: string[] }[];
    unknowns: { item: string; state: string }[];
  };
  actions: { title: string; ownerRole: string }[];
  whatWouldChangeTheDecision: string;
  conflictExplanation: string;
  draft: { to: string; subject: string; body: string };
  citedEvidenceIds: string[];
  source: string;
}

const short = (text: string) => (text.length > 170 ? `${text.slice(0, 170)}…` : text);

export default function EvidenceBrief({ caseId, role }: { caseId: string; role: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [message, setMessage] = useState('');
  const [draftOpen, setDraftOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const build = async () => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const next = await api<Brief>(`/cases/${caseId}/brief`, { actorRole: role });
      setBrief(next);
      setMessage(next.draft.body);
      setDraftOpen(true);
    } catch (requestError) {
      setBrief(null);
      setError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision: 'approved' | 'rejected') => {
    setError('');
    try {
      await api(`/cases/${caseId}/reviews`, { decision, message });
      setDraftOpen(false);
      setNote(decision === 'approved'
        ? 'Approved. Sending is simulated: the decision is only recorded.'
        : 'Draft rejected. Nothing was sent.');
    } catch (requestError) {
      setError((requestError as Error).message || 'Could not save the review. The message cannot be empty.');
    }
  };

  const cited = new Set(brief?.citedEvidenceIds ?? []);
  const evidence = [...(brief?.evidence ?? [])].sort((a, b) => Number(cited.has(b.id)) - Number(cited.has(a.id)));
  const fromAi = brief?.source.startsWith('AI');

  return (
    <section className="card brief" aria-label="Evidence brief">
      <div className="brief-head">
        <div>
          <p className="eyebrow">Evidence brief</p>
          <h2>Can this onboarding be closed, and if not, who must do what?</h2>
        </div>
        <button className="primary" type="button" disabled={busy} onClick={build}>
          {busy ? 'Building…' : brief ? 'Rebuild brief' : 'Build Evidence Brief'}
        </button>
      </div>

      {error && <p className="extract-error" role="alert">{error}</p>}

      {brief && (
        <>
          <p>
            <span className={`pill ${fromAi ? 'AMBER' : 'GREY'}`}>{brief.source}</span>{' '}
            <span className="muted">Evidence, gaps and actions come from the rules. The AI only words the text below.</span>
          </p>

          <div className="brief-cols">
            <div className="brief-col">
              <h3>Evidence</h3>
              {evidence.length === 0 && <p className="muted">No evidence recorded. Only the tracker row exists.</p>}
              {evidence.map((e) => (
                <div className="brief-item" key={e.id}>
                  <strong>{e.id}</strong> · {words(e.authorRole)}
                  {cited.has(e.id) && <> <span className="pill AMBER">Cited</span></>}
                  <p className="brief-quote">“{short(e.quote)}”</p>
                  <details className="brief-source">
                    <summary>View original source</summary>
                    <p>{e.text}</p>
                    <small className="muted">{e.id} · {words(e.authorRole)}</small>
                  </details>
                </div>
              ))}
            </div>

            <div className="brief-col">
              <h3>Gap</h3>
              <div className="brief-item">
                <strong>Conflict explained</strong>
                <p>{brief.conflictExplanation}</p>
              </div>
              <div className="brief-item">
                <strong>Flags</strong>
                {brief.gaps.flags.length
                  ? <ul>{brief.gaps.flags.map((f) => <li key={f.code}>{f.message}</li>)}</ul>
                  : <p className="muted">No flags.</p>}
              </div>
              <div className="brief-item">
                <strong>Unknown or unconfirmed</strong>
                {brief.gaps.unknowns.length
                  ? <ul>{brief.gaps.unknowns.map((u) => <li key={u.item}>{u.item}: {words(u.state)}</li>)}</ul>
                  : <p className="muted">Everything is confirmed.</p>}
              </div>
            </div>

            <div className="brief-col">
              <h3>Action</h3>
              {brief.actions.length
                ? <ol>{brief.actions.map((a) => <li key={`${a.ownerRole}-${a.title}`}><strong>{a.ownerRole}:</strong> {a.title}</li>)}</ol>
                : <p className="muted">No further action required by the rules.</p>}
            </div>
          </div>

          <div className="brief-change">
            <strong>What would change the decision?</strong>
            <p>{brief.whatWouldChangeTheDecision}</p>
          </div>

          {draftOpen && (
            <div className="brief-draft">
              <h3>Drafted follow-up</h3>
              <p className="muted">To: {brief.draft.to} · {brief.draft.subject}</p>
              <textarea rows={9} value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Message draft" />
              <p className="muted">Sending is simulated. The decision is only recorded.</p>
              <button className="primary" type="button" onClick={() => decide('approved')}>Approve</button>{' '}
              <button type="button" onClick={() => decide('rejected')}>Reject</button>
            </div>
          )}
          {note && <p role="status">{note}</p>}
        </>
      )}
    </section>
  );
}
