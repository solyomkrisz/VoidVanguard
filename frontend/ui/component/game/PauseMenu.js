import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/layout/DrilldownMenu.js";
import "/ui/component/game/RemoteSaveList.js";
import "/ui/component/game/SaveForm.js";
import "/ui/component/game/ResumeButton.js";
import "/ui/component/game/ExitButton.js";

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
    this.onExit = this.onExit.bind(this);
    this.onViewChange = this.onViewChange.bind(this);
    this.onSaveRequest = this.onSaveRequest.bind(this);
  }

  onResume(e) {
    e.stopPropagation();

    if (!this.game) return;
    this.game.resume();

    document.dispatchEvent(
      new CustomEvent("resume-game", { detail: { game: this } }),
    );
  }

  onExit(e) {
    e.stopPropagation();

    if (!this.game) return;
    this.game.destroy();

    document.dispatchEvent(
      new CustomEvent("exit-game", { detail: { game: this._game } }),
    );
  }

  onViewChange(e) {
    const currentView = e?.detail?.currentView;
    if (!currentView) return;
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
        <drilldown-menu initial="root">
          <template id="save-game" data-name="Játékmenet mentése">
            <remote-save-list
              src="/api/saves"
              controls="pagination"
              selection-enabled
              with-form
            ></remote-save-list>
          </template>
          <template id="root">
            <resume-button></resume-button>
            <button data-target="save-game">Játékmenet mentése</button>
            <exit-button></exit-button>
          </template>
        </drilldown-menu>
    `);

    this.addEventListener("resume-game", this.onResume);
    this.addEventListener("exit-game", this.onExit);
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
