import Keyboard from "/game/Keyboard.js";
import Spaceship from "/game/Spaceship.js";
import Block from "/game/Block.js";
import BlockStyle from "/game/BlockStyle.js";
import * as vec2 from "/common/vec2.js";
import Projectile from "/game/Projectile.js";
import Model from "/game/Model.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";
import * as UI from "/ui/UI.js";
import _ from "/ui/component/game/ShipPropulsionPanel.js";
import _1 from "/ui/component/game/FlightComputer.js";
import BuildingBlock from "/game/BuildingBlock.js";
import EngineIgnitionController from "/ui/component/game/EngineIgnitionController.js";
import EngineThrottleController from "/ui/component/game/EngineThrottleController.js";
import ThrustVectorController from "/ui/component/game/ThrustVectorController.js";
import ShootButton from "/ui/component/game/ShootButton.js";
import { General2DCanvas as G2D } from "/game/General2DCanvas.js";

export default class Player extends Spaceship {
  constructor(game, model) {
    super({
      type: Type.PLAYER,
      game,
      model,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      maxSpeed: 5,
    });

    this.contextMenuTemplate = game.contextMenu.template.PLAYER_CONTEXT_MENU;

    this.score = 0;
    this.scoreTimer = 3;

    this.chunk = vec2.create();
    this.setCurrentChunk();

    this.trailParticles = [];
    this.maxTrailParticles = 480;

    this.UI = {};

    // Creating UI: propulsion panel is body-level (draggable), flight computer is inside controller container
    // prettier-ignore
    {
      this.UI.propulsionPanel = UI.element("ship-propulsion-panel").setSource(this).insertInto();
      const flightComputer = UI.element("flight-computer").setSource(this);
      if (this.game.UI?.controllerContainer?.appendShadowChild) {
        this.game.UI.controllerContainer.appendShadowChild(flightComputer);
      } else {
        flightComputer.insertInto();
      }
      this.UI.flightComputer = flightComputer;
    }

    this.updatePropulsion = this.manualPropulsionUpdate;

    this.model.init(this);
    this.proxyCollider.onGeometryChange();
    this.proxyCollider.validate();
    this.updateStatusDiagram();
  }

  onEngineEnabled() {
    const am = this.game.audioManager;
    const sound = am.getSound("enginesound");
    sound.instance.start();
  }

  onEngineDisabled() {
    const am = this.game.audioManager;
    const sound = am.getSound("enginesound");
    sound.instance.stop();
  }

  onShoot() {
    this.game.audioManager.getSound("lasershootsound")?.instance?.play?.();
  }

  destroy() {
    for (const key of Object.keys(this.UI)) {
      this.UI[key].remove?.();
    }
  }

  exportSave() {
    return {
      ...super.exportSave(),
      score: this.score,
    };
  }

  from(savedState) {
    this.score = savedState.score;
    this.state = new Uint32Array(savedState.state);
    this.position = vec2.clone(savedState.position);
    this.rotation = savedState.rotation;
    this.model.from(savedState.model);
    this.model.applyTextureRotations(this.game.textureManager);

    this.setMassAndCoM();
    this.setMomentOfInertia();
    this.updateStatusDiagram();
  }

  // prettier-ignore
  updateStatusDiagram() {
    if (!this.UI.flightComputer?.statusDiagram) return;

    G2D.setSize(600, 300).setTileSize(this.proxyCollider.r || 2);
    G2D.fillRect("#111", 0, 0, G2D.W, G2D.H);

    for (const object of this.model.objects) {
      const vertices = object.shape.vertices, n = vertices.length;
      const [tx, ty] = object.localPosition;

      G2D.beginPath();
      G2D.moveTo(vertices[0] + tx, vertices[1] + ty, true);

      for (let i = 2; i < n; i += 2) {
        const x = vertices[i % n];
        const y = vertices[(i + 1) % n];
        G2D.lineTo(x + tx, y + ty, true);
      }

      G2D.closePath();
      G2D.fill("#333");
      G2D.stroke("#fff", G2D.toResponsive(0.06));

      G2D.fillCircle("lightblue", this.CoM[0], this.CoM[1], 0.2, 0, Math.PI * 2, true);
    }

    this.UI.flightComputer.statusDiagram.set(G2D.canvas, "image/jpeg", 1.0);
  }

