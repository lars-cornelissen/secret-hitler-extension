// Auto-click the "END TERM" button in Secret Hitler Online
// (https://secret-hitler.online) when it becomes active.
//
// Based on the game source (ShrimpCryptid/Secret-Hitler-Online), the button is
// always rendered in the DOM with the literal text "END TERM", and is *active*
// exactly when its `disabled` attribute is false:
//
//   <button
//     disabled={
//       gameState.state !== "POST_LEGISLATIVE" ||
//       user !== gameState.president
//     }
//     onClick={() => sendWSCommand({ command: "end-term" })}
//   > END TERM </button>
(function () {
  // ---- Settings (synced via chrome.storage) ----
  let enabled = true;       // master toggle
  let delayMs = 2000;       // wait this long after the button activates before clicking

  function loadSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({ enabled: true, delayMs: 2000 }, (res) => {
          enabled = res.enabled !== false;
          const d = Number(res.delayMs);
          if (!Number.isNaN(d) && d >= 0) delayMs = d;
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }

  // ---- Button detection ----
  function isMatch(text) {
    // Normalize whitespace/newlines: React renders "END TERM" with leading/trailing spaces.
    const t = text.replace(/\s+/g, " ").trim().toUpperCase();
    return t === "END TERM" || t === "END TURN";
  }

  function findEndTermButton() {
    const candidates = document.querySelectorAll("button, [role='button']");
    for (const el of candidates) {
      const t = (el.innerText || el.textContent || "").trim();
      if (isMatch(t)) {
        return el;
      }
    }
    return null;
  }

  // ---- Single-shot click logic ----
  // We must click exactly ONCE per activation, after a delay. The button stays
  // enabled for a moment after a click (server hasn't acknowledged yet), so we
  // track when we last clicked and how long it's been active.
  let firstActiveAt = null; // timestamp when the button became active (or null when inactive)
  let clickTimer = null;

  function clearScheduledClick() {
    if (clickTimer !== null) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
  }

  function evaluate() {
    if (!enabled) return;

    const btn = findEndTermButton();

    if (!btn || btn.disabled) {
      // Button is inactive: reset state and cancel any pending click.
      firstActiveAt = null;
      clearScheduledClick();
      return;
    }

    // Button is active. Record when it first became active.
    const now = Date.now();
    if (firstActiveAt === null) {
      firstActiveAt = now;
      // Schedule a single click for the full delay from this moment.
      clearScheduledClick();
      clickTimer = setTimeout(() => {
        clickTimer = null;
        const waited = Date.now() - firstActiveAt;
        console.log("[AutoEndTerm] clicking after", waited, "ms (delay =", delayMs + ")");
        if (enabled && !btn.disabled && document.contains(btn)) {
          btn.click();
        }
      }, delayMs);
    }
    // While still active (firstActiveAt !== null), do nothing further — this
    // guarantees exactly one click per activation, spaced by the full delay.
  }

  // React updates the `disabled` attribute when the game state changes; watch
  // for those changes and re-evaluate.
  function start() {
    console.log("[AutoEndTerm] started. enabled =", enabled, "delayMs =", delayMs);

    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return;
        if (changes.enabled) enabled = changes.enabled.newValue !== false;
        if (changes.delayMs) {
          const d = Number(changes.delayMs.newValue);
          if (!Number.isNaN(d) && d >= 0) delayMs = d;
        }
        evaluate();
      });
    } catch (e) {
      /* ignore */
    }

    const observer = new MutationObserver(() => {
      window.setTimeout(evaluate, 0);
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "disabled"],
    });

    evaluate();
    window.setInterval(evaluate, 500);
  }

  // Await settings BEFORE starting, so we never click at the default delay.
  loadSettings().then(start);
})();