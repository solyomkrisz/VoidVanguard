import Canvas from "./Canvas.js";
import * as vec2 from "../common/vec2.js";

export default class DebugOverlay extends Canvas {
  constructor() {
    super();
    this.ctx = null;
  }

  init() {
    this.createCanvas();

    if (!this.hasCanvas()) {
      throw new Error("DEBUGOVERLAY-init: No HTMLCanvasElement is provided!");
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
      throw new Error("DEBUGOVERLAY-init: Couldn't initialize context!");
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCircle(x, y, r, color) {
    const c = this.ctx;

    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2, false);
    c.closePath();
    c.save();
    c.strokeStyle = color;
    c.stroke();
    c.restore();
  }

  // prettier-ignore
  drawBox(x, y, w, h, color, lineWidth, callback = (ctx, color, lineWidth) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth,
    ctx.stroke();
  }) {
    const c = this.ctx;

    c.beginPath();
    c.rect(x - w / 2, y - h / 2, w, h);
    c.closePath();

    c.save();
    callback(c, color, lineWidth);
    c.restore();
  }

  drawText(x, y, text, font, color) {
    const c = this.ctx;

    c.save();

    c.font = font;
    c.fillStyle = color;
    const m = c.measureText(text);
    c.fillText(text, x - m.width / 2, y);

    c.restore();

    return m;
  }

  drawPolygon(vertices, color = "rgba(255, 255, 255, 0.5)") {
    const c = this.ctx;

    c.beginPath();
    c.moveTo(vertices[0], vertices[1]);

    for (let i = 2; i < vertices.length; i += 2) {
      c.lineTo(vertices[i], vertices[i + 1]);
    }
    c.closePath();

    c.save();
    c.strokeStyle = "#fff";
    c.lineWidth = "2";
    c.stroke();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
}