  onGeometryChange() {
    this.proxyCollider.onGeometryChange();
    this.shapeCollider.onGeometryChange();
    this.setMassAndCoM();
    this.setMomentOfInertia();
    this.updateStatusDiagram();
  }

  // prettier-ignore
  setCurrentChunk() {
    this.chunk[0] = Math.floor(this.position[0] / this.game.chunkSize / this.game.backgroundZoom);
    this.chunk[1] = Math.floor(this.position[1] / this.game.chunkSize / this.game.backgroundZoom);
  }

  getTurretBulletColor(block) {
    const grade = Math.max(0, Math.min(14, block.gradeID ?? 0));
    return BlockStyle.getColorForGrade(grade);
  }

  getTurretLocalDirection(block, out) {
    vec2.set(out, 0, 1);

    // Prefer mount geometry: turrets fire away from their connected neighbor.
    // This is robust for captured enemy parts even if texture rotation metadata is stale.
    if (block) {
      const [bx, by] = block.localPosition;
      for (const neighbor of this.model.objects) {
        if (!neighbor || neighbor === block) continue;

        const dx = bx - neighbor.localPosition[0];
        const dy = by - neighbor.localPosition[1];
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;

        return vec2.set(out, dx, dy);
      }
    }

    const sprite = this.game.textureManager?.sprites?.[block?.spriteID];
    if (!sprite) return out;

    const textureName = sprite.getCurrentTexture?.() ?? sprite.frames?.[0]?.textureName;
    if (!textureName) return out;

    const angle = block.getTextureRotation(textureName);
    if (Number.isFinite(angle) && Math.abs(angle) > 0) {
      vec2.rotate(out, angle);
    }

    return out;
  }

  shootFromTurret(block) {
    const _b = this.game.buffer;
    const localDirection = this.getTurretLocalDirection(block, _b.vec2_1);

    const localMuzzle = vec2.set(
      _b.vec2_2,
      block.localPosition[0] + localDirection[0] * 0.5,
      block.localPosition[1] + localDirection[1] * 0.5,
    );

    const shotDirection = vec2.copy(_b.vec2_1, localDirection);
    vec2.rotate(shotDirection, this.rotation);
    vec2.normalize(shotDirection, shotDirection);

    const bulletColor = this.getTurretBulletColor(block);
    this.shoot(
      localMuzzle,
      0,
      block.bulletSpeed,
      block.shootCooldown,
      block.bulletDamage,
      bulletColor,
      block.bulletRange,
      shotDirection,
    );
  }

  shoot(
    localMuzzle,
    projectileSpeedX,
    projectileSpeedY,
    cooldown,
    dmg = 0,
    color = "hsl(200 100% 62%)",
    range = 0,
    directionOverride = null,
  ) {
    const muzzle = vec2.copy(this.game.buffer.vec2_3, localMuzzle);
    vec2.rotate(muzzle, this.rotation);
    vec2.add(muzzle, muzzle, this.position);

    const shotDirection = directionOverride
      ? vec2.copy(this.game.buffer.vec2_2, directionOverride)
      : vec2.copy(this.game.buffer.vec2_2, this.forward);
    vec2.normalize(shotDirection, shotDirection);

    const projectile = new Projectile({
      game: this.game,
      x: muzzle[0],
      y: muzzle[1],
      vx: projectileSpeedX,
      vy: projectileSpeedY,
      direction: shotDirection,
      dmg,
      owner: this,
      color,
      range,
    });

    this.game.projectiles.add(projectile);

    this.onShoot();

    this.shootCooldown = cooldown;
  }

