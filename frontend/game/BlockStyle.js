/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/BlockStyle.js
 * Szerep: Blokkfokozatokhoz es tipusokhoz tartozo szin- es stilussegedek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Canvas from "/game/Canvas.js";

// prettier-ignore
export default class BlockStyle extends Canvas {
  constructor() {
    super();
    this.ctx = null;
  }

  // A blokk grade-szintjehez rendelt alap szinek. Ezeket tobben is hasznaljak, pl. UI cimkek, lovedekszinek, glow effektek.
  static GRADE_COLORS = Object.freeze({
    0: "rgba(197, 197, 197, 1)",  // Greyish       - Alumínium                - Grade 1  - Kezdő, alap
    1: "rgba(126, 126, 126, 1)",  // Grey          - Magnéziumötvözet         - Grade 2  - Ultralight, high skill
    2: "rgba(214, 214, 214, 1)",  // Light Greyish - Alumíniumötvözet (6061)  - Grade 3  - Erősebb mint az alumínium
    3: "rgba(180, 255, 255, 1)",  // Dark Grey     - Rozsdamentes acél        - Grade 4  - Nehéz, tankos
    4: "rgba(167, 255, 167, 1)",  // Mid Green     - Nikkelötvözet            - Grade 5  - Egyik legtankosabb earlygame anyag
    5: "rgba(0, 107, 32, 1)",     // Dark Green    - Titánötvözet (Ti-6Al-4V) - Grade 6  - Legjobb HP/tömeg arány alapján
    6: "rgba(0, 225, 255, 1)",    // Cyan Blue     - Üvegszálas kompozit      - Grade 7  - Gyors + közepes HP
    7: "rgba(0, 68, 255, 1)",     // Dark Blue     - Karbonkompozit (CFRP)    - Grade 8  - Ultralight, midgame 
    8: "rgba(140, 0, 255, 1)",    // Purple        - Kevlar (aramid)          - Grade 9  - Egyik legjobb HP/tömeg arány
    9: "rgba(234, 0, 255, 1)",    // Magenta       - Inconel                  - Grade 10 - Legnehezebb anyag + Legtöbb HP -> Kritikus védelem
    10: "rgba(255, 0, 0, 1)",     // Vörös         - Berillium                - Grade 11 - Ultralight, high skill, endgame
    11: "rgba(255, 187, 0, 1)",   // Arany         - Bór-karbid (B₄C)         - Grade 12 - Közepes tömeg + közepes HP
    12: "rgba(200, 255, 0, 1)",   // Citromsárga   - Szicílium-karbid (SiC)   - Grade 13 - Közepes tömeg + magas HP
    13: "rgba(102, 255, 0, 1)",   // Neonzöld      - Fejlett karbon-kerámia kompozit   - Grade 14 - Gyors + magas HP
    14: "rgba(255, 255, 255, 1)", // Fehér         - Titán–kompozit hibrid szerkezet   - Grade 15 (Csúcstechnológia) Közepes tömeg + extrém HP
  });

  // Egy korabbi otlet maradeka: kulon outline vastagsag grade-enkent. Jelenleg nincs aktiv hasznalatban, de referenciaertekkent megmaradt.
  static OUTLINE_WIDTHS = Object.freeze({
    0: 3.00,     // Greyish       - Alumínium                - Grade 1  - Kezdő, alap
    1: 2.50,     // Grey          - Magnéziumötvözet         - Grade 2  - Ultralight, high skill
    2: 3.00,     // Light Greyish - Alumíniumötvözet (6061)  - Grade 3  - Erősebb mint az alumínium
    3: 4.50,     // Dark Grey     - Rozsdamentes acél        - Grade 4  - Nehéz, tankos
    4: 5.00,     // Mid Green     - Nikkelötvözet            - Grade 5  - Egyik legtankosabb earlygame anyag
    5: 4.00,     // Dark Green    - Titánötvözet (Ti-6Al-4V) - Grade 6  - Legjobb HP/tömeg arány alapján
    6: 3.50,     // Cyan Blue     - Üvegszálas kompozit      - Grade 7  - Gyors + közepes HP
    7: 4.50,     // Dark Blue     - Karbonkompozit (CFRP)    - Grade 8  - Ultralight, midgame 
    8: 5.00,     // Purple        - Kevlar (aramid)          - Grade 9  - Egyik legjobb HP/tömeg arány
    9: 6.25,     // Magenta       - Inconel                  - Grade 10 - Legnehezebb anyag + Legtöbb HP -> Kritikus védelem
    10: 4.00,    // Vörös         - Berillium                - Grade 11 - Ultralight, high skill, endgame
    11: 4.75,    // Arany         - Bór-karbid (B₄C)         - Grade 12 - Közepes tömeg + közepes HP
    12: 5.00,    // Citromsárga   - Szicílium-karbid (SiC)   - Grade 13 - Közepes tömeg + magas HP
    13: 5.25,    // Neonzöld      - Fejlett karbon-kerámia kompozit   - Grade 14 - Gyors + magas HP
    14: 5.50,    // Fehér         - Titán–kompozit hibrid szerkezet   - Grade 15 (Csúcstechnológia) Közepes tömeg + extrém HP
  });

