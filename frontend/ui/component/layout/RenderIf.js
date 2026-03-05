import userState from "/state/user.js";

export default class RenderIf extends HTMLElement {
  static get observedAttributes() {
    return ["when"];
  }

  get when() {
    return this.getAttribute("when");
  }

  set when(value) {
    this.setAttribute("when", value);
  }

  constructor() {
    super();

    this._initialized = false;
    this.evaluateCondition = null;
    this.merged = {};
    this.states = new Map();
    this.unsubscribes = new Map();
  }

  connectedCallback() {
    if (this._initialized) return;

    if (this.when && !this.evaluateCondition) {
      this.compile();
    }

    this._initialized = true;
  }

  disconnectedCallback() {
    for (const [_, unsubscribe] of this.unsubscribes) {
      unsubscribe();
    }
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   if (name === "when" && oldValue !== newValue) {
  //     this.compile();
  //   }
  // }

  compile() {
    try {
      this.evaluateCondition = new Function(
        "state",
        `with (state) { return ${this.when} }`,
      );

      this.removeAttribute("when");

      if (this.state) {
        this.evaluate(this.state);
      }
    } catch (_) {
      this.evaluateCondition = null;
    }
  }

  evaluate() {
    if (!this.evaluateCondition) return;

    let shouldRender = false;

    try {
      shouldRender = !!this.evaluateCondition(this.merged);
    } catch (_) {
      shouldRender = false;
    }

    this.hidden = !shouldRender;
  }

  subscribeSingle(state) {
    this.states.set("local", state);
    this.states.set("user", userState);

    this.unsubscribes.set(
      "local",
      state.subscribeForAny((_) => {
        this.evaluate();
      }),
    );

    this.unsubscribes.set(
      "user",
      userState.subscribeForAny((_) => {
        this.evaluate();
      }),
    );
  }

  subscribeMulti(states) {
    this.states.set("user", userState);

    for (const [id, state] of states) {
      this.states.set(id, state);

      this.unsubscribes.set(
        id,
        state.subscribeForAny((simpleState) => {
          this.evaluate();
        }),
      );
    }
  }

  subscribe(state) {
    if (state instanceof Map) {
      this.subscribeMulti(state);
    } else {
      this.subscribeSingle(state);
    }

    for (const [key, state] of this.states) {
      this.merged[key] = state.simpleStore;
    }
  }
}

window.customElements.define("render-if", RenderIf);
