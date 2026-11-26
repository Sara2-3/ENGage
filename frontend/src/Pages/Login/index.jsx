import { useEffect, useState } from 'react';
import logo from '../../assets/eng-logo.svg';
import { useAuthContext } from '../../Context/Auth';
import { get_demo_service } from '../../Services/AuthService';
import './index.css';

const Login = () => {
  const { lastUsername, signIn } = useAuthContext();
  const [username, setUsername] = useState(lastUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(null);

  useEffect(() => {
    // The sign-in page has one look; the dashboards set their own theme again when they open.
    document.documentElement.dataset.theme = 'light';
    get_demo_service().then(setDemo).catch(() => {});
  }, []);

  const fill = (name) => {
    setUsername(name);
    setPassword(demo?.password ?? '');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(username, password);
    } catch (err) {
      setError(err instanceof TypeError ? 'Cannot reach the server. Start the backend.' : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-brand">
        <img src={logo} alt="eng, Engineering" />
        <p><strong>ENGage</strong>Onboarding &amp; Knowledge Transfer</p>
      </section>
      <main className="login-side">
        <form className="login-form" onSubmit={submit}>
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
};

export default Login;
