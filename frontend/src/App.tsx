import { useCallback, useEffect, useState } from 'react';
import { api, type StaffingRequest } from './api';
import CaseView from './CaseView';
import Employee from './dashboards/Employee';
import Executive from './dashboards/Executive';
import Follow from './dashboards/Follow';
import Hr from './dashboards/Hr';
import LineManager from './dashboards/LineManager';
import Pmo from './dashboards/Pmo';
import { menus } from './menus';
import type { Case } from './shared';
import logo from './auth/eng-logo.svg';
import { useTheme } from './useTheme';

// Each signed-in user sees only the dashboard of their own role.
export default function App({ role }: { role: string }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [staffing, setStaffing] = useState<StaffingRequest[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [employee, setEmployee] = useState('ONB-002');
  const [error, setError] = useState('');
  const [page, setPage] = useState(menus[role][0].key);
  const { theme, toggle } = useTheme(role === 'PMO' && !selected ? 'pmo' : 'app');

  const refresh = useCallback(() => Promise.all([
    api<Case[]>('/cases/overview').then(setCases),
    api<StaffingRequest[]>('/staffing').then(setStaffing),
  ]), []);
  useEffect(() => {
    refresh().catch(() => setError('Could not reach the API. Start the backend and reload.'));
  }, [refresh]);
  const reload = () => { refresh().catch(() => setError('Could not reload the data.')); };
  const created = (id: string) => { refresh().then(() => setSelected(id)).catch(() => {}); };
  const go = (key: string) => { setPage(key); setSelected(null); window.scrollTo(0, 0); };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="eng, Engineering" />
          <div>ENGage<span>Onboarding &amp; KT</span></div>
        </div>
        <nav aria-label="Menu">
          {menus[role].map((m, i) => (
            <button key={m.key} type="button" aria-current={!selected && page === m.key ? 'page' : undefined}
              aria-pressed={!selected && page === m.key} onClick={() => go(m.key)}>
              <b aria-hidden="true">{i + 1}</b>
              <span><strong>{m.title}</strong></span>
            </button>
          ))}
        </nav>
        <button type="button" className="theme" role="switch" aria-checked={theme === 'dark'} aria-label="Dark mode" onClick={toggle}>
          <span aria-hidden="true">☀ Light</span>
          <i aria-hidden="true" />
          <span aria-hidden="true">☾ Dark</span>
        </button>
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
            {role === 'MANAGEMENT' &&<Executive page={page} onPage={go} cases={cases} staffing={staffing} onOpen={setSelected} />}
            {role === 'HR' && <Hr page={page} cases={cases} staffing={staffing} onOpen={setSelected} onCreated={created} onSaved={reload} />}
            {role === 'EMPLOYEE' && <Employee page={page} cases={cases} who={employee} onPick={setEmployee} onSaved={reload} />}
            {(role === 'ADDITIONAL_MANAGER' || role === 'TECH_LEAD') && (
              <Follow key={role} page={page} role={role} staffing={staffing} cases={cases} onOpen={setSelected} onSaved={reload} />
            )}
            {role === 'LINE_MANAGER' && <LineManager page={page} cases={cases} onSaved={reload} />}
            {role === 'PMO' && <Pmo page={page} onPage={go} cases={cases} staffing={staffing} onOpen={setSelected} />}
          </>
        )}
      </main>
    </div>
  );
}
