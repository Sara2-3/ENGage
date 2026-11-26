// The forms each role can use. The server checks the same permissions.
import { useState } from 'react';
import { words } from '../../Helper/format';
import { add_record_service } from '../../Services/CaseService';

const forms = [
  { type: 'ASSIGN', title: 'Assign project and people', roles: ['ADDITIONAL_MANAGER'], fields: [
    { name: 'project', label: 'Project' }, { name: 'role', label: 'Exact role' }, { name: 'lineManager', label: 'Line Manager' },
    { name: 'techLead', label: 'Technical Lead' }, { name: 'ktOwner', label: 'Additional Manager (KT Owner)' }] },
  { type: 'CONFIRM_START', title: 'Confirm start', roles: ['HR'], fields: [] },
  { type: 'PLAN', title: 'Set the learning plan', roles: ['TECH_LEAD'], fields: [
    { name: 'activities', label: 'Activities (comma separated)' }, { name: 'systems', label: 'Systems needed (comma separated)' },
    { name: 'reviewDate', label: 'Readiness review date', type: 'date' }, { name: 'docsLocation', label: 'Documents folder' }] },
  { type: 'ACTIVITY', title: 'Record activity progress', roles: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'TECH_LEAD'], fields: [
    { name: 'name', label: 'Activity' }, { name: 'level', label: 'Level', options: ['SHADOWING', 'SUPPORTED', 'INDEPENDENT', 'NOT_COVERED'] }] },
  { type: 'ACCESS', title: 'Update access', roles: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'TECH_LEAD'], fields: [
    { name: 'system', label: 'System' }, { name: 'state', label: 'State', options: ['REQUESTED', 'APPROVED', 'USABLE', 'NOT_REQUESTED'] },
    { name: 'owner', label: 'Owner' }, { name: 'nextFollowUp', label: 'Next follow-up', type: 'date' }] },
  { type: 'BLOCKER', title: 'Report a blocker', roles: ['EMPLOYEE', 'ADDITIONAL_MANAGER', 'LINE_MANAGER', 'TECH_LEAD'], fields: [
    { name: 'description', label: 'What is blocking?' }, { name: 'owner', label: 'Owner' }, { name: 'nextFollowUp', label: 'Next follow-up', type: 'date' }] },
  { type: 'RESOLVE_BLOCKER', title: 'Resolve open blockers', roles: ['ADDITIONAL_MANAGER', 'LINE_MANAGER', 'TECH_LEAD'], fields: [{ name: 'note', label: 'How was it resolved?' }] },
  { type: 'REQUEST_ANSWERED', title: 'Record an answer to a request', roles: ['ADDITIONAL_MANAGER', 'LINE_MANAGER', 'TECH_LEAD'], fields: [{ name: 'note', label: 'Answer' }] },
  { type: 'VALIDATE', title: 'Review evidence and decide', roles: ['TECH_LEAD'], fields: [
    { name: 'sufficient', label: 'Is the evidence enough?', options: ['no', 'yes'] },
    { name: 'outcome', label: 'Readiness (if yes)', options: ['READY_WITH_SUPPORT', 'PARTIALLY_READY', 'READY'] },
    { name: 'note', label: 'What did you observe?' }] },
  { type: 'REPORT', title: 'Report to the level above', roles: ['ADDITIONAL_MANAGER', 'LINE_MANAGER', 'TECH_LEAD'], fields: [
    { name: 'status', label: 'Status', options: ['ON_TRACK', 'NEEDS_HELP', 'COMPLETED'] },
    { name: 'note', label: 'Short note, without technical detail' }] },
  { type: 'REQUIREMENT', title: 'Requirements for HR', roles: ['ADDITIONAL_MANAGER'], fields: [
    { name: 'text', label: 'What should this person know or be able to do?' }] },
  { type: 'TASK', title: 'Assign a technical task', roles: ['TECH_LEAD'], fields: [
    { name: 'title', label: 'Task' }, { name: 'due', label: 'Due (optional)', type: 'date' }] },
  { type: 'CHECKIN', title: 'Send a check-in', roles: ['EMPLOYEE'], fields: [
    { name: 'note', label: 'What can you do alone, and where do you still need help?' }] },
  { type: 'NEXT_STEP', title: 'Set the next step', roles: ['ADDITIONAL_MANAGER', 'TECH_LEAD'], fields: [
    { name: 'title', label: 'Action' }, { name: 'owner', label: 'Owner' }, { name: 'due', label: 'Due', type: 'date' }] },
];

const Actions = ({ data, role, only, initial = {}, onSaved }) => {
  const available = forms.filter((f) => f.roles.includes(role) && (!only || f.type === only));
  const [type, setType] = useState('');
  const form = available.find((f) => f.type === type) ?? available[0];
  const [values, setValues] = useState(initial);
  const [note, setNote] = useState('');

  if (!form) return null;

  const submit = async (e) => {
    e.preventDefault();
    const payload = {};
    for (const f of form.fields) {
      const value = values[f.name] ?? f.options?.[0] ?? '';
      if (f.name === 'activities' || f.name === 'systems') payload[f.name] = value.split(',').map((x) => x.trim()).filter(Boolean);
      else if (f.name === 'sufficient') payload[f.name] = value === 'yes';
      else payload[f.name] = value;
    }
    try {
      const updated = await add_record_service(data.case.id, { type: form.type, actorRole: role, payload });
      setValues({});
      setNote('Saved.');
      onSaved(updated);
    } catch (error) {
      setNote(error.message);
    }
  };

  return (
    <form onSubmit={submit}>
      {available.length > 1 && (
        <select value={form.type} onChange={(e) => { setType(e.target.value); setValues({}); setNote(''); }} aria-label="Action">
          {available.map((f) => <option key={f.type} value={f.type}>{f.title}</option>)}
        </select>
      )}
      {form.fields.map((f) => (
        <label key={`${form.type}-${f.name}`}>
          {f.label}
          {f.options ? (
            <select value={values[f.name] ?? f.options[0]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
              {f.options.map((o) => <option key={o} value={o}>{words(o)}</option>)}
            </select>
          ) : (
            <input type={f.type ?? 'text'} value={values[f.name] ?? ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          )}
        </label>
      ))}
      <button className="primary">Save</button>
      {note && <p role="status">{note}</p>}
    </form>
  );
};

export default Actions;
