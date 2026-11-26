// A review written by one of the levels above; the employee reads it in their profile.
import { useState } from 'react';
import { words } from '../../Helper/format';
import Modal from '../Modal';
import { add_record_service } from '../../Services/CaseService';

export const reviewers = {
  MANAGEMENT: 'Management', HR: 'HR', ADDITIONAL_MANAGER: 'Additional Manager',
  TECH_LEAD: 'Technical Lead', LINE_MANAGER: 'Line Manager',
};
export const tones = { VERY_GOOD: 'GREEN', GOOD: 'GREEN', NEEDS_IMPROVEMENT: 'AMBER' };

const Review = ({ c, role, onSaved }) => {
  const [rating, setRating] = useState('GOOD');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  if (!reviewers[role]) return null;

  const save = async (e) => {
    e.preventDefault();
    try {
      await add_record_service(c.case.id, { type: 'REVIEW', actorRole: role, payload: { rating, text } });
      setText('');
      setNote('Saved. The employee can see it in their profile.');
      onSaved();
    } catch (error) { setNote(error.message); }
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
};

export default Review;
