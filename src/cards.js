// ============================================================
// src/cards.js — Card data operations
// ============================================================
// Handles reading and writing card data to chrome.storage.
// Nothing in this file touches the DOM directly — it only deals
// with data. UI updates are triggered by calling back into ui.js.
//
// DEPENDS ON: state.js (reads/resets selectedSentence, selectedTerm)
// USED BY:    ui.js (calls saveCard, deleteCard)
//             tooltip.js (calls saveCard for Quick Add)
// LOAD ORDER: After state.js, before ui.js

// ── saveCard(card) ────────────────────────────────────────────
// Appends a new card object to the stored array, then resets
// the staging selections and triggers a UI refresh.
//
// Card shape (frontback):  { id, type, front, back, source, createdAt }
// Card shape (cloze):      { id, type, cloze, source, createdAt }
function saveCard(card) {
  // chrome.storage.local.get() is async — we pass a callback.
  // It fetches the current array, adds our card, then saves it back.
  chrome.storage.local.get(["ankiCards"], (result) => {
    const cards = result.ankiCards || [];
    cards.push(card);

    chrome.storage.local.set({ ankiCards: cards }, () => {
      // Reset selection state after a successful save
      selectedSentence = "";
      selectedTerm = "";

      // Refresh both the stage preview and the card list
      // (these functions live in ui.js, loaded after this file)
      updateStageUI();
      refreshCardList();
      showToast("Card saved!");
    });
  });
}

// ── deleteCard(id) ────────────────────────────────────────────
// Removes the card with the given numeric ID from storage.
// IDs are timestamps (Date.now()) assigned at creation time.
function deleteCard(id) {
  chrome.storage.local.get(["ankiCards"], (result) => {
    // Array.filter() returns a new array without the matching card
    const cards = (result.ankiCards || []).filter(c => c.id !== id);

    chrome.storage.local.set({ ankiCards: cards }, () => {
      refreshCardList();
      showToast("Card deleted");
    });
  });
}

// ── escapeHtml(str) ───────────────────────────────────────────
// Converts special HTML characters to safe display entities.
// This prevents user-highlighted text from accidentally injecting
// HTML into our sidebar (a security issue called XSS).
// e.g. "<script>" becomes "&lt;script&gt;" and renders as text.
//
// Used by ui.js whenever card text is inserted into innerHTML.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}