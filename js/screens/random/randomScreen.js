import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { COLORS } from "../../constants/colors.js";

const MIN_FINGERS = 2;
const HOLD_DELAY_MS = 1200; // steady fingers before countdown starts
const COUNTDOWN_SECONDS = 3;

/**
 * Random Player picker. Users press fingers on the screen; once at least
 * MIN_FINGERS are held steadily, a countdown runs and one finger is revealed
 * as the starting player.
 */
export function createRandomScreen() {
  /** @type {Map<number, {node: HTMLElement, colorIndex: number}>} */
  const pointers = new Map();
  let holdTimer = null;
  let countdownTimer = null;
  let phase = "collecting"; // collecting | countdown | revealed

  const hint = el("div", {
    class: "random-hint",
    text: "Everyone place a finger on the screen…",
  });
  const countdown = el("div", { class: "random-countdown" });

  const surface = el("section", { class: "screen random" }, [
    el("div", { class: "topbar random-topbar" }, [
      el("button", {
        class: "btn btn-ghost",
        text: "‹ Menu",
        on: { click: () => Router.go("menu") },
      }),
    ]),
    hint,
    countdown,
  ]);

  function colorFor(index) {
    return COLORS[index % COLORS.length].value;
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
    hint.textContent = "Everyone place a finger on the screen…";
    pointers.forEach(({ node }) => node.remove());
    pointers.clear();
  }

  function maybeStartCountdown() {
    if (phase !== "collecting") return;
    clearTimeout(holdTimer);
    holdTimer = null;
    if (pointers.size < MIN_FINGERS) return;

    holdTimer = setTimeout(() => startCountdown(), HOLD_DELAY_MS);
  }

  function startCountdown() {
    if (pointers.size < MIN_FINGERS) return;
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

  function reveal() {
    phase = "revealed";
    countdown.textContent = "";
    const ids = [...pointers.keys()];
    if (ids.length < MIN_FINGERS) {
      reset();
      return;
    }
    const winnerId = ids[Math.floor(Math.random() * ids.length)];
    pointers.forEach(({ node }, id) => {
      if (id === winnerId) node.classList.add("winner");
      else node.classList.add("loser");
    });
    hint.style.display = "";
    hint.textContent = "Start player! Tap to play again.";
  }

  function positionNode(node, x, y) {
    const rect = surface.getBoundingClientRect();
    node.style.left = `${x - rect.left}px`;
    node.style.top = `${y - rect.top}px`;
  }

  function onPointerDown(e) {
    if (phase === "revealed") {
      reset();
      return;
    }
    if (phase !== "collecting") return;

    const colorIndex = pointers.size;
    const node = el("div", {
      class: "finger",
      style: `border-color:${colorFor(colorIndex)};color:${colorFor(colorIndex)}`,
    });
    positionNode(node, e.clientX, e.clientY);
    surface.append(node);
    pointers.set(e.pointerId, { node, colorIndex });
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

    if (phase === "collecting") {
      entry.node.remove();
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        hint.style.display = "";
      }
      maybeStartCountdown();
    }
    // During countdown/reveal, ignore lifts so the winner stays visible.
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
