let wakeLockSentinel = null;
let hasTriedAfterGesture = false;

function canUseWakeLock() {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

async function requestWakeLock() {
  if (!canUseWakeLock() || document.visibilityState !== "visible") {
    return;
  }

  if (wakeLockSentinel && !wakeLockSentinel.released) {
    return;
  }

  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      wakeLockSentinel = null;
    });
  } catch {
    // Some browsers require a user gesture before requesting wake lock.
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    void requestWakeLock();
  }
}

function onFirstGesture() {
  if (hasTriedAfterGesture) {
    return;
  }

  hasTriedAfterGesture = true;
  void requestWakeLock();
}

export function enableWakeLock() {
  if (!canUseWakeLock()) {
    return;
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("click", onFirstGesture, { passive: true });
  document.addEventListener("touchstart", onFirstGesture, { passive: true });

  void requestWakeLock();
}
