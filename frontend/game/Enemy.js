/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Enemy.js
 * Szerep: AI-vezerelt hajo kovetesi, hajtomu- es loveslogikaval.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
    // Betolteskor ugyanazokat az alap mozgas- es viselkedesadatokat allitjuk vissza, mint amikkel mentve lett az enemy.
    const enemy = new Enemy({
      type: saved.type,
      game,
      model: recoveredModel,
      maxSpeed: saved.maxSpeed,
      turnRate: saved.turnRate,
      behavior: saved.behavior ?? "aggressive",
      difficulty: saved.difficulty ?? 1,
    });

    if (saved.state) {
      enemy.state = new Uint32Array(saved.state);
    }

    const enemyRotation = saved.rotation ?? 0;
    enemy.rotation = enemyRotation;
    enemy.previousRotation = enemyRotation;
    vec2.set(enemy.forward, 0, 1);
    vec2.rotate(enemy.forward, enemyRotation);
    vec2.normalize(enemy.forward, enemy.forward);
    vec2.copy(enemy.previousForward, enemy.forward);

    enemy.teleportTo(saved.position[0], saved.position[1]);
    enemy.onRotationChange();
    enemy.onPositionChange();

    return enemy;
  }

  // prettier-ignore
  constructor({ game, model, x, y, maxSpeed, turnRate, behavior = "aggressive", difficulty = 1 } = {}) {
    super({ type: Type.ENEMY, game, model, x, y, vx: 0, vy: 0, maxSpeed });
    // Ezekbol a mezokbol dolgozik kesobb az AI: hogyan viselkedjen, milyen eros legyen, es milyen gyakran valasszon uj iranyt.
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
    // Az enemy egyedi AI beallitasait is hozzacsapjuk az altalanos spaceship mentesehez.
    return {
      ...super.exportSave(),
      turnRate: this._turnRate,
      behavior: this.behavior,
      difficulty: this.difficulty,
    };
  }

  // hang lejátsz
  onShoot() {
    this.game.audioManager.getSound("lasershootsound")?.instance?.play?.();
  }

  // onProjectileHit esemény, ha játékos lövedéke provoked = true
  onProjectileHit(projectile) {
    if (projectile?.owner?.is?.(Type.PLAYER)) this.provoked = true;
  }

  // új listát a thruserekről elment this._thrusterCache-be és visszaadja
  getThrusters() {
    if (!this._thrusterCache)
      // A thrusterlista csak akkor epul ujra, ha meg nincs cache-ben, igy update kozben nem kell ujra es ujra szurni a teljes modellt.
      this._thrusterCache = this.model.objects.filter(
        (obj) => obj instanceof Thruster,
      );
    return this._thrusterCache;
  }

  // prettier-ignore
  // erőt kifejti + trail spawn
  fireThrusters() {
    const _b = this.game.buffer;
    for (const thruster of this.getThrusters()) {
      const tv = vec2.copy(_b.vec2_1, thruster.getThrustVector());
      vec2.rotate(tv, this.rotation);
      this.netForce.apply(_b.force_1.setFromMagDir(thruster.getThrust(), tv));
      this.spawnThrusterTrail(thruster); //! folyamatosan spawnol, nem csak amikor elindul a hajtómű!!!!!
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

  // alpha ami a t változós fadeIn, out megoldás
  //! alpha is limiten in between 0 and 1
  // szín választás az enemy difficultyja alapján
  getTrailColor(alpha) {
    const grade = Math.max(0, Math.min(14, this.difficulty - 1));
    const base =
      BlockStyle.GRADE_COLORS[grade] ||
      BlockStyle.GRADE_COLORS[0] ||
      "rgba(197, 197, 197, 1)";
    if (typeof base === "string" && base.startsWith("rgba(")) {
      return base.replace(/,\s*1\)$/, `, ${Math.max(0, Math.min(1, alpha))})`); // replace the alpha part in the string
    }
    return `rgba(197, 197, 197, ${Math.max(0, Math.min(1, alpha))})`;
  }

  spawnThrusterTrail(thruster) {
    // vissza ha nincs thruster vagy kicsit a throttle (alig megy)
    if (!thruster || thruster.throttle <= 0.01) return;

    const _b = this.game.buffer;
    const [px, py] = this.position;
    const [lx, ly] = thruster.localPosition;

    //! thrust vector nem az exhaust direction, hanem az erő iránya ami hat a űrhajóra
    //! default thrust vector: [0, 1] (y-on felfele mutat)
    //! tehát nem forgott hajó esetén [lx - 0, ly - 0.2] a mount pos, vagyis 0.2-vel a thruster blokk középpontja alatt van
    const mountPos = vec2.set(
      _b.vec2_1,
      lx - thruster.thrustVector[0] * 0.2,
      ly - thruster.thrustVector[1] * 0.2,
    );

    // elforgatjuk mount pos-t az entity forgottságával
    //! hiányérzetünk lehet hogy nem tesszük ezt teljesen world positionné, de ezt a push-nál
    //! megtesszük (px + mountPos[0] és py + mountPos[1])
    vec2.rotate(mountPos, this.rotation);

    // ha több az aktív particle mint a max a legrégebbit eldurrantjuk
    if (this.trailParticles.length >= this.maxTrailParticles) {
      this.trailParticles.shift();
    }

    // új particle-t spawnolunk
    this.trailParticles.push({
      source: thruster,
      x: px + mountPos[0], // immár teljes world pos
      y: py + mountPos[1], // immár teljes world pos
      age: 0,
      life: 0.75,
      maxLife: 0.75,
      lineWidth: 2.2 + thruster.throttle * 1.2, // nagyobb throttle -> szélesebb vonal
    });
  }

  updateThrusterTrail(dt) {
    //! visszafele megyün, mert lehet splice lesz így nem skippelünk egy itemet se!!
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.age += dt; // eddig értelmetlen a szerepe, mert a life-t ellenőrizzük
      p.life -= dt; // csökentjük a life-t
      // ha nulla töröljük a particle-t
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
    const cx =
      game.player.previousPosition[0] +
      (game.player.position[0] - game.player.previousPosition[0]) * alpha;
    const cy =
      game.player.previousPosition[1] +
      (game.player.position[1] - game.player.previousPosition[1]) * alpha;

    ctx.save();
    ctx.globalCompositeOperation = "source-over"; // ez a default, megmondja hogy az új pielek hogy kerülnek a régiekre, az új a régi felé megy, normális alfa egybemosással, (valszeg visszaállításra kerül, mert mondjuk glow effekthez meg lett változtatva)
    ctx.lineCap = "round"; // vonalak végét lekerekíti, vagyis a moveTo-s végét és az utolsó lineTo-nél lévő véget, kanyarodások itt még maradnak szögletesek
    ctx.lineJoin = "round"; // megcsinálja amit a lineCap nem csinált, de ez önmagában hagyja a vonal kezdetét és végét úgy ahogy van

    //! a trail itt nem csak egy vonal tehát egy adott hajtóműhöz több trail darab tartozik
    //! ezért van groupolás

    const groups = new Map();
    const FADE_IN_DURATION = 0.1;

    // trail particlek groupolása source alapján (source maga a hajtómű)
    // a groups Map-en a key egy Thruster class példány a kulcs egy lista
    // amin azok az objectek vannak amit pusholunk a spawnThrusterTrail függvénnyel
    for (const p of this.trailParticles) {
      if (!groups.has(p.source)) groups.set(p.source, []);
      groups.get(p.source).push(p);
    }

    // trail objecteken végig
    for (const points of groups.values()) {
      if (points.length < 2) continue; // ha kettőnél kevesebb van tovább
      // ez azért van mert lent i és i-1 indexen lévőket keresünk, ha csak 1 van nincs i - 1 error lenne

      // összeköti a trail darabokat vonallal
      // *-*-* (* nincs rajzolva csak jelzi a trail darabokat, de azok külön nem látszanak!!!)
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]; // trail darab 1 - feltehetően régebbi
        const b = points[i]; // trail darab 2 - feltehetően újabb

        // mennyi életük, van
        // kezdetben life és maxLife egyenlő, life később csökken
        // kezdetben life/maxLife = 1, majd kisebb lesz, vagyis Math.min nem 1-et hanem life/maxLife-ot ad vissza
        // a Math.max biztonsági megoldás, ha life <= 0 törölve lesz a particle a updateThrusterTrail függvényben, Math.max garantálja ne legyen az érték 0
        // aOut és bOut vagyis egyre kisebb minél több ideje él a particle
        // aOut és bOut 0-hoz tart
        const aOut = Math.max(0, Math.min(1, a.life / a.maxLife));
        const bOut = Math.max(0, Math.min(1, b.life / b.maxLife));

        // age folyamatosan nő!!!
        // FADE_IN_DURATION = 0.1; alapból
        // vagyis age minél nagyobb aIn és bIn annál nagyobb, max persze 1 lehet az értékük
        // aIn és bIn 1-hez tart
        const aIn = Math.max(0, Math.min(1, a.age / FADE_IN_DURATION));
        const bIn = Math.max(0, Math.min(1, b.age / FADE_IN_DURATION));

        // szegmens opacity-je két trail particle között
        // min(aOut, bOut), a szegmens opacityje limitálva van a halálhoz legközelebbi particle által
        // min(aIn, bIn): aIn, bIn 0-ról 1-re emelkedik az első 0.1 másodperc alatt
        // t particle születéskor 0 (mert out-ok 1-ek, de in-ek 0-ák)
        // 1-nél tetőzik a particlek élettartamuk közepén
        // majd visszaesik 0-ra amikor halálhoz közel vannak
        // vagyis t ad egy fade-in fade-out effektet

        // time	  age   life	aIn (age/0.1)	aOut (life/0.75)	t (aIn × aOut)
        // 0.00s  0.00  0.75  0.00          1.00              0.00
        // 0.05s  0.05  0.70  0.50          0.93              0.47
        // 0.10s  0.10  0.65  1.00          0.87              0.87
        // 0.20s  0.20  0.55  1.00          0.73              0.73
        // 0.40s  0.40  0.35  1.00          0.47              0.47
        // 0.65s  0.65  0.10  1.00          0.13              0.13
        // 0.75s  0.75  0.00  1.00          0.00              0.00

        // 0→0.1s: aIn is climbing from 0 to 1, pulling t up — the fade-in phase
        // 0.1s: aIn hits 1 and stays there, now only aOut drives t
        // 0.1→0.75s: aOut steadily drains as life decreases — the fade-out phase
        // 0.75s: particle is deleted

        //! jól látjuk tehát hogy kezdetben az aIn limitál, a végén pedig az aOut
        //! középen tetőzik a t érték
        //! értékek alapján gyorsabb fade in, lasabb fade out, fade in 0.1s, fade out a maradék 0.65s
        const t = Math.min(aOut, bOut) * Math.min(aIn, bIn);

        const ax = (a.x - cx) * ppuX + W * 0.5; // trail a rész x canvas pos
        const ay = H * 0.5 - (a.y - cy) * ppuY; // trail a rész y canvas pos
        const bx = (b.x - cx) * ppuX + W * 0.5; // trail b rész x canvas pos
        const by = H * 0.5 - (b.y - cy) * ppuY; // trail b rész y canvas pos

        // minimum opacity 0.08
        // maximum opacity 0.56
        ctx.strokeStyle = this.getTrailColor(0.08 + 0.48 * t); // vonal színe

        ctx.lineWidth = Math.max(1.8, (a.lineWidth + b.lineWidth) * 0.5);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // átállítja a this.rotation-t + !!!! a forward-ot is forgatja
  setFacingRotation(rotation) {
    const _b = this.game.buffer;
    // A forgatas onmagaban nem eleg: a forward vektornak is ugyanabba az iranyba kell mutatnia, mert a mozgas es loves ezt hasznalja.
    this.rotation = rotation;
    mat2.fromRotation(_b.mat2_1, this.rotation);
    vec2.set(this.forward, 0, 1);
    vec2.transformMat2(this.forward, _b.mat2_1, this.forward);
    vec2.normalize(this.forward, this.forward);
  }

  // ?
  turnTowardAngle(targetRotation, dt) {
    // Nem ugrik rogton a celiranyba, hanem a fordulasi sebesseg altal megengedett kis lepessel kozelit.
    const angleDiff = getAngleDiff(targetRotation, this.rotation); // legkisebb távolság két szög között
    const maxStep = this._turnRate * dt; // turnRate valszeg per secondben van szoval *dt megadja mennyit fordulhat egy frame alatt
    const clampedStep = Math.max(-maxStep, Math.min(maxStep, angleDiff)); // clamp angleDiff maxStephez
    this.setFacingRotation(this.rotation + clampedStep); // fordítja mind this.forward-ot és beállítja this.rotation-t
    return Math.abs(angleDiff) <= maxStep; //igaz, ha angleDiff kisebb mint maxStep, vagyis igaz ha teljesen elfordult a kívánt irányba
  }

  /**
   * új listát ad vissza a turret blokkokkal
   */
  getTurretBlocks() {
    return this.model.objects.filter((b) => b.isTurret);
  }

  /**
   * visszaadja a játékos positionét, ami a model center, vagyis ott van a mag blokk
   */
  getPlayerCorePosition() {
    return this.game.player.position;
  }

  /**
   * out-ba bemásolja a turret world positionét
   *
   * sorrend fontos!
   * ha utoljára forgatnánk, akkor nem world 0,0 körül forgatnánk!!!!
   */
  getTurretWorldPosition(turretBlock, out) {
    vec2.copy(out, turretBlock.localPosition);
    vec2.rotate(out, this.rotation);
    vec2.add(out, out, this.position);
    return out;
  }

  /**
   * visszaad egy vektort, ami az első szomszédos blokktól (manhatten táv) mutat
   * a turret blokk felé
   */
  getTurretLocalDirection(turretBlock, out) {
    vec2.set(out, 0, 1);

    if (!turretBlock) return out;

    const [tx, ty] = turretBlock.localPosition;
    for (const neighbor of this.model.objects) {
      if (!neighbor || neighbor === turretBlock) continue;

      const dx = tx - neighbor.localPosition[0];
      const dy = ty - neighbor.localPosition[1];
      if (Math.abs(dx) + Math.abs(dy) !== 1) continue; // manhatten táv, ha nincs mellette a blokk skip

      // amint találunk egyet ami mellette van block, előjeles távot berakjuk out-ba és visszaadjuk
      return vec2.set(out, dx, dy); // ha turrent másik blokk felett van +, ha alatt - az y, x esetén bal - jobb +
    }

    return out; // default 0,1 alaphelyzetben fel-t jelent
  }

  // hsl(hue, saturation, lightness)
  getTurretBulletColor(block) {
    const hue = 205 - Math.max(0, Math.min(14, block.gradeID ?? 0)) * 10; // color wheel position
    // 0 fok - red
    // 60 fok - yellow
    // 120 fok - green
    // 180 fok - cyan
    // 240 fok - blue
    // 300 fok magenta

    //! hue = 205 - gradeID * 10
    // max gradeID * 10 = 140 -> 205 - 240 -> yellow
    // min gradeID * 10 =   0 -> 205 -   0 -> cyan/blue

    // magassabb gradeID-jű blokkok (turretek) sárgásabbat lőnek, a kevésbé magasak kékeseket

    return `hsl(${hue} 100% 62%)`;
  }

  /**
   * végigmegy a model összes turretjén és kiválasztja a köviket:
   *
   * turrets - this.model.objects-ből azok amik .isTurret = true-k
   * minDistance - legkisebb turret-player távolság
   * maxRange - legnagyobb turret.bulletRange
   */
  getTurretRangeStats(playerCore) {
    const _b = this.game.buffer;
    const turrets = this.getTurretBlocks();
    // Az AI egyszerre akarja tudni, mennyire van kozel a celpont, es mekkora lotavval dolgozhat a legerosebb turret.
    let minDistance = Infinity,
      maxRange = 0;
    for (const turret of turrets) {
      this.getTurretWorldPosition(turret, _b.vec2_1);
      const d = Math.hypot(
        _b.vec2_1[0] - playerCore[0],
        _b.vec2_1[1] - playerCore[1],
      );
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
    if (source?.is?.(Type.PROJECTILE))
      return source.owner?.is?.(Type.PLAYER) ?? false;

    return false;
  }

  aim(targetPosition, dt) {
    // Eloszor iranyvektort kepzunk a cel fele, utana ezt alakitjuk at olyan szogge, amit a turnTowardAngle mar kezelni tud.
    const toTarget = vec2.create();
    vec2.sub(toTarget, targetPosition, this.position);
    if (vec2.len(toTarget) === 0) return false;
    vec2.normalize(toTarget, toTarget);
    const rotation = Math.atan2(toTarget[1], toTarget[0]) - Math.PI / 2;
    return this.turnTowardAngle(rotation, dt);
  }

  shootFromTurret(turretBlock, playerCorePosition) {
    const _b = this.game.buffer;
    const localDirection = this.getTurretLocalDirection(turretBlock, _b.vec2_1);

    // A loveshez a turret blokk helyi koordinataibol indulunk ki, majd ezt visszuk at vilagkoordinataba.

    // turret pos + fél blokk
    // localDirection komponense lehet +,- is szóval irányfüggő a muzzle
    const localMuzzle = vec2.set(
      _b.vec2_2,
      turretBlock.localPosition[0] + localDirection[0] * 0.5,
      turretBlock.localPosition[1] + localDirection[1] * 0.5,
    );

    // muzzle eddig úgy volt számolva hogy a model alap pozícióban volt, szóval forgatunk
    vec2.rotate(localMuzzle, this.rotation);

    // eddig localPosition volt használva, most világba transzformálunk
    vec2.add(localMuzzle, localMuzzle, this.position);

    // itt localMuzzle nem local hanem worldMuzzle
    // táv a játékos magtól
    const distanceToCore = Math.hypot(
      localMuzzle[0] - playerCorePosition[0],
      localMuzzle[1] - playerCorePosition[1],
    );

    // ha messzebb van mint a range vissza!
    if (distanceToCore > (turretBlock.bulletRange ?? 0)) return;

    // _b.vec2_1-ből _b.vec2_3-ba másoljuk a localDirection-t
    const direction = vec2.copy(_b.vec2_3, localDirection);

    // elforgatjuk a localDirection-t az entitás forgottságával
    vec2.rotate(direction, this.rotation);

    // normalizáljuk
    // feltételezhetően amúgy is vagy 0,1 vagy 1,0 hisz manhatten távot számolunk, ami csak akkor 1 ha max az egyik 1
    // emiatt lehet értelmetlen ez
    vec2.normalize(direction, direction);

    const projectile = new Projectile({
      game: this.game,
      x: localMuzzle[0], // honnan indul? worldMuzzle
      y: localMuzzle[1], // honnan indul? worldMuzzle
      vx: turretBlock.bulletSpeed, // speedet turret adja
      vy: turretBlock.bulletSpeed, // speedet turre tadja
      direction, // irány, ami a turret.localPos mínusz turrethez első [manhatten 1] távra levő block localPosa
      dmg: turretBlock.bulletDamage, // projectile dmg turrettől jön
      range: turretBlock.bulletRange, // projectile range turrettől jön
      owner: this, // tulaj ez az entitás
      color: this.getTurretBulletColor(turretBlock), // projectile color turrettől jön
    });

    this.game.projectiles.add(projectile);

    this.onShoot(); // hang lejátsz

    // this.shootCooldown = cooldown;
  }

  // maradék blokk lecsatolása (legyilkolás előtt)
  detachRemainingBlocks() {
    // Megsemmisuleskor a megmaradt blokkokat kulon lebego targgyal alakitjuk, hogy lootkent vagy epitoelemkent tovabb elhessenek.
    for (const block of this.model.objects) {
      if (!block?.isRemovable || block.toRemove) continue;

      const [lx, ly] = block.localPosition;

      // world x
      // rotation matrix nelkuli manual forgatassal
      const wx =
        this.position[0] +
        lx * Math.cos(this.rotation) -
        ly * Math.sin(this.rotation);

      // world y
      // rotation matrix nelkuli manual forgatassal
      const wy =
        this.position[1] +
        lx * Math.sin(this.rotation) +
        ly * Math.cos(this.rotation);

      // blokk tavolodasi sebesseg az entitas sebessege + meg kicsi
      const driftX = this.velocity[0] + (Math.random() * 2 - 1) * 0.45;
      const driftY = this.velocity[1] + (Math.random() * 2 - 1) * 0.45;

      // uj floating block letrehozasa
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

  // azon blokkok lecsatolasa, akiknek a kapcsolata megszunt az entitassal mert egy
  // kozbeeso blokk eldurrant
  /**
   *
   * @returns {Boolean} - detached any?
   */
  detachDisconnectedBlocks() {
    // core blokk megkeres
    // core blokk: nem eltávolítható és nincs eltávolítás alatt (mondjuk eddig hp-ja is 0 volt)
    const core = this.model.objects.find(
      (block) => !block?.isRemovable && !block.toRemove,
    );
    if (!core) return false; // nincs core blokk vissza, mert core-hoz nézzük a kapcsolatokat

    const connected = new Set();
    const queue = [core];
    connected.add(core);

    // breadth-first search
    // itt a gráf a hajó modellje
    // cél: találjunk meg minden blokkot amit el lehet érni a core blokktól úgy hogy nem ugrunk át üres teret, vagyis találjunk meg minden kapcsolódó blokkot

    /**
     * Legrégebbi blokkot lefesszük (.shift())
     * megnézzük a modell blokkjait, majd ha ennek a blokknak szomszédjai felraktjuk a connected-re, hisz el lehet őket érni, illetve felrakjuk üket a queue-ra, hogy az ő szomszédjaik is meg legyenek vizsgálva
     * ez folytatódik utána a queue-n lévő kövi blokkal
     */
    while (queue.length) {
      const current = queue.shift();
      // Turrets and thrusters are leaf-only: they don't extend structural connectivity
      if (current.isTurret || current.isThruster || current instanceof Thruster)
        continue;
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
      // ha konnekted, vagy ha nem eltavolitható, vagy ha eltavolitas alatt van skip
      if (!block?.isRemovable || block.toRemove || connected.has(block))
        continue;

      //! ugyanaz a logika mint a detachRemainingBlocks-ban
      const [lx, ly] = block.localPosition;
      const wx =
        this.position[0] +
        lx * Math.cos(this.rotation) -
        ly * Math.sin(this.rotation);
      const wy =
        this.position[1] +
        lx * Math.sin(this.rotation) +
        ly * Math.cos(this.rotation);

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
    //! aggresszív - mindig támad ha lát
    //! neutrális - csak ha provokálva van és lát
      const engage = turrets.length > 0 &&
      (this.behavior === "aggressive" ? canSeeTarget :
       this.behavior === "neutral" ? (this.provoked && canSeeTarget) : false);
    if (engage) {
      this.aim(target, dt);
      const desiredRange = maxRange * 0.92; // ?
      if (minDistance > desiredRange) this.fireThrusters(); //! ha a rangen kívül van felé megy
      for (const turret of turrets) {
        turret._shootTimer = Math.max(0, (turret._shootTimer ?? 0) - dt); // csökkentjük a shootTimer-t
        if (turret._shootTimer > 0) continue; // ha nem 0 a timer, nem tud lőni, tehát skip
        this.shootFromTurret(turret, target); // lövünk a turretból
        turret._shootTimer = turret.shootCooldown; // löttünk tehát cooldown vissza
      }
    } else {
      // ha nincs engage csak vándorol tovább
      this._wanderTimer -= dt;

      // ha eleget vándorolt egy irányba akkor új irány és timer reset
      if (this._wanderTimer <= 0) {
        const currentHeading = this.rotation + Math.PI / 2; // semmi értelme hozzáadni pi/2-t, vagyis az egész változó értelmetlen
        const headingJitter = (Math.random() * 2 - 1) * (Math.PI / 5); // random szög +-36 fokban, csak ez ami módosítja a this._wanderAngle-t
        this._wanderAngle = currentHeading + headingJitter;
        this._wanderTimer = 4 + Math.random() * 4; // min 4, max 8 -> új wander irány 4-8 mp-nként
      }

      // wander irányba fordul és megy
      //! -Math.PI/2 értelmetlen!!! _wanderAngle a 487-edik sorban van kiszámolva
      //! currentHeading-ból, amihez hozzáadunk Math.PI/2-t, szóval a kettő kiüti egymást, semmi értelme
      this.turnTowardAngle(this._wanderAngle - Math.PI / 2, dt); // ? miért - pi / 2
      this.fireThrusters();
    }
    this.updateVelocity();
    this.updatePosition();
    this.updateThrusterTrail(dt);
  }

  onBroadCollision(other) {
    return true;
  }
  onNarrowCollision(other) {
    return true;
  }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) {
      object.showDetails(this);
      return;
    }
    const other =
      collision.a?.parent?.parent === this
        ? collision.b.parent
        : collision.a.parent;
    const source = other?.parent ?? other;
    const otherBlock =
      collision.a?.parent?.parent === this
        ? collision.b?.model?.objects?.[0]
        : collision.a?.model?.objects?.[0];

    if (source?.is?.(Type.PROJECTILE)) {
      if (source.owner?.is?.(Type.PLAYER)) this.provoked = true;
      if (typeof object?.health === "number") {
        object.health -= source.dmg ?? 0;
      }
    } else if (source?.is?.(Type.BUILDING_BLOCK)) {
      return;
    } else if (
      typeof object?.health === "number" &&
      typeof otherBlock?.health === "number"
    ) {
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

    const isCoreBlock = !object.isRemovable && object.health <= 0; // ha a kontakt-ban ez az entitás core blokkja vett részt leölni
    const killedByPlayer = this.isPlayerDamageSource(other);
    const geometryChanged = this.model.clear();

    // ha coreBlock került kontakba elpusztit
    if (isCoreBlock) {
      this.detachRemainingBlocks();
      this.model.clear();
      if (killedByPlayer && this.game.player) {
        const base = 100 + 100 * this.difficulty;
        const mult =
          this.behavior === "aggressive" || this.behavior === "rammer"
            ? 3
            : this.behavior === "neutral"
              ? 2
              : 1;
        this.game.player.score += base * mult;
      }
      this.setState(GlobalState.DEAD);
      return;
    }

    // ha model változott
    if (geometryChanged) {
      // mivel a model változott, lehet blokkok kapcsolata megszűnt, elszakadt blokkok lecsatolása itt ezért
      if (this.detachDisconnectedBlocks()) {
        this.model.clear();
      }

      this._thrusterCache = null; // geometry módosult, null-oljuk hogy újra legyen számolva

      this.proxyCollider.onGeometryChange();
      this.shapeCollider.onGeometryChange();

      // ha nincs object modellben leölni
      if (this.model.objects.length === 0) {
        this.setState(GlobalState.DEAD);
        return;
      }

      // ? ellenőrzés talán arra hogy van-e még core-blokk, ha nincs akkor leöl
      if (!this.model.objects.some((b) => b?.isRemovable && !b.toRemove)) {
        this.detachRemainingBlocks(); // maradék blokkot ledob
        this.model.clear();
        if (killedByPlayer && this.game.player) {
          const base = 100 + 100 * this.difficulty;
          const mult =
            this.behavior === "aggressive" || this.behavior === "rammer"
              ? 3
              : this.behavior === "neutral"
                ? 2
                : 1;
          this.game.player.score += base * mult;
        }
        this.setState(GlobalState.DEAD);
      }
    }
  }
}
