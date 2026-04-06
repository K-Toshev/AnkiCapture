// ============================================================
// src/export.js — CSV export
// ============================================================
// Handles reading all saved cards and downloading them as CSV
// files that Anki can import directly.
//
// WHY TWO FILES?
// Anki's import system is tied to "note types". Front/Back cards
// use the "Basic" note type; Cloze cards use the "Cloze" note type.
// Anki can only import one note type per session, so we must export
// them separately.
//
// DEPENDS ON: state.js (indirectly, via chrome.storage)
//             ui.js (calls showToast)
// CALLED BY:  ui.js (attachListeners wires btn-export → exportDeck)
// LOAD ORDER: After ui.js

// ── exportDeck() ──────────────────────────────────────────────
// Entry point. Reads all cards from storage, splits them by type,
// and triggers a download for each non-empty group.
function exportDeck() {
  chrome.storage.local.get(["ankiCards"], (result) => {
    const cards = result.ankiCards || [];
    if (cards.length === 0) return;

    // Split cards into their two groups
    const frontBackCards = cards.filter(c => c.type === "frontback" || !c.type);
    const clozeCards     = cards.filter(c => c.type === "cloze");

    let exported = 0;

    if (frontBackCards.length > 0) {
      // ── Basic (Front/Back) CSV format ────────────────────────
      // Anki's Basic note type expects two columns: Front, Back.
      // csvCell() wraps each value in quotes so internal commas
      // don't break the CSV structure.
      const rows = frontBackCards.map(c =>
        `${csvCell(c.front)},${csvCell(c.back)}`
      );
      downloadCSV(rows.join("\n"), `anki_frontback_${Date.now()}.csv`);
      exported++;
    }

    if (clozeCards.length > 0) {
      // ── Cloze CSV format ─────────────────────────────────────
      // Anki's Cloze note type expects one main column (Text)
      // containing the {{c1::word}} syntax, plus an optional
      // second column (Back Extra) which we leave blank.
      const rows = clozeCards.map(c =>
        `${csvCell(c.cloze)},`
      );
      downloadCSV(rows.join("\n"), `anki_cloze_${Date.now()}.csv`);
      exported++;
    }

    const msg = exported === 2
      ? `Exported 2 files (${frontBackCards.length} basic, ${clozeCards.length} cloze)`
      : `Exported ${cards.length} card${cards.length !== 1 ? "s" : ""}!`;

    showToast(msg);
  });
}

// ── csvCell(value) ────────────────────────────────────────────
// Wraps a single value in CSV double-quotes and escapes any
// double-quote characters inside the value by doubling them.
// This is the standard RFC 4180 CSV escaping rule.
// e.g.  He said "hello"  →  "He said ""hello"""
function csvCell(value) {
  const str = String(value || "").replace(/"/g, '""');
  return `"${str}"`;
}

// ── downloadCSV(content, filename) ───────────────────────────
// Creates an in-memory Blob (a file-like object) from a string,
// generates a temporary URL for it, then clicks a hidden <a> tag
// to trigger the browser's native file download.
// The URL is immediately revoked after use to free memory.
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  // Revoke the URL on the next tick, after the download has started
  URL.revokeObjectURL(url);
}