// Management: knows all company projects and asks HR for people according to project needs.
import { useState } from 'react';
import { api, directionInfo, directions,type StaffingRequest } from '../api';
import AssignProject from '../AssignProject';
import CvLink from '../CvLink';
import { Person, Title, type Case } from '../shared';

const types = [['REALLOCATION', 'Someone from the company'], ['NEW_HIRE', 'New hire (onboarding)']];
const empty = { type: 'REALLOCATION', direction: '', project: '', need: '', skills: '', level: 'MID', startDate: '', notes: '' };

export default function Executive({ cases, staffing, onOpen, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onSaved: () => void;
}) {
  const [draft, setDraft] = useState(empty);
  const [note, setNote] = useState('');

  const projects = [...new Set([
    ...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])),
    ...staffing.map((s) => s.project),
  ])].sort();
  const urgent = cases.filter((c) => c.assessment.colour === 'RED');
  // People without a project who are not already listed under a request.
  const unassigned = cases.filter((c) => !c.case.project && !staffing.some((s) => s.caseId === c.case.id && !s.specs?.assigned));
  const name = (id: string | null) => cases.find((c) => c.case.id === id)?.case.employee;

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [key]: e.target.value });
  const complete = draft.project.trim() && draft.need.trim() && draft.skills.trim()
    && (draft.type !== 'NEW_HIRE' || draft.direction);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/staffing', { actorRole: 'MANAGEMENT', ...draft });
      setDraft({ ...empty, type: draft.type });
      setNote('Request sent to HR.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <div className="narrow">
      <Title title="Management" need="Ask HR for the people your projects need, and see what is at risk." />

      <form className="card now" onSubmit={send}>
        <p className="eyebrow">Ask HR for people</p>
        <fieldset className="choice">
          <legend>Who do you need?</legend>
          {types.map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="type" value={value} checked={draft.type === value} onChange={set('type')} />
              {label}
            </label>
          ))}
        </fieldset>
        {draft.type === 'NEW_HIRE' && (
          <label>Professional direction
            <select value={draft.direction} onChange={set('direction')} required>
              <option value="">Choose a direction</option>
              {directions.map((d) => <option key={d}>{d}</option>)}
            </select>
            {draft.direction && <small>{directionInfo[draft.direction]}</small>}
          </label>
        )}
        <label>Project
          <input list="all-projects" value={draft.project} onChange={set('project')} placeholder="Choose or type a project" required />
        </label>
        <datalist id="all-projects">{projects.map((p) => <option key={p} value={p} />)}</datalist>
        <label>Role needed
          <input value={draft.need} onChange={set('need')} maxLength={200} placeholder="For example: support analyst" required />
        </label>
        <label>Technical skills
          <input value={draft.skills} onChange={set('skills')} maxLength={200} placeholder="For example: Java, SQL, Linux" required />
        </label>
        <div className="pair">
          <label>Level
            <select value={draft.level} onChange={set('level')}>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
          </label>
          <label>Needed from (optional)
            <input type="date" value={draft.startDate} onChange={set('startDate')} />
          </label>
        </div>
        <label>Other requirements (optional)
          <textarea rows={2} value={draft.notes} onChange={set('notes')} maxLength={200} placeholder="For example: English B2, on-call shifts" />
        </label>
        <button className="primary" disabled={!complete}>Send request</button>
        {note && <p role="status">{note}</p>}
      </form>

      {staffing.length > 0 && (
        <section className="card">
          <h3>Your requests</h3>
          {staffing.map((s) => (
            <div className="item" key={s.id}>
              <div className="grow">
                {s.caseId
                  ? <Person name={name(s.caseId) ?? s.caseId} onOpen={() => onOpen(s.caseId!)} />
                  : <strong>{s.need}</strong>}
                {cases.filter((c) => c.case.id === s.caseId).map((c) => <small key={c.case.id}><CvLink c={c} role="MANAGEMENT" /></small>)}
                <small>{s.project} · {s.need}{s.specs?.skills && ` · ${s.specs.skills}`}</small>
              </div>
              {!s.caseId && <span className="pill AMBER">Waiting for HR</span>}
              {s.caseId && s.specs?.assigned && <span className="pill GREEN">Assigned</span>}
              {s.caseId && !s.specs?.assigned && (
                <>
                  <span className="pill AMBER">Found by HR</span>
                  <AssignProject caseId={s.caseId} name={name(s.caseId) ?? s.caseId} requestId={s.id}
                    project={s.project} role={s.need} onSaved={onSaved} />
                </>
              )}
            </div>
          ))}
        </section>
      )}

      {unassigned.length > 0 && (
        <section className="card">
          <h3>Waiting for a project ({unassigned.length})</h3>
          {unassigned.map((c) => (
            <div className="item" key={c.case.id}>
              <div className="grow">
                <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
                <small>{c.case.direction ?? 'Reallocation'}</small>
              </div>
              <AssignProject caseId={c.case.id} name={c.case.employee} onSaved={onSaved} />
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h3>At risk ({urgent.length})</h3>
        {urgent.map((c) => (
          <div className="item" key={c.case.id}>
            <div className="grow">
              <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
              <small>{c.assessment.flags[0]?.message}</small>
            </div>
          </div>
        ))}
        {!urgent.length && <p className="muted">Nothing is at risk.</p>}
      </section>

      <details className="card">
        <summary>Employee CVs ({cases.filter((c) => c.hasCv).length})</summary>
        {cases.map((c) => (
          <div className="item" key={c.case.id}>
            <div className="grow"><Person name={c.case.employee} /></div>
            <CvLink c={c} role="MANAGEMENT" />
          </div>
        ))}
      </details>

      <details className="card">
        <summary>All projects ({projects.length})</summary>
        {projects.map((p) => (
          <div className="item" key={p}>
            <strong>{p}</strong>
            <span className="muted">{cases.filter((c) => c.case.project === p).map((c) => c.case.employee).join(', ') || 'Nobody yet'}</span>
          </div>
        ))}
      </details>
    </div>
  );
}
