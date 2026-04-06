// ============================================================
// content.js — Entry point
// ============================================================
// This file is now intentionally minimal. Its only job is to
// wait for the DOM to be ready, then kick off the sidebar injection.
//
// All the real logic has been split into focused modules in src/:
//
//   src/state.js    — Shared state variables (loaded first)
//   src/sidebar.js  — Shadow DOM injection, HTML template, CSS
//   src/cards.js    — Save and delete cards in chrome.storage
//   src/ui.js       — Render the stage, card list, toasts, mode tabs
//   src/export.js   — CSV export and file download
//   src/tooltip.js  — Text selection listener and floating tooltip
//
// Chrome loads all scripts listed in manifest.json before this
// file runs, so all the functions defined in those modules are
// already available here as globals.

if (document.readyState === "loading") {
  // Page is still parsing — wait for the HTML to be fully built
  // before we try to append our sidebar to it
  document.addEventListener("DOMContentLoaded", boot);
} else {
  // Page is already loaded (e.g. extension reloaded mid-session)
  boot();
}

function boot() {
  injectSidebar();   // defined in src/sidebar.js — builds the Shadow DOM panel
  attachListeners(); // defined in src/ui.js      — wires up all button handlers
  refreshCardList(); // defined in src/ui.js      — loads saved cards from storage
}