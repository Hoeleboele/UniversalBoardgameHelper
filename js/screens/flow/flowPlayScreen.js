import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  getCurrentFlowGameId,
  getFlowGame,
  getNextStepIndex,
} from "./flowState.js";

/**
 * Plays a saved flow: tapping anywhere advances to the next step, choice steps
 * branch via their two option buttons, and the flow loops back to step 1
 * (starting a new round) until the screen is left.
 */
export function createFlowPlayScreen() {
  let screen = null;
  let onScreenClick = null;

  return {
    mount(container) {
      const game = getFlowGame(getCurrentFlowGameId());
      if (!game || game.steps.length === 0) {
        Router.go("flow");
        return;
      }

      let index = 0;
      let round = 1;
      /** @type {{index: number, round: number}[]} */
      const history = [];

      const roundLabel = el("span", { class: "flow-round" });
      const stepCounter = el("span", { class: "flow-step-counter" });
      const title = el("h2", { class: "flow-step-title" });
      const description = el("p", { class: "flow-step-description" });
      const options = el("div", { class: "flow-options" });
      const hint = el("p", { class: "flow-tap-hint" });
      const prevButton = el("button", {
        class: "btn btn-ghost flow-prev-btn",
        type: "button",
        text: "‹ Previous step",
        on: { click: goBack },
      });

      function goTo(nextIndex) {
        history.push({ index, round });
        if (nextIndex === 0) round += 1;
        index = nextIndex;
        render();
      }

      function advance(optionIndex = null) {
        goTo(getNextStepIndex(game, index, optionIndex));
      }

      function goBack() {
        const previous = history.pop();
        if (!previous) return;
        ({ index, round } = previous);
        render();
      }

      function render() {
        const step = game.steps[index];
        roundLabel.textContent = `Round ${round}`;
        stepCounter.textContent = `Step ${index + 1} / ${game.steps.length}`;
        title.textContent = step.title;
        description.textContent = step.description;
        description.hidden = !step.description;
        prevButton.disabled = history.length === 0;

        clear(options);
        if (step.choice) {
          step.choice.options.forEach((option, optionIndex) => {
            options.append(el("button", {
              class: "btn flow-option-btn",
              type: "button",
              text: option.label,
              on: { click: () => advance(optionIndex) },
            }));
          });
          hint.textContent = "Choose an option";
        } else {
          hint.textContent = "Tap anywhere for the next step";
        }
      }

      onScreenClick = (event) => {
        if (event.target.closest("button")) return;
        if (game.steps[index].choice) return;
        advance();
      };

      screen = el("section", { class: "screen flow-play-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Flows",
            on: { click: () => Router.go("flow") },
          }),
          el("h1", { text: game.name }),
          el("div", { class: "spacer" }),
          el("button", {
            class: "btn btn-ghost",
            text: "Edit",
            on: { click: () => Router.go("flow-edit") },
          }),
        ]),
        el("div", { class: "flow-play-body" }, [
          el("div", { class: "flow-progress" }, [roundLabel, stepCounter]),
          el("article", { class: "flow-step-card" }, [title, description, options]),
          hint,
          prevButton,
        ]),
      ]);

      screen.addEventListener("click", onScreenClick);
      render();
      container.append(screen);
    },
    unmount() {
      if (screen && onScreenClick) screen.removeEventListener("click", onScreenClick);
    },
  };
}
