import Projectile from "/game/Projectile.js";
import Spaceship from "/game/Spaceship.js";
import Thruster from "/game/Thruster.js";
import BlockStyle from "/game/BlockStyle.js";
import BuildingBlock from "/game/BuildingBlock.js";
import Model from "/game/Model.js";
import * as vec2 from "/common/vec2.js";
import { getAngleDiff } from "/common/common.js";
import * as mat2 from "/common/mat2.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";

export default class Enemy extends Spaceship {
  static from(saved, recoveredModel, game) {
    const enemy = new Enemy({
      type: saved.type,
      game,
      model: recoveredModel,
      maxSpeed: saved.maxSpeed,
      turnRate: saved.turnRate,
      behavior: saved.behavior ?? "aggressive",
      difficulty: saved.difficulty ?? 1,
    });
    enemy.teleportTo(saved.position[0], saved.position[1]);
    return enemy;
  }

  // prettier-ignore
  constructor({ game, model, x, y, maxSpeed, turnRate, behavior = "aggressive", difficulty = 1 } = {}) {
    super({ type: Type.ENEMY, game, model, x, y, vx: 0, vy: 0, maxSpeed });
    this.behavior = behavior;
    this.difficulty = difficulty;
    this.provoked = false;
    this._wanderTimer = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
    this._turnRate = turnRate ?? (1.0 + this.maxSpeed * 0.7);
    this._thrusterCache = null;
    this.trailParticles = [];
    this.maxTrailParticles = 180;
  }

  exportSave() {
    return {
      ...super.exportSave(),
      turnRate: this._turnRate,
      behavior: this.behavior,
      difficulty: this.difficulty,
    };
  }

  onShoot() {
    this.game.audioManager.getSound("lasershootsound")?.instance?.play?.();
  }

  onProjectileHit(projectile) {
    if (projectile?.owner?.is?.(Type.PLAYER)) this.provoked = true;
  }

  getThrusters() {
    if (!this._thrusterCache)
      this._thrusterCache = this.model.objects.filter((obj) => obj instanceof Thruster);
    return this._thrusterCache;
  }

  // prettier-ignore
  fireThrusters() {
    const _b = this.game.buffer;
    for (const thruster of this.getThrusters()) {
      const tv = vec2.copy(_b.vec2_1, thruster.getThrustVector());
      vec2.rotate(tv, this.rotation);
      this.netForce.apply(_b.force_1.setFromMagDir(thruster.getThrust(), tv));
      this.spawnThrusterTrail(thruster);
    }
  }

  getTurretBulletColor(block) {
    const grade = Math.max(0, Math.min(14, block.gradeID ?? 0));
    return BlockStyle.getColorForGrade(grade);
  }

  getTurretBulletColor(block) {
    const grade = Math.max(0, Math.min(14, block.gradeID ?? 0));
    return BlockStyle.getColorForGrade(grade);
  }

