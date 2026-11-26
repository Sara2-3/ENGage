// A review written by one of the levels above; the employee reads it in their profile.
import { useState } from 'react';
import { api, words } from './api';
import Modal from './Modal';
import type { Case } from './shared';

export const reviewers: Record<string, string> = {
  MANAGEMENT: 'Management', HR: 'HR', ADDITIONAL_MANAGER: 'Additional Manager',
  TECH_LEAD: 'Technical Lead', LINE_MANAGER: 'Line Manager',
};
export const tones: Record<string, string> = { VERY_GOOD: 'GREEN', GOOD: 'GREEN', NEEDS_IMPROVEMENT: 'AMBER' };

export default function Review({ c, role, onSaved }: { c: Case; role: string; onSaved: () => void }) {
  const [rating, setRating] = useState('GOOD');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  if (!reviewers[role]) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'REVIEW', actorRole: role, payload: { rating, text } });
      setText('');
      setNote('Saved. The employee can see it in their profile.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <Modal title="Review">
      <p>Review of <strong>{c.case.employee}</strong> as {reviewers[role]}. The employee can read it.</p>
      <form onSubmit={save}>
        <label>Rating
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {Object.keys(tones).map((r) => <option key={r} value={r}>{words(r)}</option>)}
          </select>
        </label>
        <label>Comment
          <textarea rows={4} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <button className="primary" disabled={!text.trim()}>Save review</button>
        {note && <p role="status">{note}</p>}
      </form>
    </Modal>
  );
}
