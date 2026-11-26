import { useState } from 'react';
import { api, directions } from './api';

const empty = { actorRole: 'HR', employee: '', movement: 'NEW_HIRE', startDate: '', project: '', direction: '' };

export default function NewCase({ onCreated }: { onCreated: (id: string) => void }) {
  const [draft, setDraft] = useState(empty);
  const [note, setNote] = useState('');
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft({ ...draft, [key]: e.target.value });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api<{ id: string }>('/cases', draft);
      setDraft(empty);
      onCreated(created.id);
    } catch (err) { setNote((err as Error).message); }
  };

  return (
    <details className="card">
      <summary>Open a new case</summary>
      <form onSubmit={create}>
        <label>Employee (fictional)<input value={draft.employee} onChange={set('employee')} /></label>
        <label>Movement
          <select value={draft.movement} onChange={set('movement')}>
            <option value="NEW_HIRE">New hire</option>
            <option value="REALLOCATION">Reallocation</option>
          </select>
        </label>
        {draft.movement === 'NEW_HIRE' && (
          <label>Professional direction
            <select value={draft.direction} onChange={set('direction')} required>
              <option value="">Choose a direction</option>
              {directions.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
        )}
        <label>Start date<input type="date" value={draft.startDate} onChange={set('startDate')} /></label>
        <label>Project<input value={draft.project} onChange={set('project')} /></label>
        <button className="primary">Open case</button>
        {note && <p role="status">{note}</p>}
      </form>
    </details>
  );
}
