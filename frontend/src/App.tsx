import { useCallback, useEffect, useState } from 'react';
import { api, roles, type StaffingRequest } from './api';
import CaseView from './CaseView';
import AdditionalManager from './dashboards/AdditionalManager';
import Employee from './dashboards/Employee';
import Executive from './dashboards/Executive';
import Hr from './dashboards/Hr';
import LineManager from './dashboards/LineManager';
import Pmo from './dashboards/Pmo';
import TechLead from './dashboards/TechLead';
import type { Case } from './shared';

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [staffing, setStaffing] = useState<StaffingRequest[]>([]);
  const [role, setRole] = useState('MANAGEMENT');
  const [selected, setSelected] = useState<string | null>(null);
  const [employee, setEmployee] = useState('ONB-005');
  const [error, setError] = useState('');

  const refresh = useCallback(() => Promise.all([
    api<Case[]>('/cases/overview').then(setCases),
    api<StaffingRequest[]>('/staffing').then(setStaffing),
  ]), []);
  useEffect(() => {
    refresh().catch(() => setError('Could not reach the API. Start the backend and reload.'));
  }, [refresh]);
  const reload = () => { refresh().catch(() => setError('Could not reload the data.')); };
  const created = (id: string) => { refresh().then(() => setSelected(id)).catch(() => {}); };
  const switchRole = (key: string) => { setRole(key); setSelected(null); };

  return (
    <>
      <header className="topbar">
        <div>
          <div className="brand">ENGage<span>Onboarding &amp; Knowledge Transfer</span></div>
          <div className="asof">Prototype · fictional data · as of 14 Oct 2026</div>
        </div>
        <nav className="roles" aria-label="Dashboard by role (demo, no login)">
          {roles.map((r) => (
            <button key={r.key} aria-pressed={role === r.key} onClick={() => switchRole(r.key)}>{r.title}</button>
          ))}
        </nav>
      </header>

      <main>
        {error && <p className="card" role="alert">{error}</p>}
        {selected ? (
          <>
            <button className="back" onClick={() => setSelected(null)}>← Back to dashboard</button>
            <CaseView key={selected} id={selected} viewer={role} onChanged={reload} />
          </>
        ) : (
          <>
            {role === 'MANAGEMENT' && <Executive cases={cases} staffing={staffing} onOpen={setSelected} onSaved={reload} />}
            {role === 'HR' && <Hr cases={cases} staffing={staffing} onOpen={setSelected} onCreated={created} onSaved={reload} />}
            {role === 'EMPLOYEE' && <Employee cases={cases} who={employee} onPick={setEmployee} onSaved={reload} />}
            {role === 'ADDITIONAL_MANAGER' && <AdditionalManager cases={cases} onOpen={setSelected} />}
            {role === 'TECH_LEAD' && <TechLead cases={cases} onOpen={setSelected} />}
            {role === 'LINE_MANAGER' && <LineManager cases={cases} />}
            {role === 'PMO' && <Pmo cases={cases} />}
          </>
        )}
      </main>
    </>
  );
}
