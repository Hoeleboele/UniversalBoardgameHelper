import { load, save } from "../../services/storage.js";
import { COLORS } from "../../constants/colors.js";

const STORAGE_KEY = "random-teams-settings";

export const MIN_TEAMS = 2;
export const MAX_TEAMS = COLORS.length;

const DEFAULT_SETTINGS = {
  teamCount: 2,
};

function sanitizeTeamCount(value, fallback) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, n));
}

function sanitizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    teamCount: sanitizeTeamCount(source.teamCount, DEFAULT_SETTINGS.teamCount),
  };
}

let settings = sanitizeSettings(load(STORAGE_KEY, DEFAULT_SETTINGS));

export function getTeamSettings() {
  return { ...settings };
}

export function updateTeamSettings(partial) {
  settings = sanitizeSettings({ ...settings, ...partial });
  save(STORAGE_KEY, settings);
}
