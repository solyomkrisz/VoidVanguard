export default class DebugPanel {
  static SANITIZE_NAME(name) {
    return name.replace(/[^a-zA-Z0-9_$]/g, "_");
  }

  constructor(src = null) {
    this.container = document.createElement("div");
    this.container.style.cssText = [
      "position:fixed",
      "top:0",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:900",
      "display:flex",
      "flex-direction:row",
      "align-items:stretch",
      "pointer-events:none",
      "font-family:'Jersey','Courier New',monospace",
      "font-smooth:never",
      "-webkit-font-smoothing:none",
    ].join(";");
    document.body.appendChild(this.container);

    this.src = src;

    this.ogDisplayValue = "flex";

    this.updateInterval = 1000; // ms
    this.updateFunctions = new Array();
    this.intervalId = null;
  }

  show() {
    this.container.style.display = this.ogDisplayValue;
  }

  hide() {
    this.container.style.display = "none";
  }

  toggle() {
    if (this.container.style.display !== "none") {
      this.container.style.display = "none";
    } else this.container.style.display = this.ogDisplayValue;
  }

  setSource(src) {
    if (!src) {
      throw new Error("DEBUGPANEL-setSource: You didn't specify a source!");
    }

    this.src = src;
  }

  addElement(name, width = "7vmin") {
    const cell = document.createElement("div");
    cell.style.cssText = [
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "padding:0.3vmin 1.1vmin 0.5vmin",
      "background:rgba(6,8,20,0.82)",
      "border-right:2px solid #1e3a5f",
      "border-bottom:2px solid #1e3a5f",
      "border-left:2px solid #0a1628",
      `width:${width}`,
      "flex-shrink:0",
      "overflow:hidden",
      "gap:0",
    ].join(";");

    const label = document.createElement("div");
    label.textContent = name.toUpperCase();
    label.style.cssText = [
      "font-size:1vmin",
      "color:#4a7fb5",
      "letter-spacing:0.12em",
      "text-shadow:0 0 4px #0d2a50",
      "white-space:nowrap",
      "line-height:1.4",
    ].join(";");

    const value = document.createElement("div");
    value.style.cssText = [
      "font-size:1.55vmin",
      "color:#c8e6ff",
      "text-shadow:0 0 6px rgba(100,180,255,0.55),1px 1px 0 #000",
      "white-space:nowrap",
      "line-height:1.2",
    ].join(";");

    cell.appendChild(label);
    cell.appendChild(value);
    this.container.appendChild(cell);

    this[DebugPanel.SANITIZE_NAME(name)] = value;
  }

  /**
   * When writing the function for the 'func' parameter its important to note that
   * that function will receive the debug menu's source as a parameter which is a Game instance.
   * Therefore you can work with that in you calculations.
   */
  bindSource(name, property, func = null) {
    if (typeof property !== "string") {
      throw new Error("DEBUGPANEL-bindSource: The given data source is wrong!");
    }

    if (this.src[property] === undefined) {
      console.warn(
        `DEBUGPANEL-bindSource: Couldn't bind the property [${property}] from [${this.src}] to [${name}]!`
      );
    }

    const updateFunction = func
      ? function () {
          this[DebugPanel.SANITIZE_NAME(name)].textContent = this.src[property];
          func(this);
        }
      : function () {
          this[DebugPanel.SANITIZE_NAME(name)].textContent = this.src[property];
        };

    this.updateFunctions.push(updateFunction.bind(this));
  }

  /** Changes how often the debug menu data should update. */
  setUpdateInterval(interval) {
    this.updateInterval = interval; // ms
  }

  /** Starts updating all the update function the user has provided using the update interval. */
  startDebugUpdating() {
    this.intervalId = setInterval(() => {
      this.updateFunctions.forEach((fn) => fn());
    }, this.updateInterval);
  }

  /** Clears the interval responsible for running all user provided update functions. */
  stopDebugUpdating() {
    if (!this.intervalId) return;

    clearInterval(this.intervalId);
  }
}
