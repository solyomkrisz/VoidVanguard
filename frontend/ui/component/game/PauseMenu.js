/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/PauseMenu.js
 * Szerep: Jatek kozbeni szunetmenu.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { dir } from "/ui/UI.js";
import { path, isLoggedIn } from "/common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/layout/DrilldownMenu.js";
import "/ui/component/game/ResumeButton.js";
import "/ui/component/game/ExitButton.js";
import "/ui/component/game/SaveMenu.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

export default class PauseMenu extends BaseCustomElement {
  // A menuhoz tartozo aktualis game peldanyt tarolja.
  set game(value) {
    this._game = value;
  }

  // Visszaadja a pause menuhoz rendelt game peldanyt.
  get game() {
    return this._game;
  }

  // Elokesziti az alap shadow DOM-ot es a bound event handlereket.
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
    this.onSaveFormConnect = this.onSaveFormConnect.bind(this);
    this.onGameVolumeChange = this.onGameVolumeChange.bind(this);
  }

  // A folytatas gomb esemenyet lekezeli, majd tovabbszol a tobbi komponensnek is.
  onResume(e) {
    e.stopPropagation();

    if (!this.game) return;
    this.game.resume();

    document.dispatchEvent(
      new CustomEvent("resume-game", { detail: { game: this } }),
    );
  }

  // A hangero slider valtozasat atadja a jatek audio retegenek.
  onGameVolumeChange(e) {
    e.stopPropagation();

    const volume = e?.detail?.volume;
    if (volume == null) return;

    this.game.setVolume(volume);
  }

  // Kilepeskor lebontja a jatekot es exit-esemenyt bocsat ki.
  onExit(e) {
    e.stopPropagation();

    if (!this.game) return;
    this.game.destroy();

    document.dispatchEvent(
      new CustomEvent("exit-game", { detail: { game: this._game } }),
    );
  }

  // Nezetvaltaskor jelenleg csak beolvassa az aktualis drilldown-nezetet.
  onViewChange(e) {
    const currentView = e?.detail?.currentView;
    if (!currentView) return;
  }

  // A save-formtol kapott adatot atadja a game mentesi folyamatnak.
  async onSaveRequest(e) {
    const formData = e?.detail?.formData;
    if (!formData) {
      console.error("Unable to process save request: no form data provided");
      ToastManager.REQUEST(
        "Unable to process save request: no form data provided",
      );

      return;
    }

    const success = await this.game.save(e?.detail.formData);

    e?.detail?.onDone?.(success);
  }

  // A csatlakozo save-formot feltolti a mar betoltott mentes adataival.
  onSaveFormConnect(e) {
    if (!e?.detail?.form) return;

    e.detail.form.from(this.game.loadedSave);
  }

  // DOM-ba keruleskor egyszeri buildet ker.
  connectedCallback() {
    this.build();
  }

  // Felépiti a pause menu drilldown szerkezetet es hozzakoti a sajat esemenykezeloket.
  build() {
    if (this._built) return;

    this.hidden = true;

    this.setShadowInnerHTML(`
        <h1 class="title">Játék megállítva</h1>
        <drilldown-menu initial="root">
          <template id="save-game" data-name="Játékmenet mentése">
            <save-form></save-form>
          </template>
          <template id="root">
            <resume-button></resume-button>
            <button data-sfx="click_1" data-target="save-game">Játékmenet mentése</button>
            <exit-button></exit-button>
          </template>
        </drilldown-menu>
    `);

    this.addEventListener("resume-game", this.onResume);
    this.addEventListener("exit-game", this.onExit);
    this.addEventListener("save-request", this.onSaveRequest);
    this.addEventListener("view-change", this.onViewChange);
    this.addEventListener("save-form-connected", this.onSaveFormConnect);
    this.addEventListener("game-volume-change", this.onGameVolumeChange);

    this._built = true;
  }

  // Eltavolitja a komponenst a DOM-bol.
  destroy() {
    this.remove();
  }

  // Lathatova teszi a menu host elemet.
  show() {
    this.hidden = false;
  }

  // Elrejti a menu host elemet.
  hide() {
    this.hidden = true;
  }
}

window.customElements.define("pause-menu", PauseMenu);
