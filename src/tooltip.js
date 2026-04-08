// ============================================================
// src/tooltip.js — Text selection and floating tooltip
// ============================================================
// Watches for the user highlighting text on the page, shows a
// context-aware tooltip near their cursor, and updates state
// when they click a tooltip button.
//
// WHY MOUSEDOWN INSTEAD OF CLICK?
// Browser event order: mousedown → mouseup → click.
// Our dismiss handler fires on mousedown. If tooltip buttons used
// "click", they'd be destroyed before "click" could fire.
// Using "mousedown" + e.stopPropagation() means the button action
// runs at the same moment as the dismiss handler, and
// stopPropagation() prevents the dismiss from firing.
//
// DEPENDS ON: state.js (reads cardMode, SIDEBAR_ID; writes selectedSentence/Term)
//             ui.js    (calls updateStageUI, showToast)
//             cards.js (calls saveCard for Quick Add)
// LOAD ORDER: Last — after all other modules are loaded

// Track the currently visible tooltip element
let tooltip = null;

// ── Listen for text selection (mouseup = end of a drag-select) ─
document.addEventListener("mouseup", (e) => {
  // Ignore events that originate inside our sidebar —
  // the user might be clicking buttons or selecting text in the card list
  const host = document.getElementById(SIDEBAR_ID);
  if (host && host.contains(e.target)) return;

  const text = window.getSelection().toString().trim();
  if (!text) {
    removeTooltip();
    return;
  }

  showTooltip(e.clientX, e.clientY, text);
});

// ── Dismiss tooltip on any click outside it ───────────────────
document.addEventListener("mousedown", (e) => {
  if (tooltip && !tooltip.contains(e.target)) removeTooltip();
});

// ── showTooltip(x, y, text) ───────────────────────────────────
// Builds and positions the floating tooltip near the cursor.
// The buttons shown depend on the current cardMode.
function showTooltip(x, y, text) {
  removeTooltip(); // always start clean

  tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position: fixed;
    top: ${Math.min(y + 14, window.innerHeight - 80)}px;
    left: ${Math.min(x, window.innerWidth - sidebarWidth - 230)}px;
    z-index: 2147483646;
    background: #0e0e1c; color: #ddddf5;
    border: 1px solid #5c5cff; border-radius: 8px;
    padding: 7px 10px;
    font-family: 'Courier New', monospace; font-size: 12px;
    box-shadow: 0 4px 20px rgba(92,92,255,0.35);
    display: flex; gap: 6px; align-items: center;
    pointer-events: auto; user-select: none;
  `;

  // ── makeBtn(label, bg, onClick) ─────────────────────────────
  // Helper that creates a styled button using mousedown (not click)
  // so actions fire before the dismiss handler can remove the tooltip.
  const makeBtn = (label, bg, onClick) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = `
      background: ${bg}; color: #fff; border: none; border-radius: 5px;
      padding: 5px 9px; cursor: pointer; font-family: 'Courier New', monospace;
      font-size: 11px; font-weight: bold; white-space: nowrap;
    `;
    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // prevent the document mousedown dismiss handler
      onClick();
      removeTooltip();
    });
    return btn;
  };

  // ── Buttons vary by mode ─────────────────────────────────────

  if (cardMode === "frontback") {
    // Front/Back: set the sentence (card back) or the term (card front)
    tooltip.appendChild(makeBtn("Set Front", "#5c5cff", () => {
      selectedTerm = text;
      updateStageUI();
      showToast("Front set ✓");
    }));
    tooltip.appendChild(makeBtn("Set Back", "#5c5cff", () => {
      selectedSentence = text;
      updateStageUI();
      showToast("Back set ✓");
    }));
  } else if (cardMode === "cloze") {
    // Cloze: set the sentence (full text) or the gap word (hidden word)
    tooltip.appendChild(makeBtn("Set Sentence", "#8b5cf6", () => {
      selectedSentence = text;
      updateStageUI();
      showToast("Sentence set ✓");
    }));
    tooltip.appendChild(makeBtn("Set Gap Term", "#8b5cf6", () => {
      selectedTerm = text;
      updateStageUI();
      showToast("Gap term set ✓");
    }));
  } else if (cardMode === "frontai") {
      tooltip.appendChild(makeBtn("Set Front", "#ff8800", () => {
        selectedTerm = text;
        updateStageUI();
        showToast("Front set ✓");
      }))
  }

  document.body.appendChild(tooltip);
}

// ── removeTooltip() ───────────────────────────────────────────
// Removes the tooltip from the DOM and clears the reference.
function removeTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}