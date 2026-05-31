/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/XPBar.js
 * Szerep: XP-sav megjeleniteset es frissiteset kezelo jatekbeli UI-elem.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
/**
 * Az XPBar egy kozepre igazított HUD-elem, amely a DebugPanel ala ul be.
 * A stilusa szandekosan ugyanazt a "fedelzeti muszerfal" hangulatot koveti, mint a debug panel.
 */
export default class XPBar {
  constructor() {
    // Kulso wrapper: ez pozicionalja a teljes XP savat fixen a kepernyon.
    const wrap = document.createElement("div");
    wrap.style.cssText = [
      "position:fixed",
      "top:calc(4.5vmin + 4px)",   // just below the DebugPanel row
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:900",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "gap:0",
      "pointer-events:none",
      "font-family:'Jersey','Courier New',monospace",
      "font-smooth:never",
      "-webkit-font-smoothing:none",
    ].join(";");

    // Belso panel: ugyanazt a keretes, sotet stilust kapja, mint a DebugPanel cellai.
    const panel = document.createElement("div");
    panel.style.cssText = [
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "padding:0.3vmin 1.4vmin 0.5vmin",
      "background:rgba(6,8,20,0.82)",
      "border-right:2px solid #1e3a5f",
      "border-bottom:2px solid #1e3a5f",
      "border-left:2px solid #0a1628",
      "border-top:none",
      "gap:0.25vmin",
    ].join(";");

    // Fejlec sor: bal oldalt az XP cimke, jobb oldalt az aktualis szint.
    const header = document.createElement("div");
    header.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "width:100%",
      "gap:1.5vmin",
    ].join(";");

    const label = document.createElement("span");
    label.textContent = "XP";
    label.style.cssText = [
      "font-size:1.7vmin",
      "color:#4a7fb5",
      "letter-spacing:0.12em",
      "text-shadow:0 0 4px #0d2a50",
      "white-space:nowrap",
      "line-height:1.4",
    ].join(";");

    this._levelEl = document.createElement("span");
    this._levelEl.textContent = "LVL 1";
    this._levelEl.style.cssText = [
      "font-size:1.7vmin",
      "color:#6ab8ff",
      "letter-spacing:0.10em",
      "text-shadow:0 0 6px rgba(100,180,255,0.55),1px 1px 0 #000",
      "white-space:nowrap",
      "line-height:1.4",
    ].join(";");

    header.appendChild(label);
    header.appendChild(this._levelEl);

    // A track a teljes XP sav hattere, ezen belul no majd a fill szelessege.
    const track = document.createElement("div");
    track.style.cssText = [
      "width:34vmin",
      "height:1.4vmin",
      "background:rgba(10,22,40,0.9)",
      "border:1px solid #1e3a5f",
      "box-shadow:inset 0 1px 3px rgba(0,0,0,0.7),0 0 0 1px #0a1628",
      "position:relative",
      "overflow:hidden",
    ].join(";");

    this._fill = document.createElement("div");
    this._fill.style.cssText = [
      "height:100%",
      "width:0%",
      "background:linear-gradient(90deg,#2a5a9e 0%,#4a90e2 60%,#6ab8ff 100%)",
      "box-shadow:0 0 6px rgba(106,184,255,0.6)",
      "transition:width 0.35s cubic-bezier(0.25,0.8,0.25,1)",
    ].join(";");

    track.appendChild(this._fill);

    // Az aktualis es maximum XP ertek szovegesen is megjelenik a sav alatt.
    this._numEl = document.createElement("div");
    this._numEl.textContent = "0 / 100";
    this._numEl.style.cssText = [
      "font-size:1.55vmin",
      "color:#c8e6ff",
      "text-shadow:0 0 6px rgba(100,180,255,0.55),1px 1px 0 #000",
      "white-space:nowrap",
      "line-height:1.2",
      "letter-spacing:0.08em",
    ].join(";");

    panel.appendChild(header);
    panel.appendChild(track);
    panel.appendChild(this._numEl);
    wrap.appendChild(panel);

    this.container = wrap;
    this._currentXP = 0;
    this._maxXP = 100;
  }

  // Az aktualis XP ertekekbol ujraszamolja a sav toltottseget es a kijelzett szoveget.
  set(current, max) {
    this._currentXP = current;
    this._maxXP = max;
    const pct = max > 0 ? Math.min(current / max, 1) * 100 : 0;
    this._fill.style.width = `${pct}%`;
    this._numEl.textContent = `${current} / ${max}`;
  }

  // Kulon frissitheto a szintfelirat, mert a szint es az XP nem feltetlenul egyszerre valtozik.
  setLevel(level) {
    this._levelEl.textContent = `LVL ${level}`;
  }
}
