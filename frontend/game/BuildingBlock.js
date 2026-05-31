/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/BuildingBlock.js
 * Szerep: Epites kozben hasznalt blokk logika kapcsolodasi es forgatasi segedekkel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";
import Collidable from "/game/Collidable.js";
import Player from "/game/Player.js";
import Rigidbody from "/game/Rigidbody.js";
import { getAngleDiff, isAdjacent } from "/common/common.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";

export default class BuildingBlock extends Rigidbody {
  static DESPAWN_AFTER_SECONDS = 30;
  static SNAP_ARM_SECONDS = 0.18;
  static SNAP_CENTER_TOLERANCE = 0.2;
  static SNAP_CENTER_TOLERANCE_TURRET = 0.49;
  static SNAP_CURSOR_DIST_MAX = 0.5;
  static SNAP_CURSOR_DIST_MAX_TURRET = 0.9;

  // prettier-ignore
  constructor({ game, model, parent = null, x = 0, y = 0, vx = 0, vy = 0 } = {}) {
    if (model.objects.length > 1) {
      throw new Error("BUILDINGBLOCK-constructor: The length of the model must not be greater than one!");
    }

    vec2.reset(model.objects[0].localPosition);

    super({ type: Type.BUILDING_BLOCK, game, model, x, y, vx, vy, maxSpeed: 1 });

    this.id = game.idManager.get();
    this.model.init(this);

    // Detached pickups should use a tighter broad-phase circle.
    this.halfDiagonal = 0.5;
    this.proxyCollider.onGeometryChange();
    this.proxyCollider.validate();

    this.contextMenuTemplate = game.contextMenu.template.ENEMY_CONTEXT_MENU;

    // snapCooldown 15-re állítása konstruktorban, vagyis amikor lecsatlakozik a blokk, akkor egyből megkapja
    // ezzel elkerülhető, hogy a játékos által lecsatlakoztatott blokkok egyből visszacsatlakozzanak
    this.snapCooldown = 15;
    this.lifeTime = 0;
    this.dragSnapElapsed = 0;
  }

  update() {
    this.rotation = 0;

    // snapCooldown csökkentése, framenként 1-gyel, vagyis a 15, 15 frameig tart ki
    if (this.snapCooldown > 0) this.snapCooldown--;

    // ha dragelve, lifeTime-ot resetelni
    if (this.isDragged()) {
      this.lifeTime = 0;
    }

    this.lifeTime += this.game.fdt; // resetelve, amikor dragelés kezdődik
    // ha legalább BuildingBlock.DESPAWN_AFTER_SECONDS ideig nem volt hozzányúlva, megölni
    if (this.lifeTime >= BuildingBlock.DESPAWN_AFTER_SECONDS) {
      this.setState(GlobalState.DEAD);
      return;
    }

    this.updateVelocity();
    this.updatePosition();
  }

  onGeometryChange() {
    super.onGeometryChange();
    // ha üres a model, leöl
    if (this.model.objects.length === 0) {
      this.setState(GlobalState.DEAD);
    }
  }

  onBroadCollision(other) {
    if (this.isDragged()) {
      // ha játékos BC-jében van a játékos modelljével egy irányba csavarjuk (jobban lássa hogy igazítsa)
      if (other.is(Type.PLAYER)) {
        this.rotation = getAngleDiff(other.rotation, this.rotation);
        return true;
      }

      return false;
    }

    return true;
  }

