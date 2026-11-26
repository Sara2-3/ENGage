import { useCallback, useEffect, useState } from 'react';
import { api, roles, type StaffingRequest } from './api';
import CaseView from './CaseView';
import Flow from './Flow';
import Employee from './dashboards/Employee';
import Executive from './dashboards/Executive';
import Follow from './dashboards/Follow';
import Hr from './dashboards/Hr';
import LineManager from './dashboards/LineManager';
import Pmo from './dashboards/Pmo';
import type { Case } from './shared';

// The role is kept in the address (#PMO), so a reload or a shared link opens the same dashboard.
const roleFromHash = () => roles.find((r) => `#${r.key}` === window.location.hash)?.key ?? 'MANAGEMENT';

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [staffing, setStaffing] = useState<StaffingRequest[]>([]);
  const [role, setRole] = useState(roleFromHash);
  const [selected, setSelected] = useState<string | null>(null);
  const [employee, setEmployee] = useState('ONB-002');
  const [error, setError] = useState('');

  const refresh = useCallback(() => Promise.all([
    api<Case[]>('/cases/overview').then(setCases),
    api<StaffingRequest[]>('/staffing').then(setStaffing),
  ]), []);
  useEffect(() => {
    refresh().catch(() => setError('Could not reach the API. Start the backend and reload.'));
  }, [refresh]);
  useEffect(() => {
    const onHash = () => { setRole(roleFromHash()); setSelected(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const reload = () => { refresh().catch(() => setError('Could not reload the data.')); };
  const created = (id: string) => { refresh().then(() => setSelected(id)).catch(() => {}); };
  const switchRole = (key: string) => { window.location.hash = key; setRole(key); setSelected(null); };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <i aria-hidden="true">E</i>
          <div>ENGage<span>Onboarding &amp; KT</span></div>
        </div>
        <p className="nav-label">Workflow by role</p>
        <nav aria-label="Dashboard by role (demo, no login)">
          {roles.map((r, i) => (
            <button key={r.key} aria-pressed={role === r.key} onClick={() => switchRole(r.key)}>
              <b aria-hidden="true">{i + 1}</b>
              <span><strong>{r.title}</strong><small>{r.task}</small></span>
            </button>
          ))}
        </nav>
        <footer>Prototype · fictional data · no login</footer>
      </aside>

      <main>
        {error && <p className="card" role="alert">{error}</p>}
        {selected ? (
          <>
            <button className="back" onClick={() => setSelected(null)}>← Back to dashboard</button>
            <CaseView key={selected} id={selected} viewer={role} onChanged={reload} />
          </>
        ) : (
          <>
            <Flow role={role} onPick={switchRole} />
            {role === 'MANAGEMENT' &&<Executive cases={cases} staffing={staffing} onOpen={setSelected} onSaved={reload} />}
            {role === 'HR' && <Hr cases={cases} staffing={staffing} onOpen={setSelected} onCreated={created} onSaved={reload} />}
            {role === 'EMPLOYEE' && <Employee cases={cases} who={employee} onPick={setEmployee} onSaved={reload} />}
            {(role === 'ADDITIONAL_MANAGER' || role === 'TECH_LEAD') && (
              <Follow key={role} role={role} cases={cases} onOpen={setSelected} onSaved={reload} />
            )}
            {role === 'LINE_MANAGER' && <LineManager cases={cases} />}
            {role === 'PMO' && <Pmo cases={cases} />}
          </>
        )}
      </main>
    </div>
  );
}
