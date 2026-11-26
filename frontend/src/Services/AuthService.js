import { API_URL } from './http';

// The role buttons under the sign-in form
export const get_demo_service = () =>
  fetch(`${API_URL}/auth/demo`).then((res) => (res.ok ? res.json() : null));

export const login_service = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(res.status === 401 ? 'Wrong username or password.' : 'Sign in is not available. Restart the backend.');
  return res.json();
};
