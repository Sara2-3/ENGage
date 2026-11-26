// Evidence Brief for PMO, Additional Manager and Technical Lead.
// Evidence, gaps and actions come from the deterministic rules. The AI only words the conflict
// explanation, "what would change the decision" and the draft message. A human approves the draft.
import { useState } from 'react';

import { words } from '../../Helper/format';
import { build_brief_service, review_draft_service } from '../../Services/CaseService';

const short = (text) => (text.length > 170 ? `${text.slice(0, 170)}…` : text);

export default function EvidenceBrief({ caseId, role }) {
  const [brief, setBrief] = useState(null);
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
      const next = await build_brief_service(caseId, { actorRole: role });
      setBrief(next);
      setMessage(next.draft.body);
      setDraftOpen(true);
    } catch (requestError) {
      setBrief(null);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision) => {
    setError('');
    try {
      await review_draft_service(caseId, { decision, message });
      setDraftOpen(false);
      setNote(decision === 'approved'
        ? 'Approved. Sending is simulated: the decision is only recorded.'
        : 'Draft rejected. Nothing was sent.');
    } catch (requestError) {
      setError(requestError.message || 'Could not save the review. The message cannot be empty.');
    }
  };

  const cited = new Set(brief?.citedEvidenceIds ?? []);
  const evidence = [...(brief?.evidence ?? [])].sort((a, b) => Number(cited.has(b.id)) - Number(cited.has(a.id)));
  const fromAi = brief?.source.startsWith('AI');
  const currentDecision = brief && typeof document !== 'undefined'
    ? document.querySelector('.now h2')?.textContent?.trim()
    : '';
  const firstFlag = brief?.gaps?.flags?.[0];
  const firstUnknown = brief?.gaps?.unknowns?.[0];
  const mainReason = firstFlag?.message
    ?? (firstUnknown ? `${firstUnknown.item}: ${words(firstUnknown.state)}` : '');
  const nextAction = brief?.actions?.[0];

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
          <div className="brief-summary" aria-label="Decision summary">
            {currentDecision && <p><strong>Current decision</strong><span>{currentDecision}</span></p>}
            {mainReason && <p><strong>Main reason</strong><span>{mainReason}</span></p>}
            {nextAction?.ownerRole && <p><strong>Next owner</strong><span>{words(nextAction.ownerRole)}</span></p>}
            {nextAction?.title && <p><strong>Next action</strong><span>{nextAction.title}</span></p>}
          </div>

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
              <div className="brief-review-actions">
                <button className="primary" type="button" onClick={() => decide('approved')}>Approve follow-up draft</button>
                <button type="button" onClick={() => decide('rejected')}>Reject draft</button>
                <span className="muted">Sending is simulated. This does not close the onboarding case.</span>
              </div>
            </div>
          )}
          {note && <p role="status">{note}</p>}
        </>
      )}
    </section>
  );
}
