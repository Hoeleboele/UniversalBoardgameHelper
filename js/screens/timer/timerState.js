import { load, save } from "../../services/storage.js";
import { COLORS } from "../../constants/colors.js";

const STORAGE_KEY = "team-timer-settings";

const DEFAULT_SETTINGS = {
  teamAName: "Team A",
  teamBName: "Team B",
  teamASeconds: 5 * 60,
  teamBSeconds: 5 * 60,
  teamAColorId: "red",
  teamBColorId: "blue",
  neutralEnabled: false,
  neutralSeconds: 3 * 60,
  resetBehavior: "all",
};

const VALID_COLOR_IDS = new Set(COLORS.map((c) => c.id));

function sanitizeName(name, fallback) {
  const value = String(name || "").trim();
  return value || fallback;
}

function sanitizeSeconds(seconds, fallback) {
  const n = Number(seconds);
  if (!Number.isFinite(n)) return fallback;
  const whole = Math.floor(n);
  return whole >= 1 ? whole : fallback;
}

function sanitizeColorId(colorId, fallback) {
  return VALID_COLOR_IDS.has(colorId) ? colorId : fallback;
}

function sanitizeEnabled(value, fallback) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function sanitizeResetBehavior(value, fallback) {
  return value === "neutral-only" || value === "all" ? value : fallback;
}

function sanitizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    teamAName: sanitizeName(source.teamAName, DEFAULT_SETTINGS.teamAName),
    teamBName: sanitizeName(source.teamBName, DEFAULT_SETTINGS.teamBName),
    teamASeconds: sanitizeSeconds(source.teamASeconds, DEFAULT_SETTINGS.teamASeconds),
    teamBSeconds: sanitizeSeconds(source.teamBSeconds, DEFAULT_SETTINGS.teamBSeconds),
    teamAColorId: sanitizeColorId(source.teamAColorId, DEFAULT_SETTINGS.teamAColorId),
    teamBColorId: sanitizeColorId(source.teamBColorId, DEFAULT_SETTINGS.teamBColorId),
    neutralEnabled: sanitizeEnabled(source.neutralEnabled, DEFAULT_SETTINGS.neutralEnabled),
    neutralSeconds: sanitizeSeconds(source.neutralSeconds, DEFAULT_SETTINGS.neutralSeconds),
    resetBehavior: sanitizeResetBehavior(source.resetBehavior, DEFAULT_SETTINGS.resetBehavior),
  };
}

let settings = sanitizeSettings(load(STORAGE_KEY, DEFAULT_SETTINGS));
let remainingA = settings.teamASeconds;
let remainingB = settings.teamBSeconds;
let activeTeam = null; // "a" | "b" | null
let neutralRemaining = settings.neutralEnabled ? settings.neutralSeconds : 0;
let neutralActive = false;
let paused = true;
let ended = false;
let endedAt = 0;
let neutralEndedAt = 0;
let tickerId = null;

const listeners = new Set();

function snapshot() {
  return {
    settings: { ...settings },
    remainingA,
    remainingB,
    activeTeam,
    neutralRemaining,
    neutralActive,
    paused,
    ended,
    endedAt,
    neutralEndedAt,
  };
}

function emit() {
  const next = snapshot();
  listeners.forEach((fn) => fn(next));
}

function persistSettings() {
  save(STORAGE_KEY, settings);
}

function clearTicker() {
  if (tickerId) {
    clearInterval(tickerId);
    tickerId = null;
  }
}

function finishTimer() {
  ended = true;
  paused = true;
  activeTeam = null;
  neutralActive = false;
  endedAt = Date.now();
  clearTicker();
}

function finishNeutralTimer() {
  neutralActive = false;
  activeTeam = null;
  paused = true;
  neutralEndedAt = Date.now();
  clearTicker();
}

function tick() {
  if (paused || ended) return;

  if (neutralActive) {
    neutralRemaining = Math.max(0, neutralRemaining - 1);
    if (neutralRemaining === 0) {
      finishNeutralTimer();
      emit();
      return;
    }

    emit();
    return;
  }

  if (!activeTeam) return;

  if (activeTeam === "a") {
    remainingA = Math.max(0, remainingA - 1);
    if (remainingA === 0) {
      finishTimer();
    }
  } else if (activeTeam === "b") {
    remainingB = Math.max(0, remainingB - 1);
    if (remainingB === 0) {
      finishTimer();
    }
  }

  emit();
}

function ensureTicker() {
  if (tickerId || paused || ended || (!activeTeam && !neutralActive)) return;
  tickerId = setInterval(tick, 1000);
}

export function subscribeTimer(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTimerSnapshot() {
  return snapshot();
}

export function getTimerSettings() {
  return { ...settings };
}

export function updateTimerSettings(partial) {
  settings = sanitizeSettings({ ...settings, ...partial });
  persistSettings();
  resetTimerSession();
}

export function resetTimerSession() {
  clearTicker();
  remainingA = settings.teamASeconds;
  remainingB = settings.teamBSeconds;
  activeTeam = null;
  neutralRemaining = settings.neutralEnabled ? settings.neutralSeconds : 0;
  neutralActive = false;
  paused = true;
  ended = false;
  endedAt = 0;
  neutralEndedAt = 0;
  emit();
}

export function resetNeutralTimerSession() {
  if (!settings.neutralEnabled) return;

  neutralRemaining = settings.neutralSeconds;
  neutralActive = false;
  neutralEndedAt = 0;

  if (paused) {
    activeTeam = null;
    clearTicker();
  }

  emit();
}

export function pauseTimer() {
  if (paused) return;
  paused = true;
  activeTeam = null;
  neutralActive = false;
  clearTicker();
  emit();
}

export function handleTeamPress(team) {
  if (team !== "a" && team !== "b") return;
  if (ended || neutralActive) return;

  if (paused) {
    activeTeam = team;
    paused = false;
    ensureTicker();
    emit();
    return;
  }

  if (activeTeam !== team) {
    return;
  }

  activeTeam = team === "a" ? "b" : "a";
  paused = false;
  ensureTicker();
  emit();
}

export function handleNeutralPress() {
  if (ended || !settings.neutralEnabled || neutralRemaining <= 0) return;

  if (neutralActive) {
    neutralActive = false;
    activeTeam = null;
    paused = true;
    clearTicker();
    emit();
    return;
  }

  neutralActive = true;
  activeTeam = null;
  paused = false;
  ensureTicker();
  emit();
}
