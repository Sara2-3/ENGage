// A request field as trimmed text of at most 200 characters.
export const text = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '');

// Credentials must never be stored.
export const SECRET = /(password|passwd|fjalëkalim|api[_ -]?key|token)\s*[:=]/i;
