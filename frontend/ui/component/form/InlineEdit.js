export default class InlineEdit extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;
    this.onClick = this.onClick.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();

    this.addEventListener("click", this.onClick);
    document.addEventListener("pointerdown", this.onPointerDown);
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.onPointerDown);
  }

  onPointerDown(e) {
    if (!this.contains(e.target)) {
      this.hideEditor();
    }
  }

  onClick(e) {
    this.showEditor();
  }

  hideEditor() {
    const elements = this._elements;

    elements.editor.hidden = true;
    elements.text.hidden = false;
  }

  showEditor() {
    const elements = this._elements;

    elements.editor.hidden = false;
    elements.text.hidden = true;
  }

  build() {
    const elements = this._elements;

    elements.text = this.firstElementChild;
    elements.editor = this.lastElementChild;

    elements.editor.this._built = false;
  }

  syncText() {
    const editor = this._elements.editor;
    const text = this._elements.text;

    if (editor instanceof HTMLInputElement) {
      text.textContent = editor.value;
    } else if (editor instanceof HTMLTextAreaElement) {
      text.textContent = editor.textContent;
    } else {
      console.warn("Invalid input type.");
    }
  }

  syncEditor() {
    const editor = this._elements.editor;
    const text = this._elements.text.textContent;

    if (editor instanceof HTMLInputElement) {
      editor.value = text;
    } else if (editor instanceof HTMLTextAreaElement) {
      editor.textContent = text;
    } else {
      console.warn("Invalid input type.");
    }
  }
}

window.customElements.define("inline-edit", InlineEdit);
