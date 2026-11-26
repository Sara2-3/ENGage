// Who is signed in. The session lasts as long as the browser tab.
import { createContext, useContext, useState } from 'react';
import { login_service } from '../Services/AuthService';

const KEY = 'engage-user';

// Storage may be unavailable, so it is optional.
const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};

const AuthContext = createContext({ user: null, lastUsername: '', signIn: async () => {}, signOut: () => {} });

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(read);
  const [lastUsername, setLastUsername] = useState('');

  const signIn = async (username, password) => {
    const found = await login_service(username, password);
    try { sessionStorage.setItem(KEY, JSON.stringify(found)); } catch { /* not remembered */ }
    setLastUsername(username);
    setUser(found);
  };

  const signOut = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* nothing stored */ }
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, lastUsername, signIn, signOut }}>{children}</AuthContext.Provider>;
};

const useAuthContext = () => useContext(AuthContext);

export { AuthProvider, useAuthContext };
