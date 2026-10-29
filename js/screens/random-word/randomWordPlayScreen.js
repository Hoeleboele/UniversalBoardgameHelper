import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { getLanguage } from "./randomWordState.js";
import { WORD_LISTS } from "./wordLists.js";

const HOLD_DELAY_MS = 500;

export function createRandomWordPlayScreen() {
  let holdTimer = null;

  const word = el("p", { class: "random-word-display", "aria-live": "polite" });
  const hint = el("p", {
    class: "random-word-hint",
    text: "Press and hold for a word",
  });
  const holdButton = el("button", {
    class: "btn random-word-hold-btn",
    text: "Hold to reveal",
    "aria-label": "Press and hold for half a second to reveal a random word",
  });
  const progress = el("div", { class: "random-word-hold-progress", "aria-hidden": "true" }, [
    el("span"),
  ]);
  const hideButton = el("button", {
    class: "btn btn-ghost random-word-hide-btn",
    text: "Hide word",
    hidden: true,
    on: {
      click: () => {
        word.hidden = !word.hidden;
        hideButton.textContent = word.hidden ? "Show word" : "Hide word";
        hint.textContent = word.hidden
          ? "Word hidden"
          : "Hold again for another word";
      },
    },
  });

  function revealWord() {
    const words = WORD_LISTS[getLanguage()];
    word.textContent = words[Math.floor(Math.random() * words.length)];
    hint.textContent = "Hold again for another word";
    holdButton.textContent = "Hold for another word";
    progress.classList.remove("is-holding");
    hideButton.hidden = false;
  }

  function startHold(event) {
    if (event.type === "keydown" && event.repeat) return;
    if (event.type === "keydown" && event.key !== " " && event.key !== "Enter") return;
    if (holdTimer !== null) return;
    if (event.type === "pointerdown" && event.button !== 0) return;

    event.preventDefault();
    progress.classList.add("is-holding");
    holdTimer = setTimeout(() => {
      holdTimer = null;
      revealWord();
    }, HOLD_DELAY_MS);
  }

  function cancelHold(event) {
    if (event.type === "keyup" && event.key !== " " && event.key !== "Enter") return;
    progress.classList.remove("is-holding");
    if (holdTimer !== null) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  holdButton.addEventListener("pointerdown", startHold);
  holdButton.addEventListener("pointerup", cancelHold);
  holdButton.addEventListener("pointercancel", cancelHold);
  holdButton.addEventListener("keydown", startHold);
  holdButton.addEventListener("keyup", cancelHold);
  holdButton.addEventListener("blur", cancelHold);

  return {
    mount(container) {
      container.append(
        el("section", { class: "screen random-word-play" }, [
          el("div", { class: "topbar" }, [
            el("button", {
              class: "btn btn-ghost",
              text: "‹ Menu",
              on: { click: () => Router.go("menu") },
            }),
          ]),
          el("div", { class: "random-word-play-content" }, [
            word,
            hint,
            progress,
            holdButton,
            hideButton,
          ]),
        ])
      );
    },
    unmount() {
      if (holdTimer !== null) clearTimeout(holdTimer);
      holdTimer = null;
      holdButton.removeEventListener("pointerdown", startHold);
      holdButton.removeEventListener("pointerup", cancelHold);
      holdButton.removeEventListener("pointercancel", cancelHold);
      holdButton.removeEventListener("keydown", startHold);
      holdButton.removeEventListener("keyup", cancelHold);
      holdButton.removeEventListener("blur", cancelHold);
    },
  };
}