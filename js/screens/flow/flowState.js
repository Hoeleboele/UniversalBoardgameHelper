import { load, save } from "../../services/storage.js";

const STORAGE_KEY = "flow-games";
export const OPTIONS_PER_CHOICE = 2;

let currentGameId = null;
let games = sanitizeGames(load(STORAGE_KEY, []));

export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function sanitizeOption(raw, index) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    label: sanitizeText(source.label) || `Option ${index + 1}`,
    // Empty target means "continue with the next step".
    targetId: sanitizeText(source.targetId),
  };
}

function sanitizeStep(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const rawOptions = source.choice && Array.isArray(source.choice.options)
    ? source.choice.options
    : null;

  return {
    id: sanitizeText(source.id) || createId(),
    title: sanitizeText(source.title),
    description: sanitizeText(source.description),
    choice: rawOptions
      ? {
          options: Array.from({ length: OPTIONS_PER_CHOICE }, (_, i) => (
            sanitizeOption(rawOptions[i], i)
          )),
        }
      : null,
  };
}

function sanitizeGame(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const steps = [];
  const stepIds = new Set();

  (Array.isArray(source.steps) ? source.steps : []).forEach((rawStep) => {
    const step = sanitizeStep(rawStep);
    if (!step.title || stepIds.has(step.id)) return;
    stepIds.add(step.id);
    steps.push(step);
  });

  steps.forEach((step) => {
    if (!step.choice) return;
    step.choice.options.forEach((option) => {
      if (!stepIds.has(option.targetId)) option.targetId = "";
    });
  });

  return {
    id: sanitizeText(source.id) || createId(),
    name: sanitizeText(source.name) || "Untitled Game",
    steps,
  };
}

function sanitizeGames(raw) {
  if (!Array.isArray(raw)) return [];

  const ids = new Set();
  return raw.reduce((result, game) => {
    const sanitized = sanitizeGame(game);
    if (!ids.has(sanitized.id) && sanitized.steps.length > 0) {
      ids.add(sanitized.id);
      result.push(sanitized);
    }
    return result;
  }, []);
}

function persistGames() {
  save(STORAGE_KEY, games);
}

export function copyFlowGame(game) {
  if (!game) return null;
  return {
    ...game,
    steps: game.steps.map((step) => ({
      ...step,
      choice: step.choice
        ? { options: step.choice.options.map((option) => ({ ...option })) }
        : null,
    })),
  };
}

export function createEmptyStep() {
  return { id: createId(), title: "", description: "", choice: null };
}

export function createEmptyChoice() {
  return {
    options: Array.from({ length: OPTIONS_PER_CHOICE }, () => ({
      label: "",
      targetId: "",
    })),
  };
}

export function createEmptyFlowGame() {
  return { id: createId(), name: "", steps: [createEmptyStep()] };
}

export function getFlowGames() {
  return games.map(copyFlowGame);
}

export function getFlowGame(gameId) {
  return copyFlowGame(games.find((game) => game.id === gameId));
}

export function saveFlowGame(game) {
  const sanitized = sanitizeGame(game);
  const index = games.findIndex((existing) => existing.id === sanitized.id);

  games = index === -1
    ? [...games, sanitized]
    : games.map((existing, i) => (i === index ? sanitized : existing));

  persistGames();
  return copyFlowGame(sanitized);
}

export function deleteFlowGame(gameId) {
  const nextGames = games.filter((game) => game.id !== gameId);
  if (nextGames.length === games.length) return false;

  games = nextGames;
  if (currentGameId === gameId) currentGameId = null;
  persistGames();
  return true;
}

export function setCurrentFlowGameId(gameId) {
  currentGameId = typeof gameId === "string" && gameId ? gameId : null;
}

export function getCurrentFlowGameId() {
  return currentGameId;
}

/**
 * Returns the index of the step that follows `currentIndex`. Without an
 * option (or with an option that has no target) the flow moves to the next
 * step and loops back to the first one after the last step.
 */
export function getNextStepIndex(game, currentIndex, optionIndex = null) {
  const step = game.steps[currentIndex];
  const option = step && step.choice && optionIndex !== null
    ? step.choice.options[optionIndex]
    : null;

  if (option && option.targetId) {
    const targetIndex = game.steps.findIndex((s) => s.id === option.targetId);
    if (targetIndex !== -1) return targetIndex;
  }

  return (currentIndex + 1) % game.steps.length;
}
