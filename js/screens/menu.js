import { el } from "../utils/dom.js";
import { Router } from "../router.js";

/**
 * Landing menu with app tools for random player, life tracking and team timer.
 */
export function createMenuScreen() {
  return {
    mount(container) {
      const screen = el("section", { class: "screen menu" }, [
        el("h1", { text: "Boardgame Helper" }),
        el("div", { class: "menu-buttons" }, [
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("random") },
            },
            [el("span", { class: "emoji", text: "👆" }), el("span", { text: "Random Player" })]
          ),
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("life") },
            },
            [el("span", { class: "emoji", text: "❤️" }), el("span", { text: "Track Life" })]
          ),
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("timer-settings") },
            },
            [el("span", { class: "emoji", text: "⏱️" }), el("span", { text: "Team Timer" })]
          ),
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("teams-settings") },
            },
            [el("span", { class: "emoji", text: "👥" }), el("span", { text: "Random Teams" })]
          ),
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("setup") },
            },
            [el("span", { class: "emoji", text: "🎲" }), el("span", { text: "Setup Randomizer" })]
          ),
          el(
            "button",
            {
              class: "menu-btn",
              on: { click: () => Router.go("random-word") },
            },
            [el("span", { class: "emoji", text: "🔤" }), el("span", { text: "Random Word" })]
          ),
        ]),
      ]);
      container.append(screen);
    },
  };
}
