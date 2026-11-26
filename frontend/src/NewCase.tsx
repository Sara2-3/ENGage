// HR adds an employee in a module. The description is suggested from the direction and project,
// and HR can change it before saving.
import { useState } from 'react';
import { api, directionInfo, directions } from './api';
import Modal from './Modal';

const empty = { actorRole: 'HR', employee: '', movement: 'NEW_HIRE', startDate: '', project: '', direction: '' };

export default function NewCase({ onCreated }: { onCreated: (id: string) => void }) {
  const [draft, setDraft] = useState(empty);
  const [typed, setTyped] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft({ ...draft, [key]: e.target.value });

  const isNew = draft.movement === 'NEW_HIRE';
  const project = draft.project.trim();
  const suggestion = isNew
    ? draft.direction
      ? `New hire in the ${draft.direction} direction${project && `, joining project ${project}`}. ${directionInfo[draft.direction]}`
      : ''
    : `You are moving to ${project ? `project ${project}` : 'a new project'}.`;
  const description = typed ?? suggestion;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api<{ id: string }>('/cases', { ...draft, direction: isNew ? draft.direction : '', description });
      setDraft(empty);
      setTyped(null);
      onCreated(created.id);
    } catch (err) { setNote((err as Error).message); }
  };

  return (
    <div className="add">
      <Modal title="+ Add new employee">
        <form onSubmit={create}>
          <label>Employee name (fictional)<input value={draft.employee} onChange={set('employee')} required /></label>
          <label>Movement
            <select value={draft.movement} onChange={set('movement')}>
              <option value="NEW_HIRE">New hire</option>
              <option value="REALLOCATION">Reallocation</option>
            </select>
          </label>
          {isNew && (
            <label>Professional direction
              <select value={draft.direction} onChange={set('direction')} required>
                <option value="">Choose a direction</option>
                {directions.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
          )}
          <label>Project<input value={draft.project} onChange={set('project')} /></label>
          <label>Start date<input type="date" value={draft.startDate} onChange={set('startDate')} required /></label>
          <label>Description the employee sees
            <textarea rows={4} maxLength={500} value={description} onChange={(e) => setTyped(e.target.value)}
              placeholder="Choose a direction to get a suggestion" required />
          </label>
          <button className="primary">Add employee</button>
          {note && <p role="status">{note}</p>}
        </form>
      </Modal>
    </div>
  );
}
