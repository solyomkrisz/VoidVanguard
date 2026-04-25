import AudioManager from "/common/AudioManager.js";

const audioManager = new AudioManager();

audioManager.queueSound("clicksound_1", "/sound/clicksound_1.mp3");

export default audioManager;
