/**
 * Namespaced localStorage wrapper. Fails silently when storage is unavailable.
 */
const PREFIX = "bgh:";

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