  // prettier-ignore
  /**
   * mit csinál
   *
   * jelenleg: az adott szomszéd manhatten távban 1-re van e tőle?
   *
   * mit kéne:
   *
   * adjacency rules megnézése, ha nincs fallback amit most csinál
   */
  checkNeighbor(nLP, neighbor) {
    const adjacencyRules = this.model.objects[0].adjacencyRules;
    const [tx, ty] = nLP;
    const [ox, oy] = neighbor.localPosition;

    // ml - manhattan length
    const ml = Math.abs(tx - ox) + Math.abs(ty - oy);

    // ha ml 1 akkor közvetlen szomszédja (nem átlósan van tőle), igazat adunk vissza
    // ez valszeg nem kéne ide, mert így a szabályok vizsgálata ki van hagyva
    // ezt a gyanút tovább erősíti hogy ugyanez a sor a szabályvizsgálat alatt is meg van ismételve
    // valszeg el lett felejtve kitörölve innen
    if (ml === 1) return true;

    // ha van adjacencyRule, belépünk az if-be
    if (adjacencyRules.length) {
      // végigmegyünk az összes szabályon
      for (let i = 0; i < adjacencyRules.length; i += 2) {
        const x = adjacencyRules[i];
        const y = adjacencyRules[i + 1];

        // ha a leendő helyi pozíció x-e + az adjacency x-e megegyezik a szomszéd x-ével
        // és a leendő helyi pozíció y-ja + az adjecency y-onja megegyezik a szomszéd y-onjával
        // akkor igazat adunk, vissza a szabálynak megfelel
        if (tx + x === ox && ty + y === oy) return true;
      }

      // ha egyik szabálynak sem felelünk meg hamis vissza
      return false;
    }

    // ha nincs szabály és közvetlen szomszéd (nem átlós) igaz vissza
    if (ml === 1) return true;

    // ha semmi sem teljesül hamis
    return false;
  }

  // prettier-ignore
  checkNeighborAcceptsAttachment(nLP, neighbor) {
    const sourceBlock = this.model.objects[0]; // az egyetlen blokkja a bblock entitásnak
    // a building block maga leaf block-e (turret, vagy thruster)
    const sourceIsLeaf = sourceBlock?.isTurret || sourceBlock?.isThruster || sourceBlock?.type === Type.THRUSTER;
    // az éppen vizsgált másik modellbeli block leaf blokk e
    const neighborIsLeaf = neighbor?.isTurret || neighbor?.isThruster || neighbor?.type === Type.THRUSTER;

    // Turrets and thrusters must attach to structural anchors.
    // ha mindkettő leaf hamisat adunk vissza - hamis = nem lehet csatlakoztatni
    if (sourceIsLeaf && neighborIsLeaf) return false;

    // Thrusters cannot be used as attachment anchors at all.
    // ide akkor jutunk el ha nem leaf block mindkettő
    // ez esetben ha a másik vizsgált blokk thruster nem csatlakozhatunk fel
    if (neighbor?.isThruster || neighbor?.type === Type.THRUSTER) return false;

    // másik blokk adjacency rules
    const adjacencyRules = neighbor.adjacencyRules;
    
    const [tx, ty] = nLP;
    const [ox, oy] = neighbor.localPosition;

    // két modell blokk távja x-en
    const dx = tx - ox;
    // két modell blokk távja y-on
    const dy = ty - oy;

    //! ugyan az a hiba mint a checkNeighbor függvényben

    // ha manhatten táv 1 vagyis nem átlósan van, igaz vissza
    if (Math.abs(dx) + Math.abs(dy) === 1) return true;

    // adjacency szabályok megnézése
    if (adjacencyRules.length) {
      // ha bármelyik teljesül igaz vissza
      for (let i = 0; i < adjacencyRules.length; i += 2) {
        const x = adjacencyRules[i];
        const y = adjacencyRules[i + 1];
        
        if (dx === x && dy === y) return true;
      }

      // ha vannak adjacency szabályok de egyik sem teljesül hamis vissza
      return false;
    }

    // ha közvetlen szomszéd igaz, amúgy hamis vissza
    return Math.abs(dx) + Math.abs(dy) === 1;
  }

