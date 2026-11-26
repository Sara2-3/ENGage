// HR adds an employee in a module. The description is suggested from the direction and project,
// and HR can change it before saving.
import { useState } from 'react';
import { api, directionInfo, directions, uploadCv } from './api';
import Modal from './Modal';

const empty = { actorRole: 'HR', employee: '', movement: 'NEW_HIRE', startDate: '', direction: '' };

export default function NewCase({ onCreated }: { onCreated: (id: string) => void }) {
  const [draft, setDraft] = useState(empty);
  const [typed, setTyped] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft({ ...draft, [key]: e.target.value });

  const isNew = draft.movement === 'NEW_HIRE';
  const suggestion = isNew
    ? draft.direction
      ? `New hire in the ${draft.direction} direction. ${directionInfo[draft.direction]}`
      : ''
    : 'You are moving to a new project.';
  const description = typed ?? suggestion;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cv && (cv.type !== 'application/pdf' || cv.size > 2 * 1024 * 1024)) {
      setNote('The CV must be a PDF of at most 2 MB.');
      return;
    }
    const form = e.currentTarget as HTMLFormElement;
    try {
      const created = await api<{ id: string }>('/cases', { ...draft, direction: isNew ? draft.direction : '', description });
      // The employee exists even if the CV is refused, so say so rather than inviting a second "Add".
      if (cv) await uploadCv(created.id, cv).catch((err) => window.alert(`Employee added, but the CV was not saved: ${err.message}`));
      form.reset();
      setCv(null);
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
          <label>Start date<input type="date" value={draft.startDate} onChange={set('startDate')} required /></label>
          <label>Description the employee sees
            <textarea rows={4} maxLength={500} value={description} onChange={(e) => setTyped(e.target.value)}
              placeholder="Choose a direction to get a suggestion" required />
          </label>
          <label>CV (PDF, optional, fictional data only)
            <input type="file" accept="application/pdf" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
          </label>
          <button className="primary">Add employee</button>
          {note && <p role="status">{note}</p>}
        </form>
      </Modal>
    </div>
  );
}
