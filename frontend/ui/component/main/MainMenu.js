import Game from "/game/Game.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import "/ui/component/layout/DrilldownMenu.js";
import "/ui/component/game/SaveBrowserLauncher.js";
import "/ui/component/game/RemoteSaveList.js";

export default class MainMenu extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "mainMenu.css"),
      path.join(dir, "drilldownMenu.css"),
    ]);

    this._built = false;
    this._elements = {};

    this.onGameStart = this.onGameStart.bind(this);
    this.onSaveLoadRequest = this.onSaveLoadRequest.bind(this);
  }

  connectedCallback() {
    this.build();
  }

  preInitGame() {
    if (!window?.VoidVanguard) {
      window.VoidVanguard = {};
    }

    if (
      !window.VoidVanguard?.game ||
      !(window.VoidVanguard.game instanceof Game)
    ) {
      window.VoidVanguard.game = new Game();
    }

    return window.VoidVanguard.game;
  }

  onSaveLoadRequest(e) {
    const gameState = e?.detail?.gameState;
    if (!gameState) return;

    const game = this.preInitGame();

    game.from(gameState);
  }

  onGameStart() {
    this.preInitGame();
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <h1>VoidVanguard</h1>
        <drilldown-menu initial="root">
            <template id="root">
                <button id="start">Új játék indítása</button>
                <button data-target="save-browser-launcher">Játékmenet betöltése</button>
            </template>
            <template id="save-browser-launcher">
                <save-browser-launcher></save-browser-launcher>
            </template>
            <template id="local-save-menu">
                <h1>Helyi mentések</h1>
                <local-save-list></local-save-list>
            </template>
            <template id="remote-save-menu">
                <h1>Távoli mentések</h1>
                <remote-save-list src="/api/saves" controls="pagination" page-size="6"></remote-save-list>
            </template>
        </drilldown-menu>
    `);

    const startButton = this.queryShadowSelector("#start");
    startButton.addEventListener("click", this.onGameStart);
    this._elements.startButton = startButton;

    this._built = true;
  }
}

window.customElements.define("main-menu", MainMenu);