  // prettier-ignore
  onNarrowCollision(other) {
    const _b = this.game.buffer;
    const mouse = this.game.mouse;
    
    // maga a building block
    const sourceBlock = this.model.objects[0];

    // ha turret a bblock, akkor speciális snapDistMax használata
    const snapDistMax = sourceBlock?.isTurret
      ? BuildingBlock.SNAP_CURSOR_DIST_MAX_TURRET
      : BuildingBlock.SNAP_CURSOR_DIST_MAX;

    // ha turret a bblock, akkor speciális centerTolerance használata
    const centerTolerance = sourceBlock?.isTurret
      ? BuildingBlock.SNAP_CENTER_TOLERANCE_TURRET
      : BuildingBlock.SNAP_CENTER_TOLERANCE;

    // ha a narrow collisionben a másik object egér, és le van nyomva a bal katt, akkor attach draghez
    other.is(Type.MOUSE) && mouse.isDown && mouse.attach(this);
    
    // ha nincs snap cooldown és
    // ha a az előző pozíciójához képest maga ez a BuldingBlock kevesebbet mozdult el mint snapDistMax és
    // ha draggelve van a BuldingBlock és
    // ha az entitás amivel ütközik játékos belépünk az if-be
    if (this.snapCooldown <= 0 && this.posDiff() < snapDistMax && this.isDragged() && other.is(Type.PLAYER)) {
      // ha kevesebb ideje drageljük mint SNAP_ARM_SECONDS akkor nem csatoljuk fel és nem megy kontakt fázisba
      //! dragSnapElapsed a this.onDragged növeli, ami a Mouse.js-ben van meghívva
      if (this.dragSnapElapsed < BuildingBlock.SNAP_ARM_SECONDS) return false;

      // vec2_1-be a BuildingBlock pozíciója
      vec2.copy(_b.vec2_1, this.position);
      
      // konkrét új helyi pozíció localExact-ba
      // ez kerekítve lesz az új modellbe (amibe be lesz csatolva) a helyi pozíciója a sourceBlock-nak
      // localExact ez a kerekítés nélküli érték
      const localExact = vec2.sub(_b.vec2_1, _b.vec2_1, other.position);

      // elforgatjuk, hogy ha forgatva van a másik entitás, akkor alignolva legyen a modelljével
      vec2.rotate(localExact, -other.rotation);

      // new local position - localExact kerekítése (modellben csak egész számokon lehetnek blokkok)
      const nLP = vec2.copy(_b.vec2_2, localExact); // newLocalPosition (rounded)
      vec2.round(nLP);

      // ha a felcsatolandó blokk NEM turret és
      // a különbség a kerekített és nem kerekített új helyi pozíció között
      // nagyobb mint a centerTolerance akkor nem csatoljuk fel és nem megyünk tovább
      // kontakt fázisba

      // máshogy fogalmazva:
      // centerTolerance az hogy milyen messze lehet a középtől a blokk amikor snapelne
      // localExact és nLP távolsága azt mondja meg, hogy milyen messze van a blokk hogy az adott modell slot közepén legyen
      /**
       * ez arra ösztönzi a játékost hogy határozott legyen amikor felcsatol
       * ha a blokk épp hogy csak súrolja a szélét egy másiknak a snap el lesz utasítva, ezzel megakadályozva
       * a véletlen felcsatolásokat
       * 
       * a turreteknek más a toleranciájuk!!!! (nincs)
       */
      if (!sourceBlock?.isTurret) {
        if (
          Math.abs(localExact[0] - nLP[0]) > centerTolerance ||
          Math.abs(localExact[1] - nLP[1]) > centerTolerance
        ) {
          return false;
        }
      }

      // Never allow placing into an already occupied slot.
      if (other.model.objects.some(({ localPosition }) => localPosition[0] === nLP[0] && localPosition[1] === nLP[1])) {
        return false;
      }

      /**
       * az összes olyan másik modellbeli blokk amik megfelelnek
       * a checkNeighbor és checkNeighborAcceptsAttachment függvénynek
       * vagyis akik manhatten távban 1-re vannak és megfelelnek az adjacency szabályoknak
       * itt az adjacency szabályos rész ugye hibás szóval úgy nézzük, hogy nem tökéletes
       */
      /**
       * What are candidates? 
       * Blocks on the ship that are adjacent to nLP (the rounded snap slot)
       * and willing to accept an attachment there.
       * There can be multiple if the snap slot is at a corner where two or three
       * existing blocks meet.
       */
      const candidates = [];

      for (const candidate of other.model.objects) {
        if (!this.checkNeighbor(nLP, candidate)) continue;
        if (!this.checkNeighborAcceptsAttachment(nLP, candidate)) continue;
        candidates.push(candidate);
      }

      // ha nincs jelölt, nincs szomszéd, nem lehet felcsatolni + nem is megyünk kontakt fázisba
      if (candidates.length === 0) return false;

      // alapból kiválasztjuk az első találatot mint neighbor
      let neighbor = candidates[0];

      // ha több találat van akkor egy scoreozás alapján eldöntjük melyik legyen az anchor
      if (candidates.length > 1) {
        // a nem kerekített és kerekített új helyi pozíció x-beli különbsége
        const residualX = localExact[0] - nLP[0];
        // a nem kerekített és kerekített úk helyi pozíció y-beli különbsége
        const residualY = localExact[1] - nLP[1];

        // [residualX, residualY] lényegében egy vektor ami localExact-ba mutat nLP-ből
        // ennek a hosszának a négyzete (nem manhatten hossz itt!!!)
        const residualLenSq = residualX * residualX + residualY * residualY;

        // ha több találat van és a hossz nagyobb mint 1e-6
        // the normal case (block is off-center)
        if (residualLenSq > 1e-6) {
          const invResidualLen = 1 / Math.sqrt(residualLenSq);
          // [dirX, dirY] = [residualX, residualY] vektor normalizálva
          // the direction the block is being held, relative to the snap slot.
          const dirX = residualX * invResidualLen;
          const dirY = residualY * invResidualLen;

          let bestScore = -Infinity;
          for (const candidate of candidates) {
            const nx = candidate.localPosition[0] - nLP[0];
            const ny = candidate.localPosition[1] - nLP[1];

            /**
             * The score nx * dirX + ny * dirY is a dot product between:
             * - the direction from nLP toward each candidate block
             * - the direction the dragged block is offset toward
             * The dot product is highest when these two vectors point in the same direction.
             * So it picks whichever candidate is in the direction you're dragging
             * from — if you're holding the block slightly to the right of center,
             * it picks the candidate that's to the right.
             * It anchors to the neighbor you're leaning toward.
             */
            const score = nx * dirX + ny * dirY;

            if (score > bestScore) {
              bestScore = score;
              neighbor = candidate;
            }
          }
        } else {
          /**
           * ha a hossz nem nagyobb mint 1e-6
           * else — block is nearly perfectly centered (residualLenSq <= 1e-6)
           * No clear lean direction, so the dot product trick is meaningless.
           * Falls back to just picking the candidate closest to localExact by raw distance.
           */
          let bestDistanceSq = Infinity; // legjobb táv négyzete
          for (const candidate of candidates) {
            const dx = candidate.localPosition[0] - localExact[0];
            const dy = candidate.localPosition[1] - localExact[1];
            const distanceSq = dx * dx + dy * dy; // adott jelölt távja a nem kerekített új helyi pozíciótól

            // ha ez a táv kisebb mint a jelenleg legjobbnak vélt lecseréljük a legjobb távot és a neighbort is a jelenleg vizsgált jelöltre
            if (distanceSq < bestDistanceSq) {
              bestDistanceSq = distanceSq;
              neighbor = candidate;
            }
          }
        }
      }

      // itt már megvan ki lesz az anchor

      const [object] = this.model.objects; // ugyan az mint a sourceBlock

      // Orient the sprite so its bottom faces the connection side
      // [dx, dy] vektor nLP-ből a neighbor.localPosition-be
      const dx = neighbor.localPosition[0] - nLP[0];
      const dy = neighbor.localPosition[1] - nLP[1];
      
      // hogy a textúra jól álljon amikor hozzácsatoljuk, ez a forgatottság kell
      /**
       * The negation (-dx, -dy) flips the direction — from "toward the neighbour"
       * to "away from the neighbour", i.e. pointing outward from the ship.
       * The comment on line 356 explains it:
       * the sprite's bottom should face the connection side (toward the neighbour),
       * which means its top/front faces away.
       * So negating gives the outward-facing direction, and atan2 converts that
       * into an angle for the texture rotation.
       * 
       * a minusz jelekkel lényegében 180 fokot forgatunk a vektoron, vagyis már
       * nem nLP-ből neighbor.localPosition-be mutat hanem fordítva
       */
      /**
       * atan2:
       * atan2(y, x) returns the angle of the vector (x, y) relative to the positive X axis
       * (pointing right), measured counter-clockwise. The result is in radians,
       * ranging from -π to π.
       * 
       * -> (1, 0) → 0 (pointing right)
       * -> (0, 1) → π/2 (pointing up)
       * -> (-1, 0) → π (pointing left)
       * -> (0, -1) → -π/2 (pointing down)
       * 
       * because dx and dy is flipped when passed as arguments this add another 90 degrees of rotation
       * this is likely intentional to account for the sprite's default rotation
       * this +90 degs happen because when we flip the arguments we dont measure from +X, but from +Y instead
       * Since X and Y are 90 degs apart the result is always 90 degs off
       */
      /**
       * atan2 is like measuring the angle between a custom vector and the vector (1, 0)
       * it gives us the angle we would need to rotate (1, 0) counter-clockwise to land on our custom vector (x, y)
       */
      const texAngle = Math.atan2(-dx, -dy);
      
      // lekérjuk az object sprite-ját
      const sprite = this.game.textureManager.sprites[object.spriteID];
      
      // ha van
      if (sprite) {
        // akkor az összes frame-jén végigmegyünk és beállítjuk a megfelelő elforgatottságot neki
        for (const frame of sprite.frames) {
          object.rotateTexture(frame.textureName, texAngle);
        }
      }

      // ha az object turret vagy thruster (valszeg azt jelenti nem kocka a kollider)
      // akkor a collider-t elforgatjuk
      if (object.isTurret || object.isThruster || object.type === Type.THRUSTER) {
        const colliderAngle = texAngle;
        object.setColliderRotation?.(colliderAngle);
      }

      // object localPosition-ját lecseréljük az újra, vagyis ami az új modellben lesz az övé
      vec2.copy(object.localPosition, nLP);

      // az objectet berakjuk az új modellbe
      other.model.add(other, object);

      object.isRemovable = true;

      this.model.reset();
      this.game.mouse.reset();

      // other.proxyShader.onGeometryChange();
      // other.pshapeShader.onGeometryChange();
      other.onGeometryChange?.();

      this.setState(GlobalState.DEAD);
    }

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

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) {
      this.showDetails();
      object.showDetails(this);
      return;
    }

