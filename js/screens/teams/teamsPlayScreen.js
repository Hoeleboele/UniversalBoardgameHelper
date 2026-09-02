import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { COLORS } from "../../constants/colors.js";
import { getTeamSettings } from "./teamsState.js";

const HOLD_DELAY_MS = 1200; // steady fingers before countdown starts
const COUNTDOWN_SECONDS = 3;

/**
 * Random Teams picker. Players press fingers on the screen; once at least
 * `teamCount` fingers are held steadily, a countdown runs and every finger is
 * coloured by the team it was assigned to, split as evenly as possible.
 */
export function createTeamsScreen() {
  const teamCount = getTeamSettings().teamCount;
  const minFingers = teamCount;

  /** @type {Map<number, {node: HTMLElement}>} */
  const pointers = new Map();
  let holdTimer = null;
  let countdownTimer = null;
  let phase = "collecting"; // collecting | countdown | revealed

  const collectingHint = `Place a finger — need at least ${minFingers}…`;

  const hint = el("div", { class: "random-hint", text: collectingHint });
  const countdown = el("div", { class: "random-countdown" });

  const surface = el("section", { class: "screen random teams-play" }, [
    el("div", { class: "topbar random-topbar" }, [
      el("button", {
        class: "btn btn-ghost",
        text: "‹ Teams",
        on: { click: () => Router.go("teams-settings") },
      }),
    ]),
    hint,
    countdown,
  ]);

  function teamColor(teamIndex) {
    return COLORS[teamIndex % COLORS.length].value;
  }

  function clearTimers() {
    if (holdTimer) clearTimeout(holdTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    holdTimer = null;
    countdownTimer = null;
  }

  function reset() {
    clearTimers();
    phase = "collecting";
    countdown.textContent = "";
    hint.style.display = "";
    hint.textContent = collectingHint;
    pointers.forEach(({ node }) => node.remove());
    pointers.clear();
  }

  function maybeStartCountdown() {
    if (phase !== "collecting") return;
    clearTimeout(holdTimer);
    holdTimer = null;
    if (pointers.size < minFingers) return;

    holdTimer = setTimeout(() => startCountdown(), HOLD_DELAY_MS);
  }

  function startCountdown() {
    if (pointers.size < minFingers) return;
    phase = "countdown";
    hint.style.display = "none";
    let remaining = COUNTDOWN_SECONDS;
    countdown.textContent = String(remaining);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        reveal();
      } else {
        countdown.textContent = String(remaining);
      }
    }, 1000);
  }

  function cancelCountdown() {
    if (phase !== "countdown") return;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    phase = "collecting";
    countdown.textContent = "";
    hint.style.display = "";
    hint.textContent = collectingHint;
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function reveal() {
    phase = "revealed";
    countdown.textContent = "";
    const ids = [...pointers.keys()];
    if (ids.length < minFingers) {
      reset();
      return;
    }
    // Round-robin over a shuffled order keeps team sizes as even as possible.
    shuffle(ids).forEach((id, i) => {
      const teamIndex = i % teamCount;
      const color = teamColor(teamIndex);
      const { node } = pointers.get(id);
      node.style.borderColor = color;
      node.style.background = color;
      node.classList.add("assigned");
    });
    hint.style.display = "";
    hint.textContent = "Teams are set! Tap to shuffle again.";
  }

  function positionNode(node, x, y) {
    const rect = surface.getBoundingClientRect();
    node.style.left = `${x - rect.left}px`;
    node.style.top = `${y - rect.top}px`;
  }

  function onPointerDown(e) {
    if (e.target.closest(".random-topbar")) return;

    if (phase === "revealed") {
      reset();
      return;
    }
    if (phase !== "collecting") return;

    const node = el("div", { class: "finger" });
    positionNode(node, e.clientX, e.clientY);
    surface.append(node);
    pointers.set(e.pointerId, { node });
    surface.setPointerCapture(e.pointerId);
    hint.style.display = "none";
    maybeStartCountdown();
  }

  function onPointerMove(e) {
    const entry = pointers.get(e.pointerId);
    if (!entry) return;
    positionNode(entry.node, e.clientX, e.clientY);
  }

  function onPointerUp(e) {
    const entry = pointers.get(e.pointerId);
    if (!entry) return;

    if (surface.hasPointerCapture(e.pointerId)) {
      surface.releasePointerCapture(e.pointerId);
    }

    if (phase === "collecting") {
      entry.node.remove();
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        hint.style.display = "";
      }
      maybeStartCountdown();
      return;
    }

    if (phase === "countdown") {
      entry.node.remove();
      pointers.delete(e.pointerId);
      cancelCountdown();
      if (pointers.size > 0) {
        hint.style.display = "none";
      }
      maybeStartCountdown();
    }
    // During reveal, ignore lifts so the teams stay visible.
  }

  return {
    mount(container) {
      container.append(surface);
      surface.addEventListener("pointerdown", onPointerDown);
      surface.addEventListener("pointermove", onPointerMove);
      surface.addEventListener("pointerup", onPointerUp);
      surface.addEventListener("pointercancel", onPointerUp);
    },
    unmount() {
      clearTimers();
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
    },
  };
}
