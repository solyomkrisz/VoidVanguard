import AudioManager from "/common/AudioManager.js";

const audioManager = new AudioManager();

audioManager.queueAudio("click_1", "/sound/clicksound_1.mp3", {
  type: "pool",
});

const pending = [];

const globalAudio = {
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

  flush() {
    for (const name of pending) {
      const entry = audioManager.getSound(name);
      if (entry) entry.instance.play();
    }
    pending.length = 0;
  },
};

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
