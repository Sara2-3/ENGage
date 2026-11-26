import { useState } from 'react';

import { words } from '../../Helper/format';
import { add_record_service, extract_service } from '../../Services/CaseService';

const authorRoles = [
  'LINE_MANAGER', 'TECH_LEAD', 'EMPLOYEE', 'ADDITIONAL_MANAGER', 'HR', 'PMO', 'ACCESS_SUPPORT', 'TRACKER',
];

const displayValue = (value) => Array.isArray(value) ? value.join(', ') : String(value ?? '');

export default function EvidenceExtractor({ caseId, role, onSaved }) {
  const [text, setText] = useState('');
  const [authorRole, setAuthorRole] = useState('LINE_MANAGER');
  const [result, setResult] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const extract = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const next = await extract_service(caseId, { actorRole: role, authorRole, text });
      setResult(next);
      setProposals(next.proposals);
    } catch (requestError) {
      setResult(null);
      setProposals([]);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const accept = async (proposal, index) => {
    setAccepting(index);
    setError('');
    setStatus('');
    try {
      await add_record_service(caseId, {
        type: proposal.type,
        actorRole: role,
        payload: proposal.payload,
      });
      setProposals((current) => current.filter((_, itemIndex) => itemIndex !== index));
      setStatus(`${words(proposal.type)} accepted and recorded.`);
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAccepting(null);
    }
  };

  const reject = (index) => {
    setProposals((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setStatus('Proposal rejected. Nothing was recorded.');
  };

  const noKey = result?.message.toLowerCase().includes('no ai key configured');

  return (
    <details className="extract-panel">
      <summary>Paste an email</summary>
      <p className="muted">AI proposes workflow records. You decide whether anything is saved.</p>
      <label>
        Author role
        <select value={authorRole} onChange={(event) => setAuthorRole(event.target.value)}>
          {authorRoles.map((author) => <option key={author} value={author}>{words(author)}</option>)}
        </select>
      </label>
      <label>
        Email or message
        <textarea
          rows={6}
          maxLength={5_000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the original message here."
        />
      </label>
      <button className="primary" type="button" disabled={busy || !text.trim()} onClick={extract}>
        {busy ? 'Extracting…' : 'Extract'}
      </button>

      {error && <p className="extract-error" role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}

      {result && (
        <div className="extract-result">
          <p><span className="pill AMBER">{result.source}</span></p>
          {noKey ? (
            <p className="muted">No AI key is configured, so nothing was extracted. You can still record updates manually.</p>
          ) : (
            <p className="muted">{result.message}</p>
          )}

          {proposals.map((proposal, index) => (
            <article className="proposal" key={`${proposal.type}-${proposal.quote}-${index}`}>
              <div className="proposal-head">
                <strong>{words(proposal.type)}</strong>
                <span className="pill AMBER">AI proposal, needs your approval</span>
              </div>
              <dl className="proposal-fields">
                {Object.entries(proposal.payload).map(([field, value]) => (
                  <div key={field}><dt>{words(field)}</dt><dd>{displayValue(value)}</dd></div>
                ))}
              </dl>
              <p className="proposal-quote"><mark>{proposal.quote}</mark></p>
              <p className="muted">Confidence: {Math.round(proposal.confidence * 100)}%</p>
              <div className="proposal-actions">
                <button className="primary" type="button" disabled={accepting !== null} onClick={() => accept(proposal, index)}>
                  {accepting === index ? 'Accepting…' : 'Accept'}
                </button>
                <button type="button" disabled={accepting !== null} onClick={() => reject(index)}>Reject</button>
              </div>
            </article>
          ))}

          {result.rejected.length > 0 && (
            <section className="extract-rejected">
              <h4>Rejected by validation</h4>
              <ul>
                {result.rejected.map((proposal, index) => (
                  <li key={`${proposal.type}-${index}`}>
                    <strong>{words(proposal.type)}:</strong> {proposal.reason}
                    {proposal.quote && <small>“{proposal.quote}”</small>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </details>
  );
}
