// Dark and light. PMO starts dark and the other dashboards start light; each choice is remembered.
import { useEffect, useState } from 'react';

const defaults = { pmo: 'dark', app: 'light' };

// Browser storage can be unavailable (private window), so the app must work without it.
const read = (group) => {
  try {
    const saved = localStorage.getItem(`engage-theme-${group}`);
    return saved === 'dark' || saved === 'light' ? saved : defaults[group];
  } catch { return defaults[group]; }
};

export function useTheme(group) {
  const [themes, setThemes] = useState(() => ({ pmo: read('pmo'), app: read('app') }));
  const theme = themes[group];

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemes({ ...themes, [group]: next });
    try { localStorage.setItem(`engage-theme-${group}`, next); } catch { /* not remembered */ }
  };
  return { theme, toggle };
}
