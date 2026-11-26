// Management: knows all company projects and asks HR for people according to project needs.
import { useState } from 'react';
import { api, directionInfo, directions,type StaffingRequest } from '../api';
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
        {staffing.length > 0 && (
          <ul>
            {staffing.map((s) => (
              <li key={s.id}>{s.specs?.type === 'NEW_HIRE' && 'New hire · '}{s.project}: {s.need}{s.specs?.skills && ` (${s.specs.skills})`}. {s.status === 'OPEN' ? 'Waiting for HR' : `Filled with ${name(s.caseId) ?? s.caseId}`}</li>
            ))}
          </ul>
        )}
      </form>

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
