const STORAGE_PREFIX = 'epeople2_';

export function loadData<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      return JSON.parse(stored) as T[];
    }
  } catch {
    // Corrupted data — fall back to defaults
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
  return [...fallback];
}

export function saveData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadCounter(key: string, fallback: number): number {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key + '_counter');
    if (stored) return parseInt(stored, 10);
  } catch {
    // ignore
  }
  return fallback;
}

export function saveCounter(key: string, value: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key + '_counter', String(value));
  } catch {
    // ignore
  }
}
