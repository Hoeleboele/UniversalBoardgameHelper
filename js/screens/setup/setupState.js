import { load, save } from "../../services/storage.js";

const STORAGE_KEY = "setup-games";

let currentGameId = null;
let games = sanitizeGames(load(STORAGE_KEY, []));

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function sanitizeList(raw, index) {
  const source = raw && typeof raw === "object" ? raw : {};
  const values = Array.isArray(source.values)
    ? source.values.map(sanitizeText).filter(Boolean)
    : [];
  const count = typeof source.count === "number" ? source.count : 1;
  const clampedCount = Math.max(1, Math.floor(count));

  return {
    title: sanitizeText(source.title) || `List ${index + 1}`,
    values,
    count: clampedCount,
  };
}

function sanitizeGame(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const lists = Array.isArray(source.lists)
    ? source.lists.map(sanitizeList).filter((list) => list.values.length > 0)
    : [];

  return {
    id: sanitizeText(source.id) || createId(),
    name: sanitizeText(source.name) || "Untitled Game",
    lists,
  };
}

function sanitizeGames(raw) {
  if (!Array.isArray(raw)) return [];

  const ids = new Set();
  return raw.reduce((result, game) => {
    const sanitized = sanitizeGame(game);
    if (!ids.has(sanitized.id)) {
      ids.add(sanitized.id);
      result.push(sanitized);
    }
    return result;
  }, []);
}

function persistGames() {
  save(STORAGE_KEY, games);
}

function copyGame(game) {
  if (!game) return null;
  return {
    ...game,
    lists: game.lists.map((list) => ({ ...list, values: [...list.values], count: list.count })),
  };
}

export function createEmptyGame() {
  return {
    id: createId(),
    name: "",
    lists: [{ title: "", values: [""], count: 1 }],
  };
}

export function getGames() {
  return games.map(copyGame);
}

export function getGame(gameId) {
  return copyGame(games.find((game) => game.id === gameId));
}

export function saveGame(game) {
  const sanitized = sanitizeGame(game);
  const index = games.findIndex((existingGame) => existingGame.id === sanitized.id);

  if (index === -1) {
    games = [...games, sanitized];
  } else {
    games = games.map((existingGame, existingIndex) => (
      existingIndex === index ? sanitized : existingGame
    ));
  }

  persistGames();
  return copyGame(sanitized);
}

export function deleteGame(gameId) {
  const nextGames = games.filter((game) => game.id !== gameId);
  if (nextGames.length === games.length) return false;

  games = nextGames;
  if (currentGameId === gameId) currentGameId = null;
  persistGames();
  return true;
}

export function setCurrentGameId(gameId) {
  currentGameId = typeof gameId === "string" && gameId ? gameId : null;
}

export function getCurrentGameId() {
  return currentGameId;
}