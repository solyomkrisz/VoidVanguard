/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/globalAudio.js
 * Szerep: Globalis hangkezelo es kattintasalapu UI-hangeffekt indito.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import AudioManager from "/common/AudioManager.js";

const audioManager = new AudioManager();

const uiVolume = localStorage.getItem("ui_volume")
  ? Number(localStorage.getItem("ui_volume"))
  : 1;
audioManager.setVolume(uiVolume);

audioManager.queueAudio("click_1", "/sound/clicksound_1.mp3", {
  type: "pool",
});

const pending = [];

const globalAudio = {
  // Lejatszik egy hangot, vagy sorba rakja kesobbre, ha az eroforras meg nincs betoltve.
  play(name, options = {}) {
    const entry = audioManager.getSound(name);

    if (!entry) {
      if (options.queueIfMissing) {
        pending.push(name);
      }
      return;
    }

    entry.instance.play();
  },

  // Megprobalja lejatszani a korabban varolistara tett hangokat.
  flush() {
    for (const name of pending) {
      const entry = audioManager.getSound(name);
      if (entry) entry.instance.play();
    }
    pending.length = 0;
  },

  // A kozos audio manager hangerejet allitja.
  setVolume(volume) {
    audioManager.setVolume(volume);
  },
};

// A kattintasokhoz kotott unlockot es data-sfx alapú UI-hanglejatszast huzza ra az egesz oldalra.
export function attachGlobalAudioListeners() {
  window.addEventListener(
    "click",
    () => {
      audioManager.unlock();
    },
    { once: true },
  );

  window.addEventListener("click", (e) => {
    const path = e.composedPath();

    for (const el of path) {
      if (el instanceof HTMLElement && el.dataset?.sfx) {
        globalAudio.play(el.dataset.sfx);
        break;
      }
    }
  });
}

export default globalAudio;
