// ==============================
// INLINE SVG ICONS (mengganti Font Awesome)
// ==============================
const ICONS = {
  "fa-wallet": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 7H3a1 1 0 0 0-1 1v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-1 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM3 5h15l-1.5-1.5A2 2 0 0 0 15.09 3H5a2 2 0 0 0-2 2z"/></svg>`,
  "fa-cog": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm7.94-3c0-.32-.03-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54A.5.5 0 0 0 14.62 3h-3.84a.5.5 0 0 0-.5.43l-.36 2.54a7 7 0 0 0-1.62.94L5.9 6.35a.5.5 0 0 0-.61.22L3.37 9.89a.5.5 0 0 0 .12.63L5.52 12c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96a7 7 0 0 0 1.62.94l.36 2.54c.07.25.3.43.5.43h3.84a.5.5 0 0 0 .5-.43l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.63l-2.03-1.58c.04-.31.07-.63.07-.94z"/></svg>`,
  "fa-piggy-bank": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19.07 9.4a7.97 7.97 0 0 0-5.07-3.26V5h1a1 1 0 0 0 0-2h-3a1 1 0 0 0 0 2h.07A8 8 0 0 0 4 13c0 1.68.52 3.24 1.41 4.53L4 20h3l.8-1.6A7.97 7.97 0 0 0 12 19a8 8 0 0 0 4.42-1.33L18 19h3l-1.41-2.47A7.96 7.96 0 0 0 21 13a8 8 0 0 0-.5-2.73A2 2 0 0 0 22 8a2 2 0 0 0-2.93-1.6zM15 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>`,
  "fa-shopping-cart": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2h2.27l.94 2M5 14h14l1.68-6.39A1 1 0 0 0 19.72 6H5.21L4.27 4H1"/></svg>`,
  "fa-utensils": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`,
  "fa-graduation-cap": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-5 9.18V16l5 2.72L17 16v-3.82l-5 2.72-5-2.72z"/></svg>`,
  "fa-heartbeat": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402"/></svg>`,
  "fa-bus": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78A2.99 2.99 0 0 0 20 16V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM6 6h12v4H6V6z"/></svg>`,
  "fa-home": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  "fa-gamepad": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15 7.5h-2v2h-2v2h2v2h2v-2h2v-2h-2V7.5zM7.5 11H9v2h1.5v-2H12V9.5h-1.5v-2H9v2H7.5V11zM21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91z"/></svg>`,
  "fa-gift": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12v10H4V12H2v-2l2-4h16l2 4v2h-2zm-8-8a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2zM8 6a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2zm4 6H4v8h8v-8zm8 0h-8v8h8v-8zM3 8l-1 2h20l-1-2H3z"/></svg>`,
  "fa-layer-group": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  "fa-plus": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  "fa-plus-circle": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`,
  "fa-edit": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  "fa-trash-alt": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  "fa-times": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  "fa-times-circle": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
  "fa-search": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  "fa-calendar-alt": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 18H4V8h16v13z"/></svg>`,
  "fa-chevron-down": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>`,
  "fa-chevron-right": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
  "fa-folder-open": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/></svg>`,
  "fa-folder": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
  "fa-file-download": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
  "fa-file-upload": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>`,
  "fa-exclamation-triangle": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
  "fa-exclamation": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
  "fa-check": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
  "fa-info": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  "fa-arrow-down": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>`,
  "fa-arrow-up": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>`,
  "fa-ellipsis-v": `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
};

function icon(name, extraClass = "") {
  const svg = ICONS[name] || ICONS["fa-folder"];
  // Inject extra class into SVG tag
  if (extraClass) {
    return svg.replace('class="icon"', `class="icon ${extraClass}"`);
  }
  return svg;
}

// ── Ikon tambahan untuk pocket picker ──
ICONS["fa-car"]      = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
ICONS["fa-coffee"]   = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>`;
ICONS["fa-music"]    = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
ICONS["fa-book"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`;
ICONS["fa-dumbbell"] = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>`;
ICONS["fa-plane"]    = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
ICONS["fa-baby"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 11.5c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm5 12.78c-1.5.89-3.22 1.42-5 1.42-1.78 0-3.5-.53-5-1.42v-.28c0-1.66 3.34-2.5 5-2.5s5 .84 5 2.5v.28z"/></svg>`;
ICONS["fa-laptop"]   = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`;
ICONS["fa-mobile"]   = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`;
ICONS["fa-store"]    = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4v2l16 .01V4zM4 20h16v-6H4v6zm16-8H4V4H2v18h2v-2h16v2h2V4h-2v8z"/></svg>`;
ICONS["fa-medkit"]   = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.5C18 2.69 16.31 1 14.5 1S11 2.5 11 4v.5C9.2 4.5 8 5.56 8 7H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5.5 8H13v1.5h-2V14H9.5v-2H11v-1.5h2V12h1.5v2zm-2-9.5c0-1.1.9-2 2-2s2 .9 2 2V6h-4V4.5z"/></svg>`;
ICONS["fa-bolt"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;
ICONS["fa-star"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
ICONS["fa-fire"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>`;
ICONS["fa-leaf"]     = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-13 5-2 1.06-3.36 2.86-4 4.57L7 11c.5-1.87 1.84-3.23 3.22-4.25.89-.66 3.85-1.65 6.78-2z"/></svg>`;
ICONS["fa-gem"]      = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 2.1L11 2l-4.5.1L2 8l2.5 4.5L9 20h6l4.5-7.5L22 8l-6.5-5.9z"/></svg>`;
