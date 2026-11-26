// Management decides which project a person goes to and who is in their team.
import { useState } from 'react';
import { api } from './api';
import Modal from './Modal';

const fields = [
  ['project', 'Project'], ['role', 'Exact role'], ['lineManager', 'Line Manager'],
  ['techLead', 'Technical Lead'], ['ktOwner', 'Additional Manager'],
] as const;

export default function AssignProject({ caseId, name, requestId, project = '', role = '', onSaved }: {
  caseId: string; name: string; requestId?: number; project?: string; role?: string; onSaved: () => void;
}) {
  const [draft, setDraft] = useState({ project, role, lineManager: '', techLead: '', ktOwner: '' });
  const [note, setNote] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/staffing/assign', { actorRole: 'MANAGEMENT', caseId, requestId, ...draft });
      onSaved();
    } catch (error) { setNote((error as Error).message); }
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
}
