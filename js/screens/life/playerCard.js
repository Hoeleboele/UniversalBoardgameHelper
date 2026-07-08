import { el } from "../../utils/dom.js";
import { COLORS, getColor } from "../../constants/colors.js";

/**
 * Renders a single player's life card: total, +/- controls, color picker,
 * per-player reset and remove. Delegates all mutations to the provided state.
 */
export function createPlayerCard(player, state, { canRemove }) {
  const color = getColor(player.colorId);

  const totalEl = el("div", { class: "player-total", text: String(player.life) });

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
      style: `background:${color.value}`,
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
      el("div", { class: "life-controls" }, [
        lifeButton("-5", () => state.adjust(player.id, -5), "life-btn-small"),
        lifeButton("-1", () => state.adjust(player.id, -1), "life-btn-large"),
        lifeButton("+1", () => state.adjust(player.id, 1), "life-btn-large"),
        lifeButton("+5", () => state.adjust(player.id, 5), "life-btn-small"),
      ]),
      colorPicker,
    ]
  );

  return card;
}

function lifeButton(label, onClick, extraClass = "") {
  return el("button", {
    class: `life-btn ${extraClass}`.trim(),
    text: label,
    on: { click: onClick },
  });
}
