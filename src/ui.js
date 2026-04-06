// ============================================================
// src/ui.js — All DOM rendering and UI updates
// ============================================================
// This is the "view" layer. It reads from state.js and writes
// to the Shadow DOM. No data is saved here — ui.js only draws.
//
// DEPENDS ON: state.js (reads cardMode, selectedSentence, selectedTerm, shadow)
//             cards.js (calls saveCard, deleteCard, escapeHtml)
// CALLED BY:  sidebar.js (attachListeners), cards.js (after save/delete)
//             tooltip.js (after selections change)
// LOAD ORDER: After state.js, sidebar.js, and cards.js

// ── setMode(mode) ─────────────────────────────────────────────
// Switches the active card mode and re-renders the stage area.
// Called when the user clicks a mode tab in the mode bar.
function setMode(mode) {
  cardMode = mode;

  // Reset any in-progress selections when switching modes
  selectedSentence = "";
  selectedTerm = "";

  // Swap the "active" class between the two mode tab buttons
  shadow.getElementById("mode-frontback").classList.toggle("active", mode === "frontback");
  shadow.getElementById("mode-cloze").classList.toggle("active", mode === "cloze");

  // Add a mode class to #panel so CSS can change colors per mode
  // (The CSS uses "#panel.mode-frontback .stage-label" selectors)
  shadow.getElementById("panel").className = `mode-${mode}`;

  updateStageUI();
}

// ── updateStageUI() ───────────────────────────────────────────
// Re-renders the #stage area to reflect the current mode and
// current selection state. Called whenever:
//   - The user sets a sentence or term (via tooltip.js)
//   - The mode changes (via setMode)
//   - A card is saved or the reset button is clicked
//
// We rebuild the innerHTML each time rather than patching individual
// elements, because the structure itself changes between modes.
function updateStageUI() {
  const stage = shadow.getElementById("stage");

  if (cardMode === "frontback") {
    // ── Front/Back stage ──────────────────────────────────────
    // Two preview boxes: one for the sentence (card back),
    // one for the term (card front).
    stage.innerHTML = `
      <div class="stage-label">
        SENTENCE <span class="hint">(context — goes on back)</span>
      </div>
      <div class="stage-box ${selectedSentence ? "has-content" : "empty"}">
        ${selectedSentence ? escapeHtml(selectedSentence) : "Nothing selected"}
      </div>

      <div class="stage-label stage-spacer">
        TERM <span class="hint">(what to study — goes on front)</span>
      </div>
      <div class="stage-box ${selectedTerm ? "has-content" : "empty"}">
        ${selectedTerm ? escapeHtml(selectedTerm) : "Nothing selected"}
      </div>

      <div id="stage-actions">
        <button id="btn-reset" class="btn ghost">↺ Reset</button>
        <button id="btn-add" class="btn primary"
          ${!selectedSentence && !selectedTerm ? "disabled" : ""}>
          Add Card ✚
        </button>
      </div>
    `;
  } else {
    // ── Cloze stage ───────────────────────────────────────────
    // Two boxes plus a live preview showing the final cloze string
    // with the gap word visually highlighted.
    const preview = buildClozePreview();
    stage.innerHTML = `
      <div class="stage-label">
        SENTENCE <span class="hint">(the full text)</span>
      </div>
      <div class="stage-box ${selectedSentence ? "has-content" : "empty"}">
        ${selectedSentence ? escapeHtml(selectedSentence) : "Nothing selected"}
      </div>

      <div class="stage-label stage-spacer">
        GAP WORD <span class="hint">(the word to hide)</span>
      </div>
      <div class="stage-box ${selectedTerm ? "has-content" : "empty"}">
        ${selectedTerm ? escapeHtml(selectedTerm) : "Nothing selected"}
      </div>

      ${preview ? `
        <div class="stage-label stage-spacer">PREVIEW</div>
        <div class="stage-box has-content">${preview}</div>
      ` : ""}

      <div id="stage-actions">
        <button id="btn-reset" class="btn ghost">↺ Reset</button>
        <button id="btn-add" class="btn purple"
          ${!selectedSentence || !selectedTerm ? "disabled" : ""}>
          Add Cloze ✚
        </button>
      </div>
    `;
  }

  // Re-attach listeners on the newly rendered buttons.
  // We have to do this after every innerHTML rebuild because the old
  // elements — and their event listeners — were destroyed.
  shadow.getElementById("btn-reset").addEventListener("click", () => {
    selectedSentence = "";
    selectedTerm = "";
    updateStageUI();
  });

  shadow.getElementById("btn-add").addEventListener("click", () => {
    if (cardMode === "frontback") {
      if (!selectedSentence && !selectedTerm) return;
      saveCard({
        id:        Date.now(),
        type:      "frontback",
        front:     selectedTerm || selectedSentence,
        back:      selectedSentence || selectedTerm,
        source:    window.location.href,
        createdAt: new Date().toISOString()
      });
    } else {
      if (!selectedSentence || !selectedTerm) return;
      saveCard({
        id:        Date.now(),
        type:      "cloze",
        // buildClozeString() inserts {{c1::word}} syntax (defined below)
        cloze:     buildClozeString(),
        source:    window.location.href,
        createdAt: new Date().toISOString()
      });
    }
  });
}

