import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  deleteFlowGame,
  getFlowGames,
  setCurrentFlowGameId,
} from "./flowState.js";

export function createFlowListScreen() {
  return {
    mount(container) {
      const gamesList = el("div", { class: "setup-games" });

      function openGame(gameId) {
        setCurrentFlowGameId(gameId);
        Router.go("flow-play");
      }

      function editGame(gameId) {
        setCurrentFlowGameId(gameId);
        Router.go("flow-edit");
      }

      function renderGames() {
        clear(gamesList);
        const games = getFlowGames();

        if (games.length === 0) {
          gamesList.append(el("p", {
            class: "setup-empty",
            text: "No saved flows yet.",
          }));
          return;
        }

        games.forEach((game) => {
          gamesList.append(el("article", { class: "setup-game-row" }, [
            el("button", {
              class: "setup-game-open",
              text: game.name,
              on: { click: () => openGame(game.id) },
            }),
            el("div", { class: "setup-game-actions" }, [
              el("button", {
                class: "btn btn-ghost btn-icon",
                text: "Edit",
                "aria-label": `Edit ${game.name}`,
                on: { click: () => editGame(game.id) },
              }),
              el("button", {
                class: "btn btn-danger btn-icon",
                text: "Delete",
                "aria-label": `Delete ${game.name}`,
                on: {
                  click: () => {
                    if (!window.confirm(`Delete ${game.name}?`)) return;
                    deleteFlowGame(game.id);
                    renderGames();
                  },
                },
              }),
            ]),
          ]));
        });
      }

      const screen = el("section", { class: "screen setup-list-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Menu",
            on: { click: () => Router.go("menu") },
          }),
          el("h1", { text: "Game Flow" }),
        ]),
        el("div", { class: "setup-list-body" }, [
          el("button", {
            class: "btn setup-primary-action",
            text: "New Game",
            on: {
              click: () => {
                setCurrentFlowGameId(null);
                Router.go("flow-edit");
              },
            },
          }),
          gamesList,
        ]),
      ]);

      renderGames();
      container.append(screen);
    },
  };
}
