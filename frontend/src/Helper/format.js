// 'READY_WITH_SUPPORT' -> 'Ready with support'
export const words = (v) => v.replaceAll('_', ' ').toLowerCase().replace(/^./, (s) => s.toUpperCase());