  // A gradeID-bol kikeresi az alap RGBA szint, es ismeretlen ertek eseten visszaesik a nulladik grade-re.
  static getColorForGrade(gradeID) 
  {
    return this.GRADE_COLORS[gradeID] || this.GRADE_COLORS[0];
  }

  // Ugyanazt a gradeszint hasznalja, csak atlatszobb valtozatban, amikor kitolteshez kell a szin.
  static getColorForFillGrade(gradeID)
  {
    const baseColor = this.getColorForGrade(gradeID);
    return baseColor.replace("1)", "0.3)");
  }

  init() {
    // Kulon 2D overlay-canvas jon letre a blokk-korvonalak es kitoltesek kirajzolasahoz.
    this.createCanvas();

    if (!this.hasCanvas()) {
      throw new Error("BLOCKSTYLE-init: No HTMLCanvasElement is provided!");
    }

    this.canvasToResponsiveFullWindow();

    const cStyle = this.canvas.style;

    cStyle.position = "absolute";
    cStyle.top = 0;
    cStyle.left = 0;
    cStyle.zIndex = 1;
    cStyle.pointerEvents = "none";

    this.ctx = this.canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("BLOCKSTYLE-init: Couldn't initialize context!");
    }
  }

  clearCanvas() {
    // A blokkstilus-overlay teljes torlese, tipikusan uj frame vagy ujrarajzolas elott.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPolygon(vertices, color = "rgba(255, 255, 255, 0)", strokeStyle = "#fff", lineWidth = 1, inset = null) {
    const c = this.ctx;
    
    if (inset === null) {
      // Az insettel kicsit beljebb huzott korvonalat rajzolunk, hogy a szomszedos blokkok outline-ja ne csusszon egymasra.
      inset = lineWidth * 0.775;
    }
    
    let drawVertices = vertices;
    // Ha kell inset, a csucsokat a sokszog kozeppontja fele toljuk befelé.
    if (inset !== 0) {
      // Eloszor kiszamoljuk a kozeppontot, ehhez fogjuk viszonyitani a befele tolást.
      let cx = 0, cy = 0;
      for (let i = 0; i < vertices.length; i += 2) {
        cx += vertices[i];
        cy += vertices[i + 1];
      }
      const pointCount = vertices.length / 2;
      cx /= pointCount;
      cy /= pointCount;
      
      // Minden csucs ugyanannyit mozdul a kozeppont fele, ettol lesz a kirajzolt sokszog valamivel kisebb az eredetinel.
      drawVertices = [];
      for (let i = 0; i < vertices.length; i += 2) {
        const vx = vertices[i];
        const vy = vertices[i + 1];
        const dx = vx - cx;
        const dy = vy - cy;
        const distance = Math.hypot(dx, dy);
        if (distance > 0) {
          drawVertices.push(vx - (dx / distance) * inset);
          drawVertices.push(vy - (dy / distance) * inset);
        } else {
          drawVertices.push(vx);
          drawVertices.push(vy);
        }
      }
    }

    c.beginPath();
    c.moveTo(drawVertices[0], drawVertices[1]);

    for (let i = 2; i < drawVertices.length; i += 2) {
      c.lineTo(drawVertices[i], drawVertices[i + 1]);
    }
    c.closePath();

    c.save();
    c.strokeStyle = strokeStyle;
    c.lineWidth = lineWidth;
    c.stroke();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
}
