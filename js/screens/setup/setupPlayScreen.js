import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { getCurrentGameId, getGame } from "./setupState.js";

function pickUniqueValues(values, count) {
  if (!Array.isArray(values) || values.length === 0) return [];
  
  const clampedCount = Math.max(1, Math.min(count, values.length));
  
  // Fisher-Yates shuffle of a copy
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, clampedCount);
}

export function createSetupPlayScreen() {
  return {
    mount(container) {
      const game = getGame(getCurrentGameId());
      if (!game) {
        Router.go("setup");
        return;
      }

      const results = el("div", { class: "setup-results" });
      
      // Ephemeral per-list override state (not persisted)
      const overrides = game.lists.map((list) =>
        Math.max(1, Math.min(list.count || 1, list.values.length))
      );

      function updateStepperUI(listIndex) {
        const stepper = document.querySelector(`[data-stepper-index="${listIndex}"]`);
        if (!stepper) return;
        
        const minusBtn = stepper.querySelector("[data-action='minus']");
        const countSpan = stepper.querySelector("[data-action='count']");
        const plusBtn = stepper.querySelector("[data-action='plus']");
        const currentCount = overrides[listIndex];
        const maxCount = game.lists[listIndex].values.length;
        
        countSpan.textContent = currentCount;
        minusBtn.disabled = currentCount <= 1;
        plusBtn.disabled = currentCount >= maxCount;
      }

      function randomize() {
        clear(results);
        game.lists.forEach((list, listIndex) => {
          if (list.values.length === 0) return;
          
          const pickedValues = pickUniqueValues(list.values, overrides[listIndex]);
          const valueItems = pickedValues.map((value) =>
            el("li", { text: value })
          );
          
          results.append(el("article", { class: "setup-result" }, [
            el("h2", { text: list.title }),
            el("ul", { class: "setup-result-values" }, valueItems),
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
          el("div", { class: "setup-stepper-list" }, game.lists.map((list, listIndex) => {
            const maxCount = list.values.length;
            const hideStepperIfSingleValue = maxCount <= 1;
            
            return el("div", { class: "setup-stepper-row", "data-stepper-index": listIndex }, [
              el("span", { class: "setup-stepper-title", text: list.title }),
              hideStepperIfSingleValue
                ? el("span", { text: "1" })
                : el("div", { class: "setup-stepper" }, [
                    el("button", {
                      class: "btn btn-ghost setup-stepper-btn",
                      type: "button",
                      text: "−",
                      "data-action": "minus",
                      disabled: overrides[listIndex] <= 1,
                      on: {
                        click: () => {
                          if (overrides[listIndex] > 1) {
                            overrides[listIndex]--;
                            updateStepperUI(listIndex);
                          }
                        },
                      },
                    }),
                    el("span", { "data-action": "count", text: String(overrides[listIndex]) }),
                    el("button", {
                      class: "btn btn-ghost setup-stepper-btn",
                      type: "button",
                      text: "+",
                      "data-action": "plus",
                      disabled: overrides[listIndex] >= maxCount,
                      on: {
                        click: () => {
                          if (overrides[listIndex] < maxCount) {
                            overrides[listIndex]++;
                            updateStepperUI(listIndex);
                          }
                        },
                      },
                    }),
                  ]),
            ]);
          })),
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