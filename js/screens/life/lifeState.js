import { load, save } from "../../services/storage.js";
import { DEFAULT_COLOR_ID } from "../../constants/colors.js";

const STORAGE_KEY = "life";
export const START_LIFE = 20;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const DELTA_WINDOW_MS = 900;

const DEFAULT_COLORS = ["red", "blue", "green", "purple"];

/**
 * Owns the Track Life player list and its persistence. Pure data + notify;
 * knows nothing about the DOM.
 */
export class LifeState {
  constructor() {
    this.players = this._loadOrDefault();
    this._listeners = new Set();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._persist();
    this._listeners.forEach((fn) => fn(this.players));
  }

  _persist() {
    save(STORAGE_KEY, this.players);
  }

  _loadOrDefault() {
    const saved = load(STORAGE_KEY, null);
    if (Array.isArray(saved) && saved.length >= MIN_PLAYERS) {
      return saved.map((p, i) => ({
        id: Number(p.id) || i + 1,
        life: Number(p.life) || START_LIFE,
        colorId: p.colorId || DEFAULT_COLORS[i] || DEFAULT_COLOR_ID,
        deltaTotal: Number(p.deltaTotal) || 0,
        deltaAt: Number(p.deltaAt) || 0,
      }));
    }
    return this._makePlayers(MIN_PLAYERS);
  }

  _makePlayers(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      life: START_LIFE,
      colorId: DEFAULT_COLORS[i] || DEFAULT_COLOR_ID,
      deltaTotal: 0,
      deltaAt: 0,
    }));
  }

  adjust(id, delta) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    const now = Date.now();
    if (now - (p.deltaAt || 0) <= DELTA_WINDOW_MS) {
      p.deltaTotal = (p.deltaTotal || 0) + delta;
    } else {
      p.deltaTotal = delta;
    }
    p.deltaAt = now;
    p.life += delta;
    this._emit();
  }

  setColor(id, colorId) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    p.colorId = colorId;
    this._emit();
  }

  resetPlayer(id) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    p.life = START_LIFE;
    p.deltaTotal = 0;
    p.deltaAt = 0;
    this._emit();
  }

  resetAll() {
    this.players.forEach((p) => {
      p.life = START_LIFE;
      p.deltaTotal = 0;
      p.deltaAt = 0;
    });
    this._emit();
  }

  addPlayer() {
    if (this.players.length >= MAX_PLAYERS) return;
    const nextId = Math.max(0, ...this.players.map((p) => p.id)) + 1;
    const usedColors = new Set(this.players.map((p) => p.colorId));
    const colorId =
      DEFAULT_COLORS.find((c) => !usedColors.has(c)) || DEFAULT_COLOR_ID;
    this.players.push({
      id: nextId,
      life: START_LIFE,
      colorId,
      deltaTotal: 0,
      deltaAt: 0,
    });
    this._emit();
  }

  removePlayer(id) {
    if (this.players.length <= MIN_PLAYERS) return;
    this.players = this.players.filter((p) => p.id !== id);
    this._emit();
  }

  get canAdd() {
    return this.players.length < MAX_PLAYERS;
  }

  get canRemove() {
    return this.players.length > MIN_PLAYERS;
  }
}
