// Evidence analysis (AI model or simulation, quote-checked by the backend) and the technical review task.
// Available for the demo case the analysis API serves (ONB-005).
import { useEffect, useState } from 'react';
import { get_follow_ups_service, analyze_service, create_follow_up_service } from '../../Services/AnalysisService';

const DEFAULT_TASK = 'Ask the Technical Lead to review the two complex scenarios and record what Eva can perform independently.';

const EvidenceReview = ({ caseId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [description, setDescription] = useState(DEFAULT_TASK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = tasks.find((t) => t.taskType === 'Technical Review' && t.status === 'Open');

  useEffect(() => {
    get_follow_ups_service(caseId).then(setTasks).catch(() => setError('Saved tasks could not be loaded.'));
  }, [caseId]);

  const analyze = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await analyze_service(caseId);
      setAnalysis(result);
      if (!open) setDescription(result.suggestedNextAction.text);
    } catch {
      setError('Evidence analysis is unavailable. The tracker status and emails are unchanged.');
    }
    setBusy(false);
  };
  const assign = async () => {
    setError('');
    try {
      const task = await create_follow_up_service(caseId, { description: description.trim() });
      setTasks((current) => [task, ...current.filter((t) => t.taskId !== task.taskId)]);
    } catch { setError('The technical review task could not be saved.'); }
  };

  return (
    <div className="columns">
      <section className="card">
        <h3>Evidence analysis{analysis && `: ${analysis.source}`}</h3>
        <button className="primary" onClick={analyze} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze evidence'}</button>
        {analysis && (
          <>
            {analysis.findings.map((f, i) => (
              <blockquote key={i}>{f.claim}<small>“{f.quote}” · {f.sourceId}</small></blockquote>
            ))}
            <p><strong>Still to verify:</strong> {analysis.evidenceGap.text}<small>Sources: {analysis.evidenceGap.sourceIds.join(', ')}</small></p>
            <p><strong>Suggested next action:</strong> {analysis.suggestedNextAction.text}<small>Sources: {analysis.suggestedNextAction.sourceIds.join(', ')}</small></p>
            <p className="muted">A suggestion for human review. The Technical Lead confirms final readiness.</p>
          </>
        )}
      </section>

      <section className="card">
        <h3>Technical review task</h3>
        {open ? (
          <>
            <span className="pill AMBER">{open.status}</span>
            <p>{open.description}</p>
            <p className="muted">Assigned to {open.assigneeRole} · {new Date(open.createdAt).toLocaleString()}</p>
          </>
        ) : (
          <>
            <label>Task description
              <textarea rows={4} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <button className="primary" onClick={assign} disabled={!description.trim()}>Assign technical review</button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
};

export default EvidenceReview;
