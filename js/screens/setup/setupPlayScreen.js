import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { getCurrentGameId, getGame } from "./setupState.js";

export function createSetupPlayScreen() {
  return {
    mount(container) {
      const game = getGame(getCurrentGameId());
      if (!game) {
        Router.go("setup");
        return;
      }

      const results = el("div", { class: "setup-results" });

      function randomize() {
        clear(results);
        game.lists.forEach((list) => {
          if (list.values.length === 0) return;
          const value = list.values[Math.floor(Math.random() * list.values.length)];
          results.append(el("article", { class: "setup-result" }, [
            el("h2", { text: list.title }),
            el("p", { text: value }),
          ]));
        });
      }

      const screen = el("section", { class: "screen setup-play-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Games",
            on: { click: () => Router.go("setup") },
          }),
          el("h1", { text: game.name }),
          el("div", { class: "spacer" }),
          el("button", {
            class: "btn btn-ghost",
            text: "Edit",
            on: { click: () => Router.go("setup-edit") },
          }),
        ]),
        el("div", { class: "setup-play-body" }, [
          el("button", {
            class: "btn setup-randomize-btn",
            text: "Randomize",
            on: { click: randomize },
          }),
          results,
        ]),
      ]);

      container.append(screen);
    },
  };
}