// Shows the login page until someone signs in, then the app for that user's role.
// Kept in its own folder so that work on the dashboards does not touch it.
import { useEffect, useState, type ReactNode } from 'react';
import { API_URL } from '../api';
import logo from './eng-logo.svg';
import './auth.css';

interface User { username: string; role: string; name: string }
const KEY = 'engage-user';

// The session lasts as long as the browser tab. Storage may be unavailable, so it is optional.
const read = (): User | null => {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};

export default function AuthGate({ children }: { children: (role: string) => ReactNode }) {
  const [user, setUser] = useState(read);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState<{ users: { username: string; name: string }[]; password: string } | null>(null);

  useEffect(() => {
    if (user) return;
    // The sign-in page has one look; the dashboards set their own theme again when they open.
    document.documentElement.dataset.theme = 'light';
    fetch(`${API_URL}/auth/demo`).then((res) => (res.ok ? res.json() : null)).then(setDemo).catch(() => {});
  }, [user]);

  const fill = (name: string) => {
    setUsername(name);
    setPassword(demo?.password ?? '');
    setError('');
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(res.status === 401 ? 'Wrong username or password.' : 'Sign in is not available. Restart the backend.');
      const found: User = await res.json();
      try { sessionStorage.setItem(KEY, JSON.stringify(found)); } catch { /* not remembered */ }
      setPassword('');
      setUser(found);
    } catch (err) {
      setError(err instanceof TypeError ? 'Cannot reach the server. Start the backend.' : (err as Error).message);
    }
    setBusy(false);
  };

  const signOut = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* nothing stored */ }
    setUser(null);
  };

  if (user) {
    return (
      <>
        <div className="signed-in">
          <span>{user.name}</span>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
        {children(user.role)}
      </>
    );
  }

  return (
    <div className="login">
      <section className="login-brand">
        <img src={logo} alt="eng, Engineering" />
        <p><strong>ENGage</strong>Onboarding &amp; Knowledge Transfer</p>
      </section>
      <main className="login-side">
        <form className="login-form" onSubmit={signIn}>
          <h1>Sign in</h1>
          <p className="login-sub">Use your role username and the team password.</p>
          <label>Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required autoFocus />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {demo && (
            <div className="login-roles">
              <p>Choose a role to fill the form</p>
              <div role="group" aria-label="Demo roles">
                {demo.users.map((u) => (
                  <button type="button" key={u.username} aria-pressed={username === u.username} onClick={() => fill(u.username)}>{u.name}</button>
                ))}
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