  spawnThrusterTrail(thruster) {
    if (!thruster || thruster.throttle <= 0.01) return;

    const _b = this.game.buffer;
    const [px, py] = this.position;
    const [lx, ly] = thruster.localPosition;

    const mountPos = vec2.set(
      _b.vec2_2,
      lx - thruster.thrustVector[0] * 0.2,
      ly - thruster.thrustVector[1] * 0.2,
    );
    vec2.rotate(mountPos, this.rotation);

    const wx = px + mountPos[0];
    const wy = py + mountPos[1];

    const jx = 0;
    const jy = 0;

    if (this.trailParticles.length >= this.maxTrailParticles) {
      this.trailParticles.shift();
    }

    this.trailParticles.push({
      source: thruster,
      x: wx + jx,
      y: wy + jy,
      age: 0,
      life: 0.85,
      maxLife: 0.85,
      lineWidth: 2.8 + thruster.throttle * 1.8,
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
    if (!ctx || this.trailParticles.length === 0) return;

    const game = this.game;
    const W = game.canvas.width;
    const H = game.canvas.height;

    let scaleX = game.scale;
    let scaleY = game.scale;
    if (game.aspectRatio >= 1) scaleX = game.scale / game.aspectRatio;
    else scaleY = game.scale * game.aspectRatio;

    const ppuX = scaleX * W * 0.5;
    const ppuY = scaleY * H * 0.5;
    const cx = this.previousPosition[0] + (this.position[0] - this.previousPosition[0]) * alpha;
    const cy = this.previousPosition[1] + (this.position[1] - this.previousPosition[1]) * alpha;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const groups = new Map();
    const FADE_IN_DURATION = 0.12;

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

        ctx.strokeStyle = `rgba(120, 210, 255, ${0.06 + 0.5 * t})`;
        ctx.lineWidth = Math.max(2.2, ((a.lineWidth + b.lineWidth) * 0.5));
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  manualPropulsionUpdate(dt, _b, activeControls) {
    const _W =
      activeControls.has(Keyboard.KeyW) ||
      activeControls.has(EngineIgnitionController.IGNITE);

    const _A =
      activeControls.has(Keyboard.KeyA) ||
      activeControls.has(ThrustVectorController.GIMBAL_LEFT);

    const _D =
      activeControls.has(Keyboard.KeyD) ||
      activeControls.has(ThrustVectorController.GIMBAL_RIGHT);

    const _R =
      activeControls.has(Keyboard.KeyR) ||
      activeControls.has(ThrustVectorController.GIMBAL_RESET);

    const _LCtrl =
      activeControls.has(Keyboard.LCtrl) ||
      activeControls.has(EngineThrottleController.THROTTLE_DOWN);

    const _LShift =
      activeControls.has(Keyboard.LShift) ||
      activeControls.has(EngineThrottleController.THROTTLE_UP);

    if (this.controlledThrusters.size > 0) {
      let T = 0;

      for (const thruster of this.controlledThrusters.values()) {
        _A && thruster.gimbal(-2.5 * dt);
        _D && thruster.gimbal(2.5 * dt);
        _LCtrl && thruster.setThrottle(-0.2 * dt);
        _LShift && thruster.setThrottle(0.2 * dt);
        _R && thruster.reset(-2.5 * dt);

        if (_W) {
          const thrustVector = vec2.rotate(
            vec2.copy(_b.vec2_1, thruster.getThrustVector()),
            this.rotation,
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector),
          );
          T += thruster.getTorque(this);

          this.spawnThrusterTrail(thruster);

          this.onEngineEnabled();
        } else {
          this.onEngineDisabled();
        }
      }

      this.angularAcceleration = T / this.I;
    } else {
      this.onEngineDisabled();
    }
  }

  autoPropulsionUpdate(dt, _b, activeControls) {
    const _W =
      activeControls.has(Keyboard.KeyW) ||
      activeControls.has(EngineIgnitionController.IGNITE);

    const _A =
      activeControls.has(Keyboard.KeyA) ||
      activeControls.has(ThrustVectorController.GIMBAL_LEFT);

    const _D =
      activeControls.has(Keyboard.KeyD) ||
      activeControls.has(ThrustVectorController.GIMBAL_RIGHT);

    const _R =
      activeControls.has(Keyboard.KeyR) ||
      activeControls.has(ThrustVectorController.GIMBAL_RESET);

    const _LCtrl =
      activeControls.has(Keyboard.LCtrl) ||
      activeControls.has(EngineThrottleController.THROTTLE_DOWN);

    const _LShift =
      activeControls.has(Keyboard.LShift) ||
      activeControls.has(EngineThrottleController.THROTTLE_UP);

    if (this.controlledThrusters.size > 0) {
      let T = 0;

      for (const thruster of this.controlledThrusters.values()) {
        if (_A) thruster.gimbal(-2.5 * dt);
        if (_D) thruster.gimbal(2.5 * dt);
        if (!_A && !_D) thruster.reset();

        _LCtrl && thruster.setThrottle(-0.2 * dt);
        _LShift && thruster.setThrottle(0.2 * dt);
        _R && thruster.reset(-2.5 * dt);

        if (_W) {
          const thrustVector = vec2.rotate(
            vec2.copy(_b.vec2_1, thruster.getThrustVector()),
            this.rotation,
          );
          this.netForce.apply(
            _b.force_1.setFromMagDir(thruster.getThrust(), thrustVector),
          );
          T += thruster.getTorque(this);

          this.spawnThrusterTrail(thruster);

          this.onEngineEnabled();
        } else {
          this.onEngineDisabled();
        }
      }

      this.angularAcceleration = T / this.I;
    } else {
      this.onEngineDisabled();
    }
  }

  update() {
    this.angularAcceleration = 0;

    const dt = this.game.fdt;
    const _b = this.game.buffer;
    const activeControls = this.game.activeControls;

    this.updatePropulsion(dt, _b, activeControls);

    this.updateVelocity();
    this.updatePosition();

    this.updateThrusterTrail(dt);

    this.updateAngularVelocity();
    this.updateRotation();

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.scoreTimer = Math.max(0, this.scoreTimer - dt);

    const wantsShoot =
      activeControls.has(Keyboard.Space) ||
      activeControls.has(ShootButton.SHOOT);

    const RECOIL_DURATION = 0.11;
    const RECOIL_DISTANCE = 0.12;

    for (const block of this.model.objects) {
      if (!block.isTurret) continue;

      block._shootTimer = Math.max(0, block._shootTimer - dt);
      block._recoilTimer = Math.max(0, (block._recoilTimer ?? 0) - dt);

      const recoilT = Math.max(0, Math.min(1, block._recoilTimer / RECOIL_DURATION));
      block.renderOffset[0] = 0;
      block.renderOffset[1] = -RECOIL_DISTANCE * recoilT;

      if (!wantsShoot || block._shootTimer > 0) continue;

      this.shootFromTurret(block);
      block._shootTimer = block.shootCooldown;
      block._recoilTimer = RECOIL_DURATION;
    }

    if (this.scoreTimer <= 0) {
      this.score++;
      this.scoreTimer = 3;
    }
  }

  onPositionChange() {
    this.proxyCollider.onPositionChange();
    this.shapeCollider.onPositionChange();

    this.setCurrentChunk();
  }

  onBroadCollision(other) {
    return true;
  }

  onNarrowCollision(other) {
    return true;
  }

  // prettier-ignore
  showDetails() {
    const ttip = this.game.tooltip;
    if (ttip.showTemplate(this, ttip.template.PARENT_INFO, this.game.frameId)) return;

    const t = ttip.template.PARENT_INFO;
    t.position.textContent = this.position;
    t.velocity.textContent = this.velocity;
    t.rotation.textContent = this.rotation;
    t.mass.textContent = this.mass;
    t.CoM.textContent = this.CoM;

    ttip.show();
  }

  // prettier-ignore
  detachBlock(object) {
    const mouse = this.game.mouse;

    if (mouse.isDown && !mouse.dragged && object.isRemovable && !object.toRemove) {
      const [ox, oy] = object.localPosition;

      const target = this.model.objects.find(
        (b) => b === object || (b.localPosition[0] === ox && b.localPosition[1] === oy),
      );
      if (!target || !target.isRemovable || target.toRemove) return;

      let dirs = 0;

      // prettier-ignore
      for (const { localPosition: [x, y] } of this.model.objects) {
        if (ox + 1 === x && oy === y) dirs++;
        else if (ox - 1 === x && oy === y) dirs++;
        else if (ox === x && oy + 1 === y) dirs++;
        else if (ox === x && oy - 1 === y) dirs++;
      }

      if (dirs >= 4) return;

      const core = this.model.objects.find(b => !b.isRemovable);
      if (!core) return;

      const isLeafBlock = (block) =>
        block?.isTurret || block?.isThruster || block?.type === Type.THRUSTER;

      const findPrimaryAnchor = (leafBlock) => {
        const [lx, ly] = leafBlock.localPosition;
        for (const candidate of this.model.objects) {
          if (!candidate || candidate === leafBlock) continue;
          if (isLeafBlock(candidate)) continue;

          const [cx, cy] = candidate.localPosition;
          if (Math.abs(cx - lx) + Math.abs(cy - ly) !== 1) continue;

          return candidate;
        }

        return null;
      };

      const connected = new Set();
      const queue = [core];
      connected.add(core);

      while (queue.length) {
        const current = queue.shift();
        // Turrets and thrusters are leaf-only: they don't extend structural connectivity
        if (current.isTurret || current.isThruster || current.type === Type.THRUSTER) continue;
        const [cx, cy] = current.localPosition;

        for (const neighbor of this.model.objects) {
          if (neighbor === target || connected.has(neighbor)) continue;
          if (isLeafBlock(neighbor)) continue;
          const [nx, ny] = neighbor.localPosition;
          if (Math.abs(cx - nx) + Math.abs(cy - ny) === 1) {
            connected.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      const [px, py] = this.position;
      const _b = this.game.buffer;

      const bblock = new BuildingBlock({
        game: this.game,
        model: new Model([target], Model.COPY_MODE.COPY),
        x: px + ox,
        y: py + oy,
        vx: this.velocity[0],
        vy: this.velocity[1],
      });

      target.toRemove = true;
      vec2.copy(bblock.position, mouse.position);
      this.game.buildingBlocks.add(bblock);

      for (const detached of this.model.objects) {
        if (!detached || detached === target || detached.toRemove) continue;

        if (connected.has(detached)) continue;

        if (isLeafBlock(detached)) {
          const anchor = findPrimaryAnchor(detached);
          if (anchor && anchor !== target && !anchor.toRemove && connected.has(anchor)) {
            continue;
          }
        }

        const [lx, ly] = detached.localPosition;
        const wPos = vec2.set(_b.vec2_1, lx, ly);
        vec2.rotate(wPos, this.rotation);
        const wx = wPos[0] + px;
        const wy = wPos[1] + py;

        const dblock = new BuildingBlock({
          game: this.game,
          model: new Model([detached], Model.COPY_MODE.COPY),
          x: wx,
          y: wy,
          vx: this.velocity[0],
          vy: this.velocity[1],
        });

        detached.toRemove = true;
        this.game.buildingBlocks.add(dblock);
      }

      const geometryChanged = this.model.clear();
      if (geometryChanged) {
        this.onGeometryChange();
      }
    }
  }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) {
      if (this.game.mouse.isDown) {
        this.detachBlock(object);
        return;
      }

      this.showDetails();
      object.showDetails(this);
      return;
    }

    const other = collision.a?.parent?.parent === this ? collision.b.parent : collision.a.parent;
    const source = other?.parent ?? other;

    if (source?.is?.(Type.PROJECTILE)) {
      if (source.owner === this) return;

      if (typeof object?.health === "number") {
        const damage = Number(source.dmg ?? 0);
        if (damage <= 0) return;

        object.health -= damage;
        if (object.health <= 1) object.health = 0;

        if (!object.isRemovable && object.health <= 0) {
          this.detachRemainingBlocks();
          this.model.clear();
          this.setState(GlobalState.DEAD);
          return;
        }

        const geometryChanged = this.model.clear();
        if (geometryChanged) {
          const coreGone = !this.model.objects.some(b => b && !b.isRemovable);
          if (coreGone) {
            this.detachRemainingBlocks();
            this.model.clear();
            this.setState(GlobalState.DEAD);
            return;
          }
          if (this.detachDisconnectedBlocks()) this.model.clear();
          this.onGeometryChange();
        }
      }
      return;
    }

    if (!this.hasState(GlobalState.DEAD) && typeof object?.health === "number" && object.health <= 0) {
      if (!object.isRemovable) {
        this.detachRemainingBlocks();
        this.model.clear();
        this.setState(GlobalState.DEAD);
        return;
      }

      const geometryChanged = this.model.clear();
      if (geometryChanged) {
        const coreGone = !this.model.objects.some(b => b && !b.isRemovable);
        if (coreGone) {
          this.detachRemainingBlocks();
          this.model.clear();
          this.setState(GlobalState.DEAD);
          return;
        }
        if (this.detachDisconnectedBlocks()) this.model.clear();
        this.onGeometryChange();
      }
    }
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
        model: new Model([block], Model.COPY_MODE.COPY),
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

    const isLeafBlock = (block) =>
      block?.isTurret || block?.isThruster || block?.type === Type.THRUSTER;

    const findPrimaryAnchor = (leafBlock) => {
      const [lx, ly] = leafBlock.localPosition;
      for (const candidate of this.model.objects) {
        if (!candidate || candidate === leafBlock || candidate.toRemove) continue;
        if (isLeafBlock(candidate)) continue;

        const [cx, cy] = candidate.localPosition;
        if (Math.abs(cx - lx) + Math.abs(cy - ly) !== 1) continue;

        return candidate;
      }

      return null;
    };

    const connected = new Set();
    const queue = [core];
    connected.add(core);

    while (queue.length) {
      const current = queue.shift();
      // Turrets and thrusters are leaf-only: they don't extend structural connectivity
      if (current.isTurret || current.isThruster || current.type === Type.THRUSTER) continue;
      const [cx, cy] = current.localPosition;

      for (const neighbor of this.model.objects) {
        if (neighbor.toRemove || connected.has(neighbor)) continue;
        if (isLeafBlock(neighbor)) continue;

        const [nx, ny] = neighbor.localPosition;
        if (Math.abs(cx - nx) + Math.abs(cy - ny) !== 1) continue;

        connected.add(neighbor);
        queue.push(neighbor);
      }
    }

    let detachedAny = false;
    for (const block of this.model.objects) {
      if (!block?.isRemovable || block.toRemove || connected.has(block)) continue;

      if (isLeafBlock(block)) {
        const anchor = findPrimaryAnchor(block);
        if (anchor && !anchor.toRemove && connected.has(anchor)) continue;
      }

      const [lx, ly] = block.localPosition;
      const wx = this.position[0] + lx * Math.cos(this.rotation) - ly * Math.sin(this.rotation);
      const wy = this.position[1] + lx * Math.sin(this.rotation) + ly * Math.cos(this.rotation);

      const driftX = this.velocity[0] + (Math.random() * 2 - 1) * 0.45;
      const driftY = this.velocity[1] + (Math.random() * 2 - 1) * 0.45;

      const detached = new BuildingBlock({
        game: this.game,
        model: new Model([block], Model.COPY_MODE.COPY),
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
  resolvePenetration(other, collision, epsilon, direction) {
    if (other.is(Type.BUILDING_BLOCK)) return;

    vec2.addScaled(this.position, this.position, collision.normal, this.getDefaultPenetrationCorrection(other, collision, epsilon) * direction);
  }
}
