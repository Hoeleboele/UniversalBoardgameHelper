import { clear, el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  copyFlowGame,
  createEmptyChoice,
  createEmptyFlowGame,
  createEmptyStep,
  getCurrentFlowGameId,
  getFlowGame,
  saveFlowGame,
  setCurrentFlowGameId,
} from "./flowState.js";

function stepLabel(step, index) {
  const title = step.title.trim() || "(untitled)";
  return `${index + 1}. ${title}`;
}

export function createFlowEditScreen() {
  return {
    mount(container) {
      const savedGame = getFlowGame(getCurrentFlowGameId());
      const draft = copyFlowGame(savedGame || createEmptyFlowGame());
      const stepsContainer = el("div", { class: "setup-edit-lists" });
      const status = el("p", { class: "setup-form-status", "aria-live": "polite" });
      const nameInput = el("input", {
        class: "setup-input",
        type: "text",
        value: draft.name,
        placeholder: "Game name",
      });

      /** @type {{select: HTMLSelectElement, option: {targetId: string}}[]} */
      let targetSelects = [];

      function fillTargetSelect(select, option) {
        clear(select);
        select.append(el("option", { value: "", text: "→ Next step" }));
        draft.steps.forEach((step, index) => {
          select.append(el("option", {
            value: step.id,
            text: `→ ${stepLabel(step, index)}`,
          }));
        });
        select.value = draft.steps.some((s) => s.id === option.targetId)
          ? option.targetId
          : "";
      }

      function refreshTargetSelects() {
        targetSelects.forEach(({ select, option }) => fillTargetSelect(select, option));
      }

      function moveStep(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= draft.steps.length) return;
        const [step] = draft.steps.splice(index, 1);
        draft.steps.splice(target, 0, step);
        renderSteps();
      }

      function removeStep(index) {
        const [removed] = draft.steps.splice(index, 1);
        draft.steps.forEach((step) => {
          if (!step.choice) return;
          step.choice.options.forEach((option) => {
            if (option.targetId === removed.id) option.targetId = "";
          });
        });
        renderSteps();
      }

      function renderChoice(step) {
        if (!step.choice) return null;

        return el("div", { class: "flow-choice-editor" }, step.choice.options.map((option, i) => {
          const select = el("select", {
            class: "setup-input flow-target-select",
            "aria-label": `Option ${i + 1} goes to`,
            on: { change: (event) => { option.targetId = event.target.value; } },
          });
          targetSelects.push({ select, option });
          fillTargetSelect(select, option);

          return el("div", { class: "flow-option-row" }, [
            el("input", {
              class: "setup-input",
              type: "text",
              value: option.label,
              placeholder: `Option ${i + 1} label`,
              on: { input: (event) => { option.label = event.target.value; } },
            }),
            select,
          ]);
        }));
      }

      function renderSteps() {
        clear(stepsContainer);
        targetSelects = [];

        draft.steps.forEach((step, index) => {
          const isLast = index === draft.steps.length - 1;

          stepsContainer.append(el("section", { class: "setup-list-editor" }, [
            el("div", { class: "setup-list-editor-head" }, [
              el("span", { class: "flow-step-number", text: String(index + 1) }),
              el("input", {
                class: "setup-input",
                type: "text",
                value: step.title,
                placeholder: "Step title",
                on: {
                  input: (event) => {
                    step.title = event.target.value;
                    refreshTargetSelects();
                  },
                },
              }),
              el("button", {
                class: "btn btn-ghost setup-remove-btn",
                type: "button",
                text: "×",
                "aria-label": "Remove step",
                disabled: draft.steps.length <= 1,
                on: { click: () => removeStep(index) },
              }),
            ]),
            el("textarea", {
              class: "setup-input flow-description-input",
              rows: "2",
              placeholder: "Description (optional)",
              on: { input: (event) => { step.description = event.target.value; } },
            }, [step.description]),
            renderChoice(step),
            el("div", { class: "flow-step-actions" }, [
              el("button", {
                class: "btn btn-ghost",
                type: "button",
                text: "↑",
                "aria-label": "Move step up",
                disabled: index === 0,
                on: { click: () => moveStep(index, -1) },
              }),
              el("button", {
                class: "btn btn-ghost",
                type: "button",
                text: "↓",
                "aria-label": "Move step down",
                disabled: isLast,
                on: { click: () => moveStep(index, 1) },
              }),
              el("div", { class: "spacer" }),
              el("button", {
                class: "btn btn-ghost",
                type: "button",
                text: step.choice ? "Remove choice" : "+ Choice",
                on: {
                  click: () => {
                    step.choice = step.choice ? null : createEmptyChoice();
                    renderSteps();
                  },
                },
              }),
            ]),
          ]));
        });
      }

      function saveDraft() {
        draft.name = nameInput.value;

        if (!draft.name.trim()) {
          status.textContent = "Enter a game name.";
          nameInput.focus();
          return;
        }
        if (!draft.steps.some((step) => step.title.trim())) {
          status.textContent = "Add at least one step with a title.";
          return;
        }

        const saved = saveFlowGame(draft);
        setCurrentFlowGameId(saved.id);
        Router.go("flow");
      }

      const screen = el("section", { class: "screen setup-edit-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Back",
            on: { click: () => Router.go("flow") },
          }),
          el("h1", { text: savedGame ? "Edit Flow" : "New Flow" }),
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
            el("span", { class: "timer-label", text: "Steps" }),
          ]),
          stepsContainer,
          el("button", {
            class: "btn btn-ghost setup-add-value",
            type: "button",
            text: "+ Step",
            on: {
              click: () => {
                draft.steps.push(createEmptyStep());
                renderSteps();
              },
            },
          }),
          el("p", {
            class: "flow-edit-hint",
            text: "Steps without a title are skipped. After the last step the flow loops back to step 1.",
          }),
          status,
          el("button", { class: "btn setup-primary-action", type: "submit", text: "Save Flow" }),
        ]),
      ]);

      renderSteps();
      container.append(screen);
    },
  };
}
