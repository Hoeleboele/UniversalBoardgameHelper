import { el, clear } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { LifeState, RESET_LIFE_MIN, RESET_LIFE_MAX } from "./lifeState.js";
import { createPlayerCard } from "./playerCard.js";

const LIFE_LANDSCAPE_CLASS = "life-force-landscape";
let removeFullscreenRetryListeners = null;

async function enterLifeFullscreen() {
  if (!document.fullscreenEnabled || document.fullscreenElement) return true;
  const root = document.documentElement;
  if (!root || typeof root.requestFullscreen !== "function") return false;
  try {
    await root.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

function setupFullscreenRetry(screenNode) {
  if (removeFullscreenRetryListeners) removeFullscreenRetryListeners();

  const retry = async () => {
    const entered = await enterLifeFullscreen();
    if (!entered) return;
    if (removeFullscreenRetryListeners) removeFullscreenRetryListeners();
  };

  screenNode.addEventListener("pointerdown", retry);
  screenNode.addEventListener("keydown", retry);

  removeFullscreenRetryListeners = () => {
    screenNode.removeEventListener("pointerdown", retry);
    screenNode.removeEventListener("keydown", retry);
    removeFullscreenRetryListeners = null;
  };
}

function cleanupFullscreenRetry() {
  if (removeFullscreenRetryListeners) removeFullscreenRetryListeners();
}

async function exitLifeFullscreen() {
  cleanupFullscreenRetry();
  if (!document.fullscreenElement || typeof document.exitFullscreen !== "function") return;
  try {
    await document.exitFullscreen();
  } catch {
    // Ignore cases where the browser blocks programmatic fullscreen exit.
  }
}

async function lockLifeLandscape() {
  document.body.classList.add(LIFE_LANDSCAPE_CLASS);
  const orientation = screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock("landscape");
  } catch {
    // Some browsers only allow orientation lock in fullscreen/PWA mode.
  }
}

function unlockLifeLandscape() {
  document.body.classList.remove(LIFE_LANDSCAPE_CLASS);
  const orientation = screen.orientation;
  if (!orientation || typeof orientation.unlock !== "function") return;
  try {
    orientation.unlock();
  } catch {
    // Ignore browsers that do not allow unlocking.
  }
}

/**
 * Track Life screen: orchestrates the player list, add/remove and global reset.
 */
export function createLifeScreen() {
  const state = new LifeState();
  let unsubscribe = null;
  let screenNode = null;
  let menuBackdrop = null;
  let resetSlider = null;
  let resetValueEl = null;

  const list = el("ul", { class: "life-list" });

  const addBtn = el("button", {
    class: "btn btn-ghost",
    text: "Add player",
    on: { click: () => state.addPlayer() },
  });

  function openMenu() {
    if (!menuBackdrop) return;
    menuBackdrop.classList.add("open");
  }

  function closeMenu() {
    if (!menuBackdrop) return;
    menuBackdrop.classList.remove("open");
  }

  function render(players) {
    clear(list);
    list.dataset.count = players.length;
    players.forEach((p) => {
      list.append(createPlayerCard(p, state, { canRemove: state.canRemove }));
    });
    addBtn.disabled = !state.canAdd;
    addBtn.style.opacity = state.canAdd ? "1" : "0.4";

    if (resetSlider) resetSlider.value = String(state.resetLife);
    if (resetValueEl) resetValueEl.textContent = String(state.resetLife);
  }

  return {
    mount(container) {
      void enterLifeFullscreen();
      lockLifeLandscape();
      screenNode = el("section", { class: "screen life" }, [
        list,
        el("button", {
          class: "life-menu-fab",
          text: "☰",
          "aria-label": "Open life menu",
          on: { click: openMenu },
        }),
        (menuBackdrop = el("div", { class: "life-menu-backdrop" }, [
          el("div", { class: "life-menu-panel" }, [
            el("button", {
              class: "btn btn-ghost",
              text: "Back to menu",
              on: {
                click: () => {
                  closeMenu();
                  Router.go("menu");
                },
              },
            }),
            addBtn,
            el("button", {
              class: "btn btn-danger",
              text: "Reset all",
              on: {
                click: () => {
                  state.resetAll();
                  closeMenu();
                },
              },
            }),
            el("div", { class: "life-reset-setting" }, [
              el("div", { class: "life-reset-head" }, [
                el("span", { text: "Reset value" }),
                (resetValueEl = el("strong", {
                  class: "life-reset-value",
                  text: String(state.resetLife),
                })),
              ]),
              (resetSlider = el("input", {
                class: "life-reset-slider",
                type: "range",
                min: String(RESET_LIFE_MIN),
                max: String(RESET_LIFE_MAX),
                step: "1",
                value: String(state.resetLife),
                "aria-label": "Set life reset value",
                on: {
                  input: (e) => state.setResetLife(Number(e.target.value)),
                },
              })),
            ]),
          ]),
        ])),
      ]);
      container.append(screenNode);

      menuBackdrop.addEventListener("click", (e) => {
        if (e.target === menuBackdrop) closeMenu();
      });

      setupFullscreenRetry(screenNode);

      unsubscribe = state.subscribe(render);
      render(state.players);
    },
    unmount() {
      void exitLifeFullscreen();
      unlockLifeLandscape();
      if (unsubscribe) unsubscribe();
      menuBackdrop = null;
      screenNode = null;
    },
  };
}
