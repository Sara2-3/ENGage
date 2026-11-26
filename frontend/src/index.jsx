import { useCallback, useEffect, useState } from 'react';
import CaseView from './components/CaseView';
import Employee from './Pages/Employee';
import Executive from './Pages/Management';
import Follow from './Pages/Follow';
import Hr from './Pages/Hr';
import LineManager from './Pages/LineManager';
import Pmo from './Pages/Pmo';
import { useCaseContext } from './Context/CaseContext';
import { useStaffingContext } from './Context/StaffingContext';
import { menus } from './db/menus';
import logo from './assets/eng-logo.svg';
import { useTheme } from './Helper/useTheme';

// Each signed-in user sees only the dashboard of their own role.
const App = ({ role }) => {
  const { getAllCases } = useCaseContext();
  const { getAllStaffing } = useStaffingContext();
  const [selected, setSelected] = useState(null);
  const [employee, setEmployee] = useState('ONB-002');
  const [error, setError] = useState('');
  const [page, setPage] = useState(menus[role][0].key);
  const { theme, toggle } = useTheme(role === 'PMO' && !selected ? 'pmo' : 'app');

  const refresh = useCallback(() => Promise.all([getAllCases(), getAllStaffing()]), [getAllCases, getAllStaffing]);
  useEffect(() => {
    refresh().catch(() => setError('Could not reach the API. Start the backend and reload.'));
  }, [refresh]);
  const reload = () => { refresh().catch(() => setError('Could not reload the data.')); };
  const created = (id) => { refresh().then(() => setSelected(id)).catch(() => {}); };
  const go = (key) => { setPage(key); setSelected(null); window.scrollTo(0, 0); };

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
            {role === 'MANAGEMENT' &&<Executive page={page} onPage={go} onOpen={setSelected} />}
            {role === 'HR' && <Hr page={page} onOpen={setSelected} onCreated={created} onSaved={reload} />}
            {role === 'EMPLOYEE' && <Employee page={page} who={employee} onPick={setEmployee} onSaved={reload} />}
            {(role === 'ADDITIONAL_MANAGER' || role === 'TECH_LEAD') && (
              <Follow key={role} page={page} role={role} onOpen={setSelected} onSaved={reload} />
            )}
            {role === 'LINE_MANAGER' && <LineManager page={page} onSaved={reload} />}
            {role === 'PMO' && <Pmo page={page} onPage={go} onOpen={setSelected} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
