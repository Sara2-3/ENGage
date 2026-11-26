// "Ask HR for people": used by Management and by the Additional Manager.
import { useState } from 'react';
import { api, directionInfo, directions } from './api';

const types = [['REALLOCATION', 'Someone from the company'], ['NEW_HIRE', 'New hire (onboarding)']];
const empty = { type: 'REALLOCATION', direction: '', project: '', need: '', skills: '', level: 'MID', startDate: '', notes: '' };

export default function AskHr({ role, projects, onSaved }: { role: string; projects: string[]; onSaved: () => void }) {
  const [draft, setDraft] = useState(empty);
  const [note, setNote] = useState('');
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [key]: e.target.value });
  const complete = draft.project.trim() && draft.need.trim() && draft.skills.trim()
    && (draft.type !== 'NEW_HIRE' || draft.direction);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/staffing', { actorRole: role, ...draft });
      setDraft({ ...empty, type: draft.type });
      setNote('Request sent to HR.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <form onSubmit={send}>
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
  );
}
