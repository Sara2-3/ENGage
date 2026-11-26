// The Additional Manager decides which project a person goes to and who is in their team.
import { useState } from 'react';
import Modal from '../Modal';
import { assign_project_service } from '../../Services/StaffingService';

const fields = [
  ['project', 'Project'], ['role', 'Exact role'], ['lineManager', 'Line Manager'],
  ['techLead', 'Technical Lead'], ['ktOwner', 'Additional Manager'],
];

const AssignProject = ({ caseId, name, requestId, project = '', role = '', onSaved }) => {
  const [draft, setDraft] = useState({ project, role, lineManager: '', techLead: '', ktOwner: '' });
  const [note, setNote] = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      await assign_project_service({ actorRole: 'ADDITIONAL_MANAGER', caseId, requestId, ...draft });
      onSaved();
    } catch (error) { setNote(error.message); }
  };

  return (
    <Modal title="Assign project">
      <p><strong>{name}</strong></p>
      <form onSubmit={save}>
        {fields.map(([key, label]) => (
          <label key={key}>{label}
            <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} maxLength={200} required />
          </label>
        ))}
        <button className="primary">Assign</button>
        {note && <p role="status">{note}</p>}
      </form>
    </Modal>
  );
};

export default AssignProject;
