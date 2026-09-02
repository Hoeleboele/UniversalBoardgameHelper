import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  createEmptyGame,
  getCurrentGameId,
  getGame,
  saveGame,
  setCurrentGameId,
} from "./setupState.js";

function copyDraft(game) {
  return {
    ...game,
    lists: game.lists.map((list) => ({ ...list, values: [...list.values] })),
  };
}

export function createSetupEditScreen() {
  return {
    mount(container) {
      const savedGame = getGame(getCurrentGameId());
      const draft = copyDraft(savedGame || createEmptyGame());
      const listsContainer = el("div", { class: "setup-edit-lists" });
      const status = el("p", { class: "setup-form-status", "aria-live": "polite" });
      const nameInput = el("input", {
        class: "setup-input",
        type: "text",
        value: draft.name,
        placeholder: "Game name",
      });

      function renderLists() {
        clear(listsContainer);

        draft.lists.forEach((list, listIndex) => {
          const titleInput = el("input", {
            class: "setup-input",
            type: "text",
            value: list.title,
            placeholder: "List title",
            on: { input: (event) => { list.title = event.target.value; } },
          });
          const valuesContainer = el("div", { class: "setup-value-list" });

          function renderValues() {
            clear(valuesContainer);
            list.values.forEach((value, valueIndex) => {
              const valueInput = el("input", {
                class: "setup-input",
                type: "text",
                value,
                placeholder: "Value",
                on: { input: (event) => { list.values[valueIndex] = event.target.value; } },
              });
              valuesContainer.append(el("div", { class: "setup-value-row" }, [
                valueInput,
                el("button", {
                  class: "btn btn-ghost setup-remove-btn",
                  type: "button",
                  text: "×",
                  "aria-label": "Remove value",
                  on: {
                    click: () => {
                      list.values.splice(valueIndex, 1);
                      renderValues();
                    },
                  },
                }),
              ]));
            });
          }

          renderValues();
          listsContainer.append(el("section", { class: "setup-list-editor" }, [
            el("div", { class: "setup-list-editor-head" }, [
              titleInput,
              el("button", {
                class: "btn btn-ghost setup-remove-btn",
                type: "button",
                text: "×",
                "aria-label": "Remove list",
                on: {
                  click: () => {
                    draft.lists.splice(listIndex, 1);
                    renderLists();
                  },
                },
              }),
            ]),
            valuesContainer,
            el("button", {
              class: "btn btn-ghost setup-add-value",
              type: "button",
              text: "+ Value",
              on: {
                click: () => {
                  list.values.push("");
                  renderValues();
                },
              },
            }),
          ]));
        });
      }

      function saveDraft() {
        draft.name = nameInput.value;
        const validLists = draft.lists.filter((list) => (
          list.title.trim() && list.values.some((value) => value.trim())
        ));

        if (!draft.name.trim()) {
          status.textContent = "Enter a game name.";
          nameInput.focus();
          return;
        }
        if (validLists.length === 0) {
          status.textContent = "Add a titled list with at least one value.";
          return;
        }

        draft.lists = validLists;
        const saved = saveGame(draft);
        setCurrentGameId(saved.id);
        Router.go("setup");
      }

      const screen = el("section", { class: "screen setup-edit-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Back",
            on: { click: () => Router.go("setup") },
          }),
          el("h1", { text: savedGame ? "Edit Game" : "New Game" }),
        ]),
        el("form", {
          class: "setup-edit-form",
          on: { submit: (event) => { event.preventDefault(); saveDraft(); } },
        }, [
          el("label", { class: "setup-field" }, [
            el("span", { class: "timer-label", text: "Game name" }),
            nameInput,
          ]),
          el("div", { class: "setup-lists-heading" }, [
            el("span", { class: "timer-label", text: "Setup lists" }),
            el("button", {
              class: "btn btn-ghost",
              type: "button",
              text: "+ List",
              on: {
                click: () => {
                  draft.lists.push({ title: "", values: [""] });
                  renderLists();
                },
              },
            }),
          ]),
          listsContainer,
          status,
          el("button", { class: "btn setup-primary-action", type: "submit", text: "Save Game" }),
        ]),
      ]);

      renderLists();
      container.append(screen);
    },
  };
}