    const other =
      collision.a.parent === this ? collision.b.parent : collision.a.parent;

    // ha a másik PROJECTILE
    if (other?.parent?.is?.(Type.PROJECTILE)) {
      // ha az ebben a modellben lévő, kontaktban résztvevő object healthja number
      if (typeof object?.health === "number") {
        // csökkentjük a másik sebzésével
        object.health -= other.parent.dmg ?? 0;
        // lehet megpusztult tehát model clear
        const geometryChanged = this.model.clear();
        // ha tényleg változott a model, akkor onGeometryChange meghívása
        // a megölés az onGeometryChange függvényben történik, ha meg kell
        if (geometryChanged) this.onGeometryChange();
      }
      return;
    }
  }

  // ha elkezdünk dragelni
  // az előző dragelésből maradt dragSnapElapsed-et reseteljük
  // lifeTime-ot is reseteljük, bár ez az onDragged-ban amúgy is megtörténne
  onDragStart() {
    this.lifeTime = 0;
    this.dragSnapElapsed = 0;
  }

  // dragelés
  // nem tétlen, tehát lifeTime-ot reseteljük
  // dragSpanElapsed-hez delta time-ot adjuk, mert dragelésben vagyunk
  // ez a Mouse.js-ben van meghívva
  onDragged(dt = 0) {
    this.lifeTime = 0;
    this.dragSnapElapsed += dt;
  }

  // prettier-ignore
  resolvePenetration(other, collision, epsilon, direction) {
    const correction = other.is(Type.PLAYER) ? collision.depth + epsilon : this.getDefaultPenetrationCorrection(other, collision, epsilon);

    vec2.addScaled(this.position, this.position, collision.normal, correction * direction);
  }
}
