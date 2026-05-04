import Block from "/game/Block.js";
import Rigidbody from "/game/Rigidbody.js";
import * as vec2 from "/common/vec2.js";
import Model from "/game/Model.js";
import Shape from "/game/Shape.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";

export default class Projectile extends Rigidbody {
  // prettier-ignore
  static MODEL = [
    new Block({ x: 0, y: 0, shape: new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.12, 0.45, 0.12, 0.45, 0.12, -0.45, -0.12, -0.45), spriteID: null })
  ];

  constructor({ game, x, y, vx, vy, direction = null, dmg = 0, owner = null, color = "hsl(0, 0%, 24%)", range = 0 } = {}) {
    super({
      type: Type.PROJECTILE,
      game,
      model: new Model(Projectile.MODEL),
      x: x,
      y: y,
      vx: vx,
      vy: vy,
    });

    this.id = game.idManager.get();
    this.dmg = dmg;
    this.owner = owner;
    this.color = color;
    this.direction = vec2.copy(vec2.create(), direction ?? vec2.fromValues(0, 1));
    vec2.normalize(this.direction, this.direction);
    this.speed = Math.max(0, Math.hypot(vx ?? 0, vy ?? 0));
    this.maxRange = Math.max(0, range);
    this.traveled = 0;
    this.impactScale = Math.max(0.75, this.speed / 6);
    this.fadeDuration = 0.1;
    this.fadeTimer = 0;
    this.isFading = false;
  }

  startFade() {
    if (this.isFading) return;
    this.isFading = true;
    this.fadeTimer = this.fadeDuration;
  }

  update() {
    const dt = this.game.fdt;

    if (this.isFading) {
      this.fadeTimer -= dt;
      if (this.fadeTimer <= 0) {
        this.setState(GlobalState.DEAD);
      }
      return;
    }

    const stepDistance = this.speed * dt;

    vec2.addScaled(this.position, this.position, this.direction, stepDistance);
    this.traveled += stepDistance;

    if (this.maxRange > 0 && this.traveled >= this.maxRange) {
      this.startFade();
      return;
    }

    this.onPositionChange(); // no if check because we assume that a projectile is either moving or got destroyed
  }

  render() {
    this.previousNetForce.reset();

    const game = this.game;
    const ctx = game.debugOverlay?.ctx;
    const player = game.player;
    if (!ctx || !player) return;

    const W = game.canvas.width;
    const H = game.canvas.height;

    let scaleX = game.scale;
    let scaleY = game.scale;
    if (game.aspectRatio >= 1) scaleX = game.scale / game.aspectRatio;
    else scaleY = game.scale * game.aspectRatio;

    const ppuX = scaleX * W * 0.5;
    const ppuY = scaleY * H * 0.5;

    const camX =
      player.previousPosition[0] +
      (player.position[0] - player.previousPosition[0]) * game.alpha;
    const camY =
      player.previousPosition[1] +
      (player.position[1] - player.previousPosition[1]) * game.alpha;

    const ix =
      this.previousPosition[0] +
      (this.position[0] - this.previousPosition[0]) * game.alpha;
    const iy =
      this.previousPosition[1] +
      (this.position[1] - this.previousPosition[1]) * game.alpha;

    const sx = (ix - camX) * ppuX + W * 0.5;
    const sy = H * 0.5 - (iy - camY) * ppuY;

    const lineLen = 0.65;
    const ex = sx + this.direction[0] * lineLen * ppuX;
    const ey = sy - this.direction[1] * lineLen * ppuY;
    const fadeAlpha = this.isFading
      ? Math.max(0, Math.min(1, this.fadeTimer / this.fadeDuration))
      : 1;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = fadeAlpha;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(225, 250, 255, 0.95)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.restore();
  }

  onBroadCollision(other) {
    if (this.isFading) return false;
    if (other?.is?.(Type.PROJECTILE) && other.owner === this.owner) return false;
    return other !== this.owner;
  }

  onNarrowCollision(other) {
    if (this.isFading) return false;
    if (other?.is?.(Type.PROJECTILE) && other.owner === this.owner) return false;
    return other !== this.owner;
  }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) return;
    // this.setState(GlobalState.DEAD);

    const other = collision.a.parent === this ? collision.b.parent : collision.a.parent;
    if (other === this.owner) return;

    this.game._spawnProjectileImpactAt?.(this, this.position[0], this.position[1], object);

    if (this.dmg > 0) {
      if (typeof other.onProjectileHit === "function") {
        other.onProjectileHit(this);
      }
    }
    this.startFade();
  }
}
