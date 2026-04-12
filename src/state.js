// ============================================================
// src/state.js — Shared application state
// ============================================================
// This is the single source of truth for all mutable state.
// Every other module reads from and writes to these variables.
//
// WHY A SEPARATE STATE FILE?
// Without this, each module would need to pass data back and
// forth through function arguments, or worse, each module would
// define its own copy of a variable. A central state file means
// every module is always looking at the same data.
//
// LOAD ORDER: Must be the FIRST script loaded (see manifest.json),
// because all other modules depend on these variables existing.

// ── Selection state ───────────────────────────────────────────
// These are set by tooltip.js when the user highlights text,
// and read by ui.js (to render previews) and cards.js (to save).
let selectedSentence = "";   // the full sentence highlighted by the user
let selectedTerm     = "";   // the specific word/phrase (card front or cloze gap)

// ── Card mode ─────────────────────────────────────────────────
// "frontback" | "cloze"
// Set by ui.js when the user clicks a mode tab.
// Read by tooltip.js (to show correct tooltip buttons)
// and ui.js (to render the correct stage area).
let cardMode = "frontback";

// ── Shadow DOM reference ──────────────────────────────────────
// Set once by sidebar.js during injection.
// Every other module uses this to reach inside the Shadow DOM
// with shadow.getElementById() instead of document.getElementById().
// (Regular document.getElementById won't find elements inside a shadow root.)
let shadow = null;

// Sidebar width — mutable so the drag handle can resize it
let sidebarWidth = 300;

// ── AI tools reference ────────────────────────────────────────
// Contains all useful info for frontai functionality
let cachedPrompt = "";
let geminiKey = "";