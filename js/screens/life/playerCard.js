import { el } from "../../utils/dom.js";
import { COLORS, getColor } from "../../constants/colors.js";
import { DELTA_WINDOW_MS } from "./lifeState.js";

const MINUS_CANDIDATE_COLORS = [
  "#ffb3b3",
  "#ff8787",
  "#ff6b6b",
  "#fa5252",
  "#e03131",
  "#c92a2a",
  "#a51111",
  "#7a1010",
];

const PLUS_CANDIDATE_COLORS = [
  "#b2f2bb",
  "#8ce99a",
  "#69db7c",
  "#51cf66",
  "#40c057",
  "#37b24d",
  "#2f9e44",
  "#2b8a3e",
  "#237032",
];

function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  const normalized = hex.trim();
  const match = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function srgbToLinear(channel) {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBestContrastingColor(backgroundHex, candidates, fallback) {
  const background = hexToRgb(backgroundHex);
  if (!background) return fallback;

  let best = candidates[0] || fallback;
  let bestScore = 0;

  candidates.forEach((candidateHex) => {
    const candidate = hexToRgb(candidateHex);
    if (!candidate) return;
    const score = contrastRatio(background, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidateHex;
    }
  });

  return best;
}

function getContrastingMinusColor(backgroundHex) {
  return getBestContrastingColor(backgroundHex, MINUS_CANDIDATE_COLORS, "#e03131");
}

function getContrastingPlusColor(backgroundHex) {
  return getBestContrastingColor(backgroundHex, PLUS_CANDIDATE_COLORS, "#2f9e44");
}

/**
 * Renders a single player's life card: total, +/- controls, color picker,
 * per-player reset and remove. Delegates all mutations to the provided state.
 */
export function createPlayerCard(player, state, { canRemove }) {
  const color = getColor(player.colorId);
  const plusColor = getContrastingPlusColor(color.value);
  const minusColor = getContrastingMinusColor(color.value);

  const deltaEl = el("div", {
    class: "player-total-delta",
    "aria-hidden": "true",
  });

  function showDelta(totalDelta, duration = DELTA_WINDOW_MS) {
    const signText = totalDelta > 0 ? `+${totalDelta}` : String(totalDelta);
    deltaEl.textContent = signText;
    deltaEl.classList.remove("plus", "minus", "show");
    deltaEl.classList.add(totalDelta > 0 ? "plus" : "minus");

    // Force reflow so rapid taps restart the show animation.
    void deltaEl.offsetWidth;
    deltaEl.classList.add("show");

    setTimeout(() => {
      deltaEl.classList.remove("show");
    }, Math.max(120, duration));
  }

  function renderRecentDelta() {
    const totalDelta = Number(player.deltaTotal || 0);
    const at = Number(player.deltaAt || 0);
    if (!totalDelta || !at) return;

    const age = Date.now() - at;
    if (age >= DELTA_WINDOW_MS) return;
    showDelta(totalDelta, DELTA_WINDOW_MS - age);
  }

  const totalEl = el("div", { class: "player-total" }, [
    el("button", {
      class: "player-total-hit player-total-hit-left",
      "aria-label": `Player ${player.id}: subtract 1 life`,
      on: { click: () => state.adjust(player.id, -1) },
    }),
    el("span", {
      class: "player-total-value",
      text: String(player.life),
      "aria-hidden": "true",
    }),
    deltaEl,
    el("button", {
      class: "player-total-hit player-total-hit-right",
      "aria-label": `Player ${player.id}: add 1 life`,
      on: { click: () => state.adjust(player.id, 1) },
    }),
  ]);

  const colorPicker = el("div", { class: "color-picker" }, [
    el(
      "div",
      { class: "color-grid" },
      COLORS.map((c) =>
        el("button", {
          class: "swatch",
          style: `background:${c.value}`,
          "aria-label": c.id,
          on: {
            click: () => {
              state.setColor(player.id, c.id);
              colorPicker.classList.remove("open");
            },
          },
        })
      )
    ),
  ]);

  colorPicker.addEventListener("click", (e) => {
    if (e.target === colorPicker) colorPicker.classList.remove("open");
  });

  const removeBtn = canRemove
    ? el("button", {
        class: "icon-btn",
        "aria-label": "Remove player",
        text: "✕",
        on: { click: () => state.removePlayer(player.id) },
      })
    : null;

  const card = el(
    "li",
    {
      class: "player-card",
      dataset: { light: String(color.light) },
      style: `background:${color.value};--player-delta-plus:${plusColor};--player-delta-minus:${minusColor}`,
    },
    [
      el("div", { class: "player-card-top" }, [
        el("span", { class: "player-name", text: `P${player.id}` }),
        el("span", { class: "spacer" }),
        el("button", {
          class: "icon-btn",
          "aria-label": "Change color",
          text: "🎨",
          on: { click: () => colorPicker.classList.add("open") },
        }),
        el("button", {
          class: "icon-btn",
          "aria-label": "Reset player",
          text: "↺",
          on: { click: () => state.resetPlayer(player.id) },
        }),
        removeBtn,
      ]),
      el("div", { class: "life-core" }, [
        totalEl,
      ]),
      colorPicker,
    ]
  );

  renderRecentDelta();

  return card;
}
