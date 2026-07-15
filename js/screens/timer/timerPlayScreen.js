import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { getColor } from "../../constants/colors.js";
import {
  getTimerSnapshot,
  handleNeutralPress,
  handleTeamPress,
  pauseTimer,
  subscribeTimer,
} from "./timerState.js";

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

let audioCtx = null;

function playEndTone() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    if (!audioCtx) {
      audioCtx = new Ctx();
    }

    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.36);
  } catch {
    // Ignore browsers that block audio until a user gesture.
  }
}

export function createTimerPlayScreen() {
  let unsubscribe = null;
  let lastEndedAt = 0;
  let lastNeutralEndedAt = 0;

  const teamANameEl = el("div", { class: "timer-team-name" });
  const teamATimeEl = el("div", { class: "timer-team-time" });
  const teamAHalf = el("button", {
    class: "timer-team-half timer-team-a",
    type: "button",
    on: { click: () => handleTeamPress("a") },
  }, [teamANameEl, teamATimeEl]);

  const teamBNameEl = el("div", { class: "timer-team-name" });
  const teamBTimeEl = el("div", { class: "timer-team-time" });
  const teamBHalf = el("button", {
    class: "timer-team-half timer-team-b",
    type: "button",
    on: { click: () => handleTeamPress("b") },
  }, [teamBNameEl, teamBTimeEl]);

  const statusEl = el("div", { class: "timer-status" });
  const statusMirrorEl = el("div", { class: "timer-status timer-status-mirror" });

  const pauseBtn = el("button", {
    class: "timer-pause-fab",
    type: "button",
    text: "❚❚",
    "aria-label": "Pause timer",
    on: { click: () => pauseTimer() },
  });

  const neutralBtn = el("button", {
    class: "timer-neutral-bar",
    type: "button",
    on: { click: () => handleNeutralPress() },
  });

  function render(state) {
    const colorA = getColor(state.settings.teamAColorId);
    const colorB = getColor(state.settings.teamBColorId);

    teamANameEl.textContent = state.settings.teamAName;
    teamBNameEl.textContent = state.settings.teamBName;
    teamATimeEl.textContent = formatTime(state.remainingA);
    teamBTimeEl.textContent = formatTime(state.remainingB);

    teamAHalf.style.background = colorA.value;
    teamBHalf.style.background = colorB.value;
    teamAHalf.dataset.light = String(colorA.light);
    teamBHalf.dataset.light = String(colorB.light);

    teamAHalf.classList.toggle("active", !state.paused && state.activeTeam === "a");
    teamBHalf.classList.toggle("active", !state.paused && state.activeTeam === "b");
    teamAHalf.classList.toggle("inactive", !state.paused && state.activeTeam !== "a");
    teamBHalf.classList.toggle("inactive", !state.paused && state.activeTeam !== "b");

    neutralBtn.style.display = state.settings.neutralEnabled ? "flex" : "none";
    neutralBtn.textContent = formatTime(state.neutralRemaining);
    neutralBtn.classList.toggle("active", state.neutralActive);
    neutralBtn.disabled = state.ended || state.neutralRemaining <= 0;
    pauseBtn.classList.toggle("left", state.neutralActive);

    let statusText = "";
    if (state.ended) {
      const winner = state.remainingA === 0 ? state.settings.teamBName : state.settings.teamAName;
      statusText = `${winner} wins`;
      pauseBtn.disabled = true;
    } else if (state.neutralActive) {
      statusText = "Neutral timer";
      pauseBtn.disabled = false;
    } else if (
      state.settings.neutralEnabled
      && state.neutralRemaining < state.settings.neutralSeconds
      && state.paused
    ) {
      statusText = "Neutral paused";
      pauseBtn.disabled = true;
    } else if (state.paused) {
      statusText = "Paused";
      pauseBtn.disabled = true;
    } else {
      statusText = `${state.activeTeam === "a" ? state.settings.teamAName : state.settings.teamBName} turn`;
      pauseBtn.disabled = false;
    }

    statusEl.textContent = statusText;
    statusMirrorEl.textContent = statusText;

    if (state.endedAt && state.endedAt !== lastEndedAt) {
      lastEndedAt = state.endedAt;
      playEndTone();
    }

    if (state.neutralEndedAt && state.neutralEndedAt !== lastNeutralEndedAt) {
      lastNeutralEndedAt = state.neutralEndedAt;
      playEndTone();
    }
  }

  return {
    mount(container) {
      const initial = getTimerSnapshot();
      lastEndedAt = initial.endedAt;
      lastNeutralEndedAt = initial.neutralEndedAt;

      const screen = el("section", { class: "screen timer-play-screen" }, [
        el("div", { class: "topbar" }, [
          el("button", {
            class: "btn btn-ghost",
            text: "‹ Menu",
            on: { click: () => Router.go("menu") },
          }),
          el("h1", { text: "Team Timer" }),
        ]),
        el("div", { class: "timer-play-board" }, [
          teamAHalf,
          neutralBtn,
          teamBHalf,
          pauseBtn,
          statusEl,
          statusMirrorEl,
        ]),
      ]);

      container.append(screen);

      render(initial);
      unsubscribe = subscribeTimer(render);
    },
    unmount() {
      pauseTimer();
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
    },
  };
}
