// ============================================================
// src/sidebar.js — Sidebar injection, HTML, and CSS
// ============================================================
// Responsible for physically building the sidebar and attaching
// it to the page. Once this runs, the skeleton exists in the DOM
// and other modules can find elements inside it via `shadow`.
//
// DEPENDS ON: state.js (reads SIDEBAR_WIDTH, writes `shadow`)
// CALLED BY:  content.js entry point
// LOAD ORDER: After state.js, before all other modules

// ── Constants ─────────────────────────────────────────────────
const SIDEBAR_ID = "anki-host";
// sidebarWidth lives in state.js so drag logic can update it globally

// ── injectSidebar() ───────────────────────────────────────────
// Creates the host element, attaches a Shadow DOM to it,
// injects the HTML + CSS, and pushes the page content left.
// Safe to call multiple times — the guard at the top prevents
// double-injection if the script runs again on the same page.
function injectSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;

  const host = document.createElement("div");
  host.id = SIDEBAR_ID;
  host.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: ${sidebarWidth}px !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    pointer-events: auto !important;
    box-sizing: border-box !important;
  `;

  document.documentElement.appendChild(host);
  shadow = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = SIDEBAR_CSS;
  shadow.appendChild(styleEl);

  const panel = document.createElement("div");
  panel.id = "panel";
  panel.innerHTML = SIDEBAR_HTML;
  shadow.appendChild(panel);

  document.documentElement.style.setProperty(
    "margin-right", sidebarWidth + "px", "important"
  );

  initDrag(host);
}

// ── SIDEBAR_HTML ──────────────────────────────────────────────
// The structural skeleton of the sidebar.
// Note that #stage is intentionally empty — its contents are
// rendered dynamically by ui.js (updateStageUI()), because they
// change depending on the active card mode.
const SIDEBAR_HTML = `
  <div id="drag-handle" title="Drag to resize"></div>
  <div id="header">
    <div id="logo">🃏 ANKI CREATOR</div>
    <div id="count-badge">0</div>
  </div>

  <div id="mode-bar">
    <button id="mode-frontback" class="mode-btn active">Front / Back</button>
    <button id="mode-cloze"     class="mode-btn">Cloze</button>
  </div>

  <div id="stage"></div>

  <div id="deck-header">DECK</div>
  <div id="card-list"></div>

  <div id="footer">
    <button id="btn-export" class="btn export" disabled>↓ CSV</button>
    <button id="btn-clear"  class="btn danger"  disabled>Clear</button>
  </div>

  <div id="toast"></div>
