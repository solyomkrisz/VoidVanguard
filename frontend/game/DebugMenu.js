export default class DebugMenu {
  static SANITIZE_NAME(name) {
    return name.replace(/[^a-zA-Z0-9_$]/g, "_");
  }

  constructor(src = null) {
    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:absolute;z-index:1000;top:0;left:0;padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#fff;font-size:min(min(4vw,4vh), 24px);";
    document.body.appendChild(this.container);

    this.src = src;

    this.ogDisplayValue = this.container.style.display
      ? this.container.style.display
      : "block";

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
      throw new Error("DEBUG-setSource: You didn't specify a source!");
    }

    this.src = src;
  }

  addElement(name) {
    const a = document.createElement("div");
    a.style.cssText = "display:flex;gap:5px;";
    a.appendChild(document.createTextNode(`${name}:`));
    const b = document.createElement("div");
    a.appendChild(b);
    this.container.appendChild(a);

    this[DebugMenu.SANITIZE_NAME(name)] = b;
  }

  /**
   * When writing the function for the 'func' parameter its important to note that
   * that function will receive the debug menu's source as a parameter which is a Game instance.
   * Therefore you can work with that in you calculations.
   */
  bindSource(name, property, func = null) {
    if (typeof property !== "string") {
      throw new Error("DEBUGMENU-bindSource: The given data source is wrong!");
    }

    if (this.src[property] === undefined) {
      console.warn(
        `DEBUG-bindSource: Couldn't bind the property [${property}] from [${this.src}] to [${name}]!`
      );
    }

    const updateFunction = func
      ? function () {
          this[DebugMenu.SANITIZE_NAME(name)].textContent = this.src[property];
          func(this);
        }
      : function () {
          this[DebugMenu.SANITIZE_NAME(name)].textContent = this.src[property];
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
