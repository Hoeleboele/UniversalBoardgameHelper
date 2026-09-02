import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import {
  getTeamSettings,
  updateTeamSettings,
  MIN_TEAMS,
  MAX_TEAMS,
} from "./teamsState.js";

/**
 * Settings screen for the random teams tool. Lets the user pick how many
 * teams the players on screen should be split into before starting.
 */
export function createTeamsSettingsScreen() {
  let teamCount = MIN_TEAMS;

  return {
    mount(container) {
      teamCount = getTeamSettings().teamCount;

      const countValue = el("div", {
        class: "teams-count",
        text: String(teamCount),
      });

      const decBtn = el("button", {
        class: "btn teams-stepper-btn",
        text: "−",
        "aria-label": "Fewer teams",
      });
      const incBtn = el("button", {
        class: "btn teams-stepper-btn",
        text: "+",
        "aria-label": "More teams",
      });

      function render() {
        countValue.textContent = String(teamCount);
        decBtn.disabled = teamCount <= MIN_TEAMS;
        incBtn.disabled = teamCount >= MAX_TEAMS;
      }

      decBtn.addEventListener("click", () => {
        if (teamCount > MIN_TEAMS) {
          teamCount -= 1;
          render();
        }
      });
      incBtn.addEventListener("click", () => {
        if (teamCount < MAX_TEAMS) {
          teamCount += 1;
          render();
        }
      });

      const screen = el("section", { class: "screen teams-settings" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Menu",
            on: { click: () => Router.go("menu") },
          }),
        ]),
        el("div", { class: "teams-settings-body" }, [
          el("div", { class: "teams-field" }, [
            el("div", { class: "timer-label", text: "Number of teams" }),
            el("div", { class: "teams-stepper" }, [decBtn, countValue, incBtn]),
          ]),
          el("button", {
            class: "btn teams-start-btn",
            text: "Start",
            on: {
              click: () => {
                updateTeamSettings({ teamCount });
                Router.go("teams-play");
              },
            },
          }),
        ]),
      ]);

      render();
      container.append(screen);
    },
  };
}
