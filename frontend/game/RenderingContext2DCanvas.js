import * as vec2 from "/common/vec2.js";
import Buffer from "/game/Buffer.js";
import Canvas from "/game/Canvas.js";

// ! Origin is always the middle of the canvas!
export default class RenderingContext2DCanvas extends Canvas {
  constructor() {
    super();

    this.createCanvas(false);

    this.internalBuffer = new Buffer();

    this.context = this.canvas.getContext("2d");
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.tileSize = 10;
    this.scale = 1 / this.tileSize;
    this.scaleX = this.scale;
    this.scaleY = this.scale;
    this.fontFamily = "";
    this.fontSize = 10;
  }

  setFontFamily(fontFamily) {
    this.fontFamily = fontFamily;
    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    return this;
  }

  setFontSize(fontSize) {
    this.fontSize = fontSize;
    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    return this;
  }

  setTextAlignment(textAlignment) {
    this.context.textAlign = textAlignment;
    return this;
  }

  onResize() {
    this.aspectRatio = this.canvas.width / this.canvas.height;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.updateScaling();
  }

  setTileSize(tileSize) {
    this.tileSize = tileSize;
    this.scale = 1 / this.tileSize;
    this.updateScaling();
    return this;
  }

  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.onResize();
    return this;
  }

  updateScaling() {
    this.scaleX = this.scale;
    this.scaleY = this.scale;

    if (this.aspectRatio >= 1) this.scaleX = this.scale / this.aspectRatio;
    else this.scaleY = this.scale * this.aspectRatio;

    return this;
  }

  toScreen(target, input) {
    target[0] = this.W / 2 + input[0] * this.scaleX * this.canvas.width * 0.5;
    target[1] = this.H / 2 + input[1] * this.scaleY * (1 - this.canvas.height) * 0.5;
    return target;
  }

  toResponsive(s) {
    return s * this.scaleX * this.W * 0.5;
  }

  beginPath() {
    this.context.beginPath();
    return this;
  }

  moveTo(x, y, convert = false) {
    const v = vec2.set(this.internalBuffer.vec2_1, x, y);
    const [a, b] = convert ? this.toScreen(v, v) : v;
    this.context.moveTo(a, b);
    return this;
  }

  lineTo(x, y, convert = false) {
    const v = vec2.set(this.internalBuffer.vec2_1, x, y);
    const [a, b] = convert ? this.toScreen(v, v) : v;
    this.context.lineTo(a, b);
    return this;
  }

  closePath() {
    this.context.closePath();
    return this;
  }

  stroke(color, lineWidth = -1) {
    this.context.save();
    lineWidth > -1 && (this.context.lineWidth = lineWidth);
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.restore();
    return this;
  }

  fill(color) {
    this.context.save();
    this.context.fillStyle = color;
    this.context.fill();
    this.context.restore();
    return this;
  }

  fillRect(color, x, y, w, h) {
    this.context.save();
    this.context.fillStyle = color;
    this.context.fillRect(x, y, w, h);
    this.context.restore();
    return this;
  }

  fillText(x, y, text, color, convert = false) {
    const v = vec2.set(this.internalBuffer.vec2_1, x, y);
    const [a, b] = convert ? this.toScreen(v, v) : v;
    this.context.save();
    this.context.fillStyle = color;
    this.context.fillText(text, a, b);
    this.context.restore();
    return this;
  }

  fillTriangle(color, a, b, c, d, e, f, convert = false) {
    this.beginPath();
    this.moveTo(a, b, convert);
    this.lineTo(c, d, convert);
    this.lineTo(e, f, convert);
    this.lineTo(a, b, convert);
    this.closePath();
    this.context.save();
    this.context.fillStyle = color;
    this.context.fill();
    this.context.restore();
    return this;
  }

  line(color, lineWidth, a, b, c, d, convert = false) {
    this.beginPath();
    this.moveTo(a, b, convert);
    this.lineTo(c, d, convert);
    this.closePath();
    this.context.save();
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.restore();
    return this;
  }

  // prettier-ignore
  strokeCircle(color, lineWidth, x, y, r, startAngle, endAngle, convert = false) {
    const v = vec2.set(this.internalBuffer.vec2_1, x, y);
    const [a, b] = convert ? this.toScreen(v, v) : v;
    this.beginPath();
    this.context.arc(a, b, this.toResponsive(r), startAngle, endAngle, false);
    this.closePath();
    this.context.save();
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.restore();
    return this;
  }

  // prettier-ignore
  fillCircle(color, x, y, r, startAngle, endAngle, convert = false) {
    const v = vec2.set(this.internalBuffer.vec2_1, x, y);
    const [a, b] = convert ? this.toScreen(v, v) : v;
    this.beginPath();
    this.context.moveTo(a, b);
    this.context.arc(a, b, this.toResponsive(r), startAngle, endAngle, false);
    this.closePath();
    this.context.save();
    this.context.fillStyle = color;
    this.context.fill();
    this.context.restore();
    return this;
  }
}
