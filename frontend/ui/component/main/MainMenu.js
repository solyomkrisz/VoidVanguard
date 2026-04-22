import Game from "/game/Game.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import { on, off } from "/common/eventhub.js";
import "/ui/component/layout/DrilldownMenu.js";
import "/ui/component/game/SaveBrowserLauncher.js";
import "/ui/component/game/RemoteSaveList.js";
import "/ui/component/game/SaveMenu.js";

export default class MainMenu extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "mainMenu.css"),
      path.join(dir, "drilldownMenu.css"),
    ]);

    this._startedGame = null;
    this._built = false;
    this._elements = {};

    this.onGameStart = this.onGameStart.bind(this);
    this.onGameExit = this.onGameExit.bind(this);
    this.onSaveLoadRequest = this.onSaveLoadRequest.bind(this);
  }

  connectedCallback() {
    this.build();

    on("exit-game", this.onGameExit);
  }

  disconnectedCallback() {
    off("exit-game", this.onGameExit);
  }

  preInitGame(savedState = null) {
    if (!window?.VoidVanguard) {
      window.VoidVanguard = {};
    }

    const hasGame =
      !window.VoidVanguard?.game || !(window.VoidVanguard.game instanceof Game);

    if (hasGame) {
      window.VoidVanguard.game = Game.from(savedState);
    }

    return window.VoidVanguard.game;
  }

  onSaveLoadRequest(e) {
    e.stopPropagation();

    const save = e?.detail?.save;
    const saveType = e?.detail?.saveType;
    console.log(save, saveType);
    if (!save || !saveType) return;

    const game = this.preInitGame(save);
    game.saveType = saveType;
    this._startedGame = game;
    game.start();
    this.hidden = true;
  }

  onGameStart() {
    const game = this.preInitGame();
    this._startedGame = game;
    game.start();
    this.hidden = true;
  }

  onGameExit(e) {
    const exitedGame = e?.detail?.game;
    if (!exitedGame) return;

    if (this._startedGame === exitedGame) {
      this.hidden = false;
      this._startedGame = null;
      window.VoidVanguard.game = null;
    }
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <h1>VoidVanguard</h1>
        <drilldown-menu initial="root">
            <template id="root">
                <button id="start">Új játék indítása</button>
                <button data-target="save-menu">Játékmenet betöltése</button>
            </template>
            <template id="save-menu">
              <save-menu remote-save-list-controls="load delete"></save-menu>
            </template>
        </drilldown-menu>
    `);

    const startButton = this.queryShadowSelector("#start");
    startButton.addEventListener("click", this.onGameStart);
    this._elements.startButton = startButton;

    this.addEventListener("save-load-request", this.onSaveLoadRequest);

    this._built = true;
  }
}

window.customElements.define("main-menu", MainMenu);
