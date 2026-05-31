/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Sprite.js
 * Szerep: Animacios frame-lista es idozites logika rajzolt objektumokhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class Sprite {
  constructor() {
    // A sprite csak a frame-listat es az aktualis lejatszasi allapotot tarolja, maga a texturaadat mashol van kozpontilag kezelve.
    this.frames = [];
    this.currentFrameIndex = -1;
    this.timer = -1;
  }

  addFrame(textureName, frameDuration) {
    // Egy animacios frame neve es hossza kerul be a sorozatba; az elso frame automatikusan aktiv lesz.
    this.frames.push({ textureName, frameDuration });

    if (this.currentFrameIndex < 0 || this.timer < 0) {
      this.currentFrameIndex = 0;
      this.timer = this.frames[this.currentFrameIndex].frameDuration;
    }
  }

  getCurrentTexture() {
    // A rendereles mindig az eppen aktiv frame texturanevet kerdezi le innen.
    return this.frames[this.currentFrameIndex].textureName;
  }

  update(dt) {
    // Az animacio idozitoje milliszekundumbol masodpercbe skalozva csokken, es lejáratkor a kovetkezo frame-re lep.
    this.timer -= dt / 1000;

    if (this.timer <= 0) {
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.frames.length;
      this.timer = this.frames[this.currentFrameIndex].frameDuration;
    }
  }
}
