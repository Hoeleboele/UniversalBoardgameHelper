import { el, clear } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { COLORS } from "../../constants/colors.js";
import {
  getTimerSettings,
  updateTimerSettings,
} from "./timerState.js";

function formatDurationInput(seconds) {
  const safe = Math.max(1, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function parseDurationInput(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return seconds >= 1 ? seconds : null;
  }

  const match = /^(\d+):(\d{1,2})$/.exec(text);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  if (seconds > 59) return null;

  const total = minutes * 60 + seconds;
  return total >= 1 ? total : null;
}

export function createTimerSettingsScreen() {
  let teamAColorId = "red";
  let teamBColorId = "blue";
  let neutralEnabled = false;

  return {
    mount(container) {
      const saved = getTimerSettings();
      teamAColorId = saved.teamAColorId;
      teamBColorId = saved.teamBColorId;
      neutralEnabled = saved.neutralEnabled;

      const teamANameInput = el("input", {
        class: "timer-input",
        type: "text",
        value: saved.teamAName,
        maxlength: "24",
        placeholder: "Team A",
      });

      const teamBNameInput = el("input", {
        class: "timer-input",
        type: "text",
        value: saved.teamBName,
        maxlength: "24",
        placeholder: "Team B",
      });

      const teamATimeInput = el("input", {
        class: "timer-input",
        type: "text",
        value: formatDurationInput(saved.teamASeconds),
        placeholder: "5:00",
      });

      const teamBTimeInput = el("input", {
        class: "timer-input",
        type: "text",
        value: formatDurationInput(saved.teamBSeconds),
        placeholder: "5:00",
      });

      const neutralTimeInput = el("input", {
        class: "timer-input",
        type: "text",
        value: formatDurationInput(saved.neutralSeconds),
        placeholder: "3:00",
      });
      neutralTimeInput.disabled = !neutralEnabled;

      const neutralEnabledInput = el("input", {
        type: "checkbox",
        checked: neutralEnabled ? "checked" : undefined,
        on: {
          change: (e) => {
            neutralEnabled = Boolean(e.target.checked);
            neutralTimeInput.disabled = !neutralEnabled;
          },
        },
      });

      const teamASwatchList = el("div", { class: "timer-swatch-list" });
      const teamBSwatchList = el("div", { class: "timer-swatch-list" });

      function buildSwatchButton(color, isSelected, onPick) {
        return el("button", {
          type: "button",
          class: `timer-swatch-btn${isSelected ? " selected" : ""}`,
          style: `background:${color.value}`,
          title: color.id,
          "aria-label": color.id,
          "aria-pressed": String(isSelected),
          on: { click: onPick },
        });
      }

      function renderSwatches() {
        clear(teamASwatchList);
        clear(teamBSwatchList);

        COLORS.forEach((color) => {
          teamASwatchList.append(
            buildSwatchButton(color, teamAColorId === color.id, () => {
              teamAColorId = color.id;
              renderSwatches();
            })
          );

          teamBSwatchList.append(
            buildSwatchButton(color, teamBColorId === color.id, () => {
              teamBColorId = color.id;
              renderSwatches();
            })
          );
        });
      }

      function startTimer() {
        const teamASeconds = parseDurationInput(teamATimeInput.value);
        const teamBSeconds = parseDurationInput(teamBTimeInput.value);
        const parsedNeutralSeconds = parseDurationInput(neutralTimeInput.value);

        if (!teamASeconds || !teamBSeconds) {
          window.alert("Use a valid time like 5:00 or total seconds.");
          return;
        }

        if (neutralEnabled && !parsedNeutralSeconds) {
          window.alert("Use a valid neutral time like 3:00 or total seconds.");
          return;
        }

        const neutralSeconds = parsedNeutralSeconds || saved.neutralSeconds || 3 * 60;

        updateTimerSettings({
          teamAName: teamANameInput.value,
          teamBName: teamBNameInput.value,
          teamASeconds,
          teamBSeconds,
          teamAColorId,
          teamBColorId,
          neutralEnabled,
          neutralSeconds,
        });

        Router.go("timer-play");
      }

      renderSwatches();

      const screen = el("section", { class: "screen timer-settings" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Menu",
            on: { click: () => Router.go("menu") },
          }),
          el("h1", { text: "Team Timer Settings" }),
        ]),
        el("form", {
          class: "timer-settings-form",
          on: {
            submit: (e) => {
              e.preventDefault();
              startTimer();
            },
          },
        }, [
          el("label", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team A Name" }),
            teamANameInput,
          ]),
          el("label", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team A Time (M:SS)" }),
            teamATimeInput,
          ]),
          el("div", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team A Color" }),
            teamASwatchList,
          ]),
          el("label", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team B Name" }),
            teamBNameInput,
          ]),
          el("label", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team B Time (M:SS)" }),
            teamBTimeInput,
          ]),
          el("div", { class: "timer-field" }, [
            el("span", { class: "timer-label", text: "Team B Color" }),
            teamBSwatchList,
          ]),
          el("div", { class: "timer-field timer-neutral-row" }, [
            el("span", { class: "timer-label", text: "Neutral Timer" }),
            el("label", { class: "timer-neutral-toggle" }, [
              neutralEnabledInput,
              el("span", { text: "Enabled" }),
            ]),
            neutralTimeInput,
          ]),
          el("button", {
            class: "btn",
            type: "submit",
            text: "Start Timer",
          }),
        ]),
      ]);

      container.append(screen);
    },
  };
}