  getTrailColor(alpha) {
    const grade = Math.max(0, Math.min(14, this.difficulty - 1));
    const base = BlockStyle.GRADE_COLORS[grade] || BlockStyle.GRADE_COLORS[0] || "rgba(197, 197, 197, 1)";
    if (typeof base === "string" && base.startsWith("rgba(")) {
      return base.replace(/,\s*1\)$/, `, ${Math.max(0, Math.min(1, alpha))})`);
    }
    return `rgba(197, 197, 197, ${Math.max(0, Math.min(1, alpha))})`;
  }

  spawnThrusterTrail(thruster) {
    if (!thruster || thruster.throttle <= 0.01) return;

    const _b = this.game.buffer;
    const [px, py] = this.position;
    const [lx, ly] = thruster.localPosition;

    const mountPos = vec2.set(
      _b.vec2_1,
      lx - thruster.thrustVector[0] * 0.2,
      ly - thruster.thrustVector[1] * 0.2,
    );
    vec2.rotate(mountPos, this.rotation);

    if (this.trailParticles.length >= this.maxTrailParticles) {
      this.trailParticles.shift();
    }

    this.trailParticles.push({
      source: thruster,
      x: px + mountPos[0],
      y: py + mountPos[1],
      age: 0,
      life: 0.75,
      maxLife: 0.75,
      lineWidth: 2.2 + thruster.throttle * 1.2,
    });
  }

  updateThrusterTrail(dt) {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.age += dt;
      p.life -= dt;
      if (p.life <= 0) this.trailParticles.splice(i, 1);
    }
  }

  renderThrusterTrail(ctx, alpha) {
    if (!ctx || this.trailParticles.length === 0 || !this.game?.player) return;

    const game = this.game;
    const W = game.canvas.width;
    const H = game.canvas.height;

    let scaleX = game.scale;
    let scaleY = game.scale;
    if (game.aspectRatio >= 1) scaleX = game.scale / game.aspectRatio;
    else scaleY = game.scale * game.aspectRatio;

    const ppuX = scaleX * W * 0.5;
    const ppuY = scaleY * H * 0.5;
    const cx = game.player.previousPosition[0] + (game.player.position[0] - game.player.previousPosition[0]) * alpha;
    const cy = game.player.previousPosition[1] + (game.player.position[1] - game.player.previousPosition[1]) * alpha;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const groups = new Map();
    const FADE_IN_DURATION = 0.1;

    for (const p of this.trailParticles) {
      if (!groups.has(p.source)) groups.set(p.source, []);
      groups.get(p.source).push(p);
    }

    for (const points of groups.values()) {
      if (points.length < 2) continue;

      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const aOut = Math.max(0, Math.min(1, a.life / a.maxLife));
        const bOut = Math.max(0, Math.min(1, b.life / b.maxLife));
        const aIn = Math.max(0, Math.min(1, a.age / FADE_IN_DURATION));
        const bIn = Math.max(0, Math.min(1, b.age / FADE_IN_DURATION));
        const t = Math.min(aOut, bOut) * Math.min(aIn, bIn);

        const ax = (a.x - cx) * ppuX + W * 0.5;
        const ay = H * 0.5 - (a.y - cy) * ppuY;
        const bx = (b.x - cx) * ppuX + W * 0.5;
        const by = H * 0.5 - (b.y - cy) * ppuY;

        ctx.strokeStyle = this.getTrailColor(0.08 + 0.48 * t);
        ctx.lineWidth = Math.max(1.8, (a.lineWidth + b.lineWidth) * 0.5);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  setFacingRotation(rotation) {
    const _b = this.game.buffer;
    this.rotation = rotation;
    mat2.fromRotation(_b.mat2_1, this.rotation);
    vec2.set(this.forward, 0, 1);
    vec2.transformMat2(this.forward, _b.mat2_1, this.forward);
    vec2.normalize(this.forward, this.forward);
  }

  turnTowardAngle(targetRotation, dt) {
    const angleDiff = getAngleDiff(targetRotation, this.rotation);
    const maxStep = this._turnRate * dt;
    const clampedStep = Math.max(-maxStep, Math.min(maxStep, angleDiff));
    this.setFacingRotation(this.rotation + clampedStep);
    return Math.abs(angleDiff) <= maxStep;
  }

  getTurretBlocks() { return this.model.objects.filter((b) => b.isTurret); }

  getPlayerCorePosition() { return this.game.player.position; }

  getTurretWorldPosition(turretBlock, out) {
    vec2.copy(out, turretBlock.localPosition);
    vec2.rotate(out, this.rotation);
    vec2.add(out, out, this.position);
    return out;
  }

  getTurretBulletColor(block) {
    const hue = 205 - Math.max(0, Math.min(14, block.gradeID ?? 0)) * 10;
    return `hsl(${hue} 100% 62%)`;
  }

  getTurretRangeStats(playerCore) {
    const _b = this.game.buffer;
    const turrets = this.getTurretBlocks();
    let minDistance = Infinity, maxRange = 0;
    for (const turret of turrets) {
      this.getTurretWorldPosition(turret, _b.vec2_1);
      const d = Math.hypot(_b.vec2_1[0] - playerCore[0], _b.vec2_1[1] - playerCore[1]);
      if (d < minDistance) minDistance = d;
      if ((turret.bulletRange ?? 0) > maxRange) maxRange = turret.bulletRange;
    }
    if (!Number.isFinite(minDistance)) minDistance = Infinity;
    return { turrets, minDistance, maxRange };
  }

  isPlayerDamageSource(other) {
    const source = other?.parent ?? other;
    if (!source) return false;

    if (source?.is?.(Type.PLAYER)) return true;
    if (source?.is?.(Type.PROJECTILE)) return source.owner?.is?.(Type.PLAYER) ?? false;

    return false;
  }

  aim(targetPosition, dt) {
    const toTarget = vec2.create();
    vec2.sub(toTarget, targetPosition, this.position);
    if (vec2.len(toTarget) === 0) return false;
    vec2.normalize(toTarget, toTarget);
    const rotation = Math.atan2(toTarget[1], toTarget[0]) - Math.PI / 2;
    return this.turnTowardAngle(rotation, dt);
  }

  shootFromTurret(turretBlock, playerCorePosition) {
    const _b = this.game.buffer;
    const localMuzzle = vec2.set(_b.vec2_1, turretBlock.localPosition[0], turretBlock.localPosition[1] + 0.5);
    vec2.rotate(localMuzzle, this.rotation);
    vec2.add(localMuzzle, localMuzzle, this.position);
    const distanceToCore = Math.hypot(localMuzzle[0] - playerCorePosition[0], localMuzzle[1] - playerCorePosition[1]);
    if (distanceToCore > (turretBlock.bulletRange ?? 0)) return;
    const direction = vec2.sub(_b.vec2_2, playerCorePosition, localMuzzle);
    if (vec2.len(direction) <= 0.0001) return;
    vec2.normalize(direction, direction);
    const projectile = new Projectile({
      game: this.game,
      x: localMuzzle[0], y: localMuzzle[1],
      vx: turretBlock.bulletSpeed, vy: turretBlock.bulletSpeed,
      direction, dmg: turretBlock.bulletDamage,
      range: turretBlock.bulletRange, owner: this,
      color: this.getTurretBulletColor(turretBlock),
    });
    this.game.projectiles.add(projectile);

    this.onShoot();

    this.shootCooldown = cooldown;
  }

  detachRemainingBlocks() {
    for (const block of this.model.objects) {
      if (!block?.isRemovable || block.toRemove) continue;

      const [lx, ly] = block.localPosition;
      const wx = this.position[0] + lx * Math.cos(this.rotation) - ly * Math.sin(this.rotation);
      const wy = this.position[1] + lx * Math.sin(this.rotation) + ly * Math.cos(this.rotation);

      const driftX = this.velocity[0] + (Math.random() * 2 - 1) * 0.45;
      const driftY = this.velocity[1] + (Math.random() * 2 - 1) * 0.45;

      const detached = new BuildingBlock({
        game: this.game,
        model: new Model([block], Model.COPY_MODE.PRESERVE),
        x: wx,
        y: wy,
        vx: driftX,
        vy: driftY,
      });

      block.toRemove = true;
      this.game.buildingBlocks.add(detached);
    }
  }

  detachDisconnectedBlocks() {
    const core = this.model.objects.find((block) => !block?.isRemovable && !block.toRemove);
    if (!core) return false;

    const connected = new Set();
    const queue = [core];
    connected.add(core);

    while (queue.length) {
      const current = queue.shift();
      // Turrets and thrusters are leaf-only: they don't extend structural connectivity
      if (current.isTurret || current.isThruster || current instanceof Thruster) continue;
      const [cx, cy] = current.localPosition;

      for (const neighbor of this.model.objects) {
        if (neighbor.toRemove || connected.has(neighbor)) continue;

        const [nx, ny] = neighbor.localPosition;
        if (Math.abs(cx - nx) + Math.abs(cy - ny) !== 1) continue;

        connected.add(neighbor);
        queue.push(neighbor);
      }
    }

    let detachedAny = false;
    for (const block of this.model.objects) {
      if (!block?.isRemovable || block.toRemove || connected.has(block)) continue;

      const [lx, ly] = block.localPosition;
      const wx = this.position[0] + lx * Math.cos(this.rotation) - ly * Math.sin(this.rotation);
      const wy = this.position[1] + lx * Math.sin(this.rotation) + ly * Math.cos(this.rotation);

      const driftX = this.velocity[0] + (Math.random() * 2 - 1) * 0.45;
      const driftY = this.velocity[1] + (Math.random() * 2 - 1) * 0.45;

      const detached = new BuildingBlock({
        game: this.game,
        model: new Model([block], Model.COPY_MODE.PRESERVE),
        x: wx,
        y: wy,
        vx: driftX,
        vy: driftY,
      });

      block.toRemove = true;
      this.game.buildingBlocks.add(detached);
      detachedAny = true;
    }

    return detachedAny;
  }

  // prettier-ignore
  update() {
    const dt = this.game.fdt;
    const playerCore = this.getPlayerCorePosition();

    if (this.behavior === "rammer") {
      this.aim(playerCore, dt);
      this.fireThrusters();
      this.updateVelocity();
      this.updatePosition();
      this.updateThrusterTrail(dt);
      return;
    }

    // object.health = 0;
    //const geometryChanged = this.model.clear();
    const target = playerCore;
    const { turrets, minDistance, maxRange } = this.getTurretRangeStats(playerCore);
    const detectionRange = turrets.length ? maxRange * 1.8 + 8 : 0;
    const canSeeTarget = turrets.length > 0 &&
      Math.hypot(this.position[0] - target[0], this.position[1] - target[1]) <= detectionRange;
    const engage = turrets.length > 0 &&
      (this.behavior === "aggressive" ? canSeeTarget :
       this.behavior === "neutral" ? (this.provoked && canSeeTarget) : false);
    if (engage) {
      this.aim(target, dt);
      const desiredRange = maxRange * 0.92;
      if (minDistance > desiredRange) this.fireThrusters();
      for (const turret of turrets) {
        turret._shootTimer = Math.max(0, (turret._shootTimer ?? 0) - dt);
        if (turret._shootTimer > 0) continue;
        this.shootFromTurret(turret, target);
        turret._shootTimer = turret.shootCooldown;
      }
    } else {
      this._wanderTimer -= dt;
      if (this._wanderTimer <= 0) {
        const currentHeading = this.rotation + Math.PI / 2;
        const headingJitter = (Math.random() * 2 - 1) * (Math.PI / 5);
        this._wanderAngle = currentHeading + headingJitter;
        this._wanderTimer = 4 + Math.random() * 4;
      }
      this.turnTowardAngle(this._wanderAngle - Math.PI / 2, dt);
      this.fireThrusters();
    }
    this.updateVelocity();
    this.updatePosition();
    this.updateThrusterTrail(dt);
  }

  onBroadCollision(other) { return true; }
  onNarrowCollision(other) { return true; }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) { object.showDetails(this); return; }
    const other = collision.a?.parent?.parent === this ? collision.b.parent : collision.a.parent;
    const source = other?.parent ?? other;
    const otherBlock = collision.a?.parent?.parent === this
      ? collision.b?.model?.objects?.[0]
      : collision.a?.model?.objects?.[0];

    if (source?.is?.(Type.PROJECTILE)) {
      if (source.owner?.is?.(Type.PLAYER)) this.provoked = true;
      if (typeof object?.health === "number") {
        object.health -= source.dmg ?? 0;
      }
    } else if (source?.is?.(Type.BUILDING_BLOCK)) {
      return;
    } else if (typeof object?.health === "number" && typeof otherBlock?.health === "number") {
      const ownHp = Math.max(0, object.health);
      const otherHp = Math.max(0, otherBlock.health);

      if (ownHp <= otherHp) {
        object.health = 0;
        otherBlock.health = otherHp - ownHp;
      } else {
        object.health = ownHp - otherHp;
        otherBlock.health = 0;
      }
    } else {
      object.health = 0;
    }

    const isCoreBlock = !object.isRemovable && object.health <= 0;
    const killedByPlayer = this.isPlayerDamageSource(other);
    const geometryChanged = this.model.clear();
    if (isCoreBlock) {
      this.detachRemainingBlocks();
      this.model.clear();
      if (killedByPlayer && this.game.player) {
        const base = 100 + 100 * this.difficulty;
        const mult = this.behavior === "aggressive" || this.behavior === "rammer" ? 3 : this.behavior === "neutral" ? 2 : 1;
        this.game.player.score += base * mult;
      }
      this.setState(GlobalState.DEAD);
      return;
    }
    if (geometryChanged) {
      if (this.detachDisconnectedBlocks()) {
        this.model.clear();
      }

      this._thrusterCache = null;
      this.proxyCollider.onGeometryChange();
      this.shapeCollider.onGeometryChange();
      if (this.model.objects.length === 0) this.setState(GlobalState.DEAD);
    }
  }
}