// ── buildClozeString() ────────────────────────────────────────
// Produces the Anki cloze notation string for export.
// Anki's Cloze note type expects {{c1::hidden_word}} in the text.
// e.g. "Je {{c1::mange}} une pomme" — "mange" is hidden on the card.
function buildClozeString() {
  if (!selectedSentence || !selectedTerm) return "";
  return selectedSentence.replace(selectedTerm, `{{c1::${selectedTerm}}}`);
}

// ── buildClozePreview() ───────────────────────────────────────
// Same as buildClozeString but returns HTML for the live preview,
// wrapping the gap word in a highlighted <span> instead of {{c1::}}.
function buildClozePreview() {
  if (!selectedSentence || !selectedTerm) return "";
  const escaped     = escapeHtml(selectedSentence);
  const escapedTerm = escapeHtml(selectedTerm);
  return escaped.replace(
    escapedTerm,
    `<span class="cloze-highlight">${escapedTerm}</span>`
  );
}

// ── refreshCardList() ─────────────────────────────────────────
// Loads all cards from chrome.storage and re-renders the card list.
// Also updates the count badge and enables/disables footer buttons.
// Called after every save, delete, or clear operation.
function refreshCardList() {
  chrome.storage.local.get(["ankiCards"], (result) => {
    const cards = result.ankiCards || [];

    // Update header count badge
    shadow.getElementById("count-badge").textContent = cards.length;

    // Enable/disable footer buttons based on whether cards exist
    shadow.getElementById("btn-export").disabled = cards.length === 0;
    shadow.getElementById("btn-clear").disabled  = cards.length === 0;

    const listEl = shadow.getElementById("card-list");

    if (cards.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <div>No cards yet.</div>
          <div>Highlight text to begin.</div>
        </div>`;
      return;
    }

    // Render cards newest-first by reversing a copy of the array.
    // We render different HTML depending on the card type.
    listEl.innerHTML = [...cards].reverse().map(card => {
      if (card.type === "cloze") {
        return `
          <div class="card type-cloze">
            <button class="card-del" data-id="${card.id}">✕</button>
            <span class="card-type-badge badge-cloze">CLOZE</span>
            <div class="card-label">TEXT</div>
            <div class="card-text">${escapeHtml(card.cloze)}</div>
          </div>`;
      } else {
        return `
          <div class="card">
            <button class="card-del" data-id="${card.id}">✕</button>
            <span class="card-type-badge badge-frontback">FRONT/BACK</span>
            <div class="card-label">FRONT</div>
            <div class="card-text">${escapeHtml(card.front)}</div>
            <hr class="card-sep" />
            <div class="card-label">BACK</div>
            <div class="card-text">${escapeHtml(card.back)}</div>
          </div>`;
      }
    }).join("");

    // Attach delete listeners after rendering.
    // data-id holds the card's numeric ID so deleteCard() knows what to remove.
    listEl.querySelectorAll(".card-del").forEach(btn => {
      btn.addEventListener("click", () => deleteCard(parseInt(btn.dataset.id)));
    });
  });
}

// ── attachListeners() ─────────────────────────────────────────
// Wires up the static buttons: mode tabs, export, and clear.
// Called once by content.js after injectSidebar() runs.
// (Stage buttons are re-attached inside updateStageUI() because
// they get destroyed and recreated whenever the stage rerenders.)
function attachListeners() {
  shadow.getElementById("mode-frontback").addEventListener("click", () => setMode("frontback"));
  shadow.getElementById("mode-cloze").addEventListener("click",     () => setMode("cloze"));

  shadow.getElementById("btn-export").addEventListener("click", exportDeck);

  shadow.getElementById("btn-clear").addEventListener("click", () => {
    if (!confirm("Delete all cards? This can't be undone.")) return;
    chrome.storage.local.set({ ankiCards: [] }, () => {
      refreshCardList();
      showToast("Deck cleared");
    });
  });

  // Render the initial stage UI (empty, default frontback mode)
  updateStageUI();
}

// ── showToast(msg) ────────────────────────────────────────────
// Displays a brief notification inside the sidebar.
// Used by all modules to give the user feedback after actions.
function showToast(msg) {
  const toast = shadow.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  // Auto-hide after 2 seconds
  setTimeout(() => toast.classList.remove("show"), 2000);
}