`;

// ── SIDEBAR_CSS ───────────────────────────────────────────────
// All styles for the sidebar. Lives inside Shadow DOM so it
// cannot conflict with the host page's CSS in either direction.
const SIDEBAR_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* CSS variables — change these to retheme the entire sidebar */
  :host {
    --bg:      #0e0e1c;
    --surface: #181828;
    --border:  #2a2a45;
    --accent:  #5c5cff;
    --green:   #00e89a;
    --red:     #ff4a6e;
    --purple:  #8b5cf6;
    --text:    #ddddf5;
    --muted:   #7777aa;
    --font:    'Courier New', 'Consolas', monospace;
    --r:       7px;
  }

  /* ── Drag handle ──────────────────────────────────── */
  #drag-handle {
    position: absolute;
    left: 0; top: 0;
    width: 5px; height: 100%;
    cursor: ew-resize;
    z-index: 10;
    background: transparent;
    transition: background 0.15s;
  }
  #drag-handle:hover { background: var(--accent); opacity: 0.5; }

  /* ── Panel shell ──────────────────────────────────── */
  #panel {
    width: 100%; height: 100vh;
    background: var(--bg); color: var(--text);
    font-family: var(--font); font-size: 12px;
    display: flex; flex-direction: column;
    border-left: 1px solid var(--border);
    overflow: hidden; position: relative;
  }

  /* ── Header ───────────────────────────────────────── */
  #header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  #logo { font-size: 13px; font-weight: bold; color: var(--green); letter-spacing: 0.08em; }
  #count-badge {
    background: var(--accent); color: #fff;
    border-radius: 999px; padding: 2px 9px; font-size: 11px;
    min-width: 24px; text-align: center;
  }

  /* ── Mode switcher tabs ───────────────────────────── */
  #mode-bar {
    display: flex;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .mode-btn {
    flex: 1; padding: 8px 6px;
    background: var(--bg); color: var(--muted);
    border: none; border-right: 1px solid var(--border);
    font-family: var(--font); font-size: 10px;
    font-weight: bold; letter-spacing: 0.08em;
    cursor: pointer; transition: color 0.15s, background 0.15s;
  }
  .mode-btn:last-child { border-right: none; }
  .mode-btn:hover { color: var(--text); background: var(--surface); }
  .mode-btn.active { color: #fff; background: var(--surface); }

  /* Active tab accent line changes colour per mode.
     ui.js sets a class ("mode-frontback" or "mode-cloze") on #panel. */
  #panel.mode-frontback #mode-frontback.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
  #panel.mode-cloze     #mode-cloze.active     { color: var(--purple); border-bottom: 2px solid var(--purple); }

  /* ── Stage area (selection previews) ─────────────── */
  #stage {
    padding: 12px 14px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .stage-label { font-size: 10px; letter-spacing: 0.12em; margin-bottom: 5px; }
  #panel.mode-frontback .stage-label { color: var(--accent); }
  #panel.mode-cloze     .stage-label { color: var(--purple); }

  .hint { color: var(--muted); font-size: 9px; letter-spacing: 0; }
  .stage-box {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--r); padding: 7px 10px;
    min-height: 34px; font-size: 12px; line-height: 1.4;
    word-break: break-word; transition: border-color 0.15s;
  }
  .stage-box.has-content { color: var(--text); }
  #panel.mode-frontback .stage-box.has-content { border-color: var(--accent); }
  #panel.mode-cloze     .stage-box.has-content { border-color: var(--purple); }
  .stage-box.empty { color: var(--muted); font-style: italic; }
  .cloze-highlight { background: var(--purple); color: #fff; border-radius: 3px; padding: 0 3px; }
  .stage-spacer { margin-top: 10px; }
  #stage-actions { display: flex; gap: 8px; margin-top: 10px; }

  /* ── Deck section header ──────────────────────────── */
  #deck-header {
    padding: 7px 14px; font-size: 10px; letter-spacing: 0.12em;
    color: var(--muted); border-bottom: 1px solid var(--border); flex-shrink: 0;
  }

  /* ── Card list ────────────────────────────────────── */
  #card-list {
    flex: 1; overflow-y: auto; padding: 10px;
    display: flex; flex-direction: column; gap: 7px;
  }
  #card-list::-webkit-scrollbar       { width: 3px; }
  #card-list::-webkit-scrollbar-track { background: var(--bg); }
  #card-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── Individual card ──────────────────────────────── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); padding: 9px 11px;
    position: relative; transition: border-color 0.15s;
  }
  .card:hover { border-color: var(--accent); }
  .card.type-cloze:hover { border-color: var(--purple); }
  .card-type-badge {
    display: inline-block; font-size: 9px; letter-spacing: 0.1em;
    border-radius: 3px; padding: 1px 5px; margin-bottom: 6px;
  }
  .badge-frontback { background: #1a1a3a; color: var(--accent); }
  .badge-cloze     { background: #1e1030; color: var(--purple); }
  .card-label { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 3px; }
  .card-text  { font-size: 12px; line-height: 1.4; word-break: break-word; padding-right: 18px; }
  .card-sep   { border: none; border-top: 1px solid var(--border); margin: 6px 0; }
  .card-del {
    position: absolute; top: 7px; right: 7px;
    background: none; border: none; color: var(--muted);
    cursor: pointer; font-size: 13px; padding: 1px 4px;
    border-radius: 4px; line-height: 1;
    transition: color 0.12s, background 0.12s; font-family: var(--font);
  }
  .card-del:hover { color: var(--red); background: #2a1520; }

  /* ── Empty state ──────────────────────────────────── */
  .empty-state { text-align: center; padding: 30px 16px; color: var(--muted); line-height: 1.8; }
  .empty-state .icon { font-size: 26px; margin-bottom: 8px; }

  /* ── Footer ───────────────────────────────────────── */
  #footer {
    display: flex; gap: 7px; padding: 10px 12px;
    border-top: 1px solid var(--border); flex-shrink: 0;
  }

  /* ── Buttons ──────────────────────────────────────── */
  .btn {
    flex: 1; padding: 8px 10px; border: none; border-radius: var(--r);
    cursor: pointer; font-family: var(--font);
    font-size: 11px; font-weight: bold; letter-spacing: 0.05em;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn:hover:not(:disabled)  { opacity: 0.82; }
  .btn:active:not(:disabled) { transform: scale(0.96); }
  .btn:disabled              { opacity: 0.3; cursor: not-allowed; }
  .btn.primary { background: var(--accent); color: #fff; }
  .btn.ghost   { background: var(--bg); color: var(--muted); border: 1px solid var(--border); }
  .btn.export  { background: var(--green); color: #0a0a14; }
  .btn.danger  { background: var(--bg); color: var(--red); border: 1px solid var(--red); }
  .btn.purple  { background: var(--purple); color: #fff; }

  /* ── Toast notification ───────────────────────────── */
  #toast {
    position: absolute; bottom: 58px; left: 50%;
    transform: translateX(-50%);
    background: var(--surface); border: 1px solid var(--green);
    color: var(--green); padding: 6px 14px;
    border-radius: 999px; font-size: 11px;
    white-space: nowrap; opacity: 0;
    pointer-events: none; transition: opacity 0.2s; z-index: 10;
  }
  #toast.show { opacity: 1; }
`;

// ── initDrag(host) ────────────────────────────────────────────
// Attaches mousedown to the drag handle. On drag, calculates the
// new width from the cursor's distance from the right edge of the
// viewport, then updates the host element and page margin live.
function initDrag(host) {
  const handle = shadow.getElementById("drag-handle");
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault(); // prevent text selection during drag

    // Disable pointer events on the page iframe/content during drag
    // so mousemove fires reliably even over embedded frames
    document.body.style.userSelect = "none";

    function onMove(e) {
      // New width = right edge of viewport minus cursor x position
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      sidebarWidth = newWidth;
      host.style.setProperty("width", newWidth + "px", "important");
      document.documentElement.style.setProperty("margin-right", newWidth + "px", "important");
    }

    function onUp() {
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}