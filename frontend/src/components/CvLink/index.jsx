// The CV of an employee. HR can also upload one, or replace it.
import { useState } from 'react';
import { cvUrl, uploadCv } from '../../Services/CaseService';

const CvLink = ({ c, role, onSaved }) => {
  const [note, setNote] = useState('');

  const upload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024) {
      setNote('Choose a PDF of at most 2 MB.');
    } else {
      try {
        await uploadCv(c.case.id, file);
        setNote('CV saved.');
        onSaved?.();
      } catch (error) { setNote(error.message); }
    }
    input.value = ''; // so the same file can be chosen again
  };

  return (
    <span className="cv-box">
      {c.hasCv
        ? <a className="cv" href={cvUrl(c.case.id, role)} target="_blank" rel="noreferrer" aria-label={`CV of ${c.case.employee} (PDF)`}>CV (PDF)</a>
        : <span className="muted">No CV</span>}
      {onSaved && (
        <label className="upload">
          {c.hasCv ? 'Replace' : 'Upload CV'}
          <input type="file" accept="application/pdf" className="sr-only" onChange={upload} aria-label={`Upload CV of ${c.case.employee} (PDF)`} />
        </label>
      )}
      {note && <span role="status" className="muted">{note}</span>}
    </span>
  );
};

export default CvLink;
