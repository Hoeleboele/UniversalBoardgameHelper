import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  deleteGame,
  getGames,
  setCurrentGameId,
} from "./setupState.js";

export function createSetupListScreen() {
  return {
    mount(container) {
      const gamesList = el("div", { class: "setup-games" });

      function openGame(gameId) {
        setCurrentGameId(gameId);
        Router.go("setup-play");
      }

      function editGame(gameId) {
        setCurrentGameId(gameId);
        Router.go("setup-edit");
      }

      function renderGames() {
        clear(gamesList);
        const games = getGames();

        if (games.length === 0) {
          gamesList.append(el("p", {
            class: "setup-empty",
            text: "No saved games yet.",
          }));
          return;
        }

        games.forEach((game) => {
          const gameButton = el("button", {
            class: "setup-game-open",
            text: game.name,
            on: { click: () => openGame(game.id) },
          });
          const editButton = el("button", {
            class: "btn btn-ghost btn-icon",
            text: "Edit",
            "aria-label": `Edit ${game.name}`,
            on: { click: () => editGame(game.id) },
          });
          const deleteButton = el("button", {
            class: "btn btn-danger btn-icon",
            text: "Delete",
            "aria-label": `Delete ${game.name}`,
            on: {
              click: () => {
                if (!window.confirm(`Delete ${game.name}?`)) return;
                deleteGame(game.id);
                renderGames();
              },
            },
          });

          gamesList.append(el("article", { class: "setup-game-row" }, [
            gameButton,
            el("div", { class: "setup-game-actions" }, [editButton, deleteButton]),
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
          el("h1", { text: "Setup Randomizer" }),
        ]),
        el("div", { class: "setup-list-body" }, [
          el("button", {
            class: "btn setup-primary-action",
            text: "New Game",
            on: {
              click: () => {
                setCurrentGameId(null);
                Router.go("setup-edit");
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