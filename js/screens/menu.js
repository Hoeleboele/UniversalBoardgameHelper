import { el } from "../utils/dom.js";
import { Router } from "../router.js";

/**
 * Landing menu with two options: Random Player and Track Life.
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
        ]),
      ]);
      container.append(screen);
    },
  };
}
