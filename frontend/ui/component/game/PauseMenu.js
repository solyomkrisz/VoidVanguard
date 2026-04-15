import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import "/ui/component/layout/DrilldownMenu.js";
import "/ui/component/game/SaveForm.js";

export default class PauseMenu extends BaseCustomElement {
  set game(value) {
    this._game = value;
  }

  get game() {
    return this._game;
  }

  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "pauseMenu.css"),
      path.join(dir, "drilldownMenu.css"),
    ]);

    this._elements = {};
    this._game = null;
    this._built = false;

    this.onResume = this.onResume.bind(this);
    this.onViewChange = this.onViewChange.bind(this);
    this.onSaveRequest = this.onSaveRequest.bind(this);
  }

  onResume() {
    if (!this.game) return;
    this.game.resume();
  }

  onViewChange(e) {
    const currentView = e?.detail?.currentView;
    if (!currentView) return;

    if (currentView === "root-level") {
      this._elements.resumeButton.hidden = false;
    } else {
      this._elements.resumeButton.hidden = true;
    }
  }

  async onSaveRequest(e) {
    const formData = e?.detail?.formData;
    if (!formData) {
      console.error("Unable to process save request");
      return;
    }

    await this.game.saveCurrentStateAs(formData);

    e?.detail?.onDone?.();
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this.hidden = true;

    this.setShadowInnerHTML(`
        <h1 class="title">Játék megállítva</h1>
        <button id="resume">Folytatás</button>
        <drilldown-menu initial="root-level">
          <template id="save-game" data-name="Játékmenet mentése">
            <save-form></save-form>
          </template>
          <template id="root-level">
            <button data-target="save-game">Játékmenet mentése</button>
          </template>
        </drilldown-menu>
    `);

    const resumeButton = this.queryShadowSelector("#resume");
    resumeButton.addEventListener("click", this.onResume);
    this._elements.resumeButton = resumeButton;

    this.addEventListener("save-request", this.onSaveRequest);
    this.addEventListener("view-change", this.onViewChange);

    this._built = true;
  }

  show() {
    this.hidden = false;
  }

  hide() {
    this.hidden = true;
  }
}

window.customElements.define("pause-menu", PauseMenu);
