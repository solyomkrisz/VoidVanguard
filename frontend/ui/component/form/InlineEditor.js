import { isLoggedIn } from "/common/common.js";

export default class InlineEditor extends HTMLElement {
  get allowAnonymous() {
    return this.hasAttribute("allow-anonymous");
  }

  set allowAnonymous(value) {
    if (value) {
      this.setAttribute("allow-anonymous", "");
    } else {
      this.removeAttribute("allow-anonymous");
    }
  }

  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this._listening = false;

    this.onLogout = this.onLogout.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
  }

  attachGlobalListeners() {
    if (this._listening) return;

    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("logout", this.onLogout);

    this._listening = true;
  }

  detachGlobalListeners() {
    if (!this._listening) return;

    document.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("logout", this.onLogout);

    this._listening = false;
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  disconnectedCallback() {
    this.detachGlobalListeners();
  }

  onPointerDown(e) {
    if (!this.contains(e.target)) {
      this.hideEditor();
    }
  }

  onClick(e) {
    e.stopPropagation();

    if (!this.allowAnonymous && !isLoggedIn()) return;

    this.showEditor();
  }

  onLogout(e) {
    if (!this.allowAnonymous) {
      this.hideEditor();
    }
  }

  hideEditor() {
    const elements = this._elements;
    if (elements.editor.hidden) return;

    elements.editor.hidden = true;
    elements.text.hidden = false;

    this.syncText();

    this.detachGlobalListeners();
  }

  showEditor() {
    const elements = this._elements;

    if (!elements.editor.hidden) {
      elements.editor.focus?.();
      return;
    }

    elements.editor.hidden = false;
    elements.text.hidden = true;

    this.syncEditor();

    this.attachGlobalListeners();

    window.requestAnimationFrame(() => {
      const editor = elements.editor;

      editor.focus?.();

      if (typeof editor.setSelectonRange === "function") {
        const length = editor.value.length;
        editor.setSelectionRange(length, length);
      }
    });
  }

  build() {
    const elements = this._elements;

    elements.text = this.firstElementChild;
    elements.editor = this.lastElementChild;

    if (!elements.text || !elements.editor) {
      console.warn(
        "<inline-editor> requires two children: editable and editor",
      );
    }

    elements.editor.hidden = true;
    this.syncEditor();

    this.addEventListener("click", this.onClick);

    this._built = true;
  }

  syncText() {
    const editor = this._elements.editor;
    const text = this._elements.text;

    if (text.textContent === editor.value) return;

    const oldValue = text.textContent;
    text.textContent = editor.value;

    this.dispatchEvent(
      new CustomEvent("inline-edit", {
        detail: {
          oldValue,
          newValue: text.textContent,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  syncEditor() {
    const editor = this._elements.editor;
    const text = this._elements.text;

    if (text.textContent === editor.value) return;

    editor.value = text.textContent;
  }
}

window.customElements.define("inline-editor", InlineEditor);
