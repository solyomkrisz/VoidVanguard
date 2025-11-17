export default class Sprite {
  constructor() {
    // Frames (a list of texture coordinates belonging to the same animation)
    // should be stored on the game instance globally to prevent memory allocation.
    this.frames = [];
    this.currentFrameIndex = -1;
    this.timer = -1;
  }

  addFrame(textureName, frameDuration) {
    this.frames.push({ textureName, frameDuration });

    if (this.currentFrameIndex < 0 || this.timer < 0) {
      this.currentFrameIndex = 0;
      this.timer = this.frames[this.currentFrameIndex].frameDuration;
    }
  }

  getCurrentTexture() {
    return this.frames[this.currentFrameIndex].textureName;
  }

  update(dt) {
    this.timer -= dt / 1000;

    if (this.timer <= 0) {
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.frames.length;
      this.timer = this.frames[this.currentFrameIndex].frameDuration;
    }
  }
}
