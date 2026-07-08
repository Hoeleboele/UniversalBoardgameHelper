import { el, clear } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { LifeState } from "./lifeState.js";
import { createPlayerCard } from "./playerCard.js";

/**
 * Track Life screen: orchestrates the player list, add/remove and global reset.
 */
export function createLifeScreen() {
  const state = new LifeState();
  let unsubscribe = null;

  const list = el("ul", { class: "life-list" });

  const addBtn = el("button", {
    class: "btn btn-ghost btn-icon",
    "aria-label": "Add player",
    text: "＋",
    on: { click: () => state.addPlayer() },
  });

  function render(players) {
    clear(list);
    list.dataset.count = players.length;
    players.forEach((p) => {
      list.append(createPlayerCard(p, state, { canRemove: state.canRemove }));
    });
    addBtn.disabled = !state.canAdd;
    addBtn.style.opacity = state.canAdd ? "1" : "0.4";
  }

  return {
    mount(container) {
      const screen = el("section", { class: "screen life" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Menu",
            on: { click: () => Router.go("menu") },
          }),
          el("span", { class: "spacer" }),
          addBtn,
          el("button", {
            class: "btn btn-danger",
            text: "Reset all",
            on: { click: () => state.resetAll() },
          }),
        ]),
        list,
      ]);
      container.append(screen);

      unsubscribe = state.subscribe(render);
      render(state.players);
    },
    unmount() {
      if (unsubscribe) unsubscribe();
    },
  };
}
