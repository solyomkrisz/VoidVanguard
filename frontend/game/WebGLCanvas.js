/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/WebGLCanvas.js
 * Szerep: WebGL-re szakosodott canvas wrapper inicializalassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Canvas from "/game/Canvas.js";
import WebGL from "/game/WebGL.js";
import * as MATRIX from "/common/common.js";
import * as vec from "/common/vec.js";

export default class WebGLCanvas extends Canvas {
  constructor() {
    super();

    this.gl = null;
    this.glProgram = null;
    this.uniform = {};
    this.attribute = {};
    this.vao = {};
    this.dataCollector = [];
    this.instanceCapacity = 128;
    this.floatPerInstance = 0;
    this.instanceData = new MATRIX.DATA_STRUCTURE(
      this.instanceCapacity * this.floatPerInstance
    );
    this.clearColor = vec.fromValues(0.0, 0.0, 0.0, 1.0);
  }

  initInstancing() {
    console.warn("initInstancing() must be implemented if needed!");
  }

  updateInstanceBuffer() {
    console.warn("updateInstanceBuffer() must be implemented if needed!");
  }

  draw() {
    console.warn("draw() must be implemented!");
  }

  clearCanvas() {
    this.gl.clearColor(...this.clearColor);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Sets the gl variable of the WebGLCanvas class instance if WebGL is available.
   */
  initWebGL() {
    if (!this.hasCanvas()) {
      throw new Error(
        "WEBGLCANVAS-initWebGL: Couldn't initialize WebGL: there is no canvas selector for this WebGLCanvas instance."
      );
    }

    this.gl = this.canvas.getContext("webgl2");

    if (!this.gl) {
      throw new Error(
        "WEBGLCANVAS-initWebGL: Your browser does not support WebGL or it is disabled! Also you might have already requested another context for this canvas!"
      );
    }

    // Enable alpha blending - needed for transparent textures (beforehand it was instead just black)
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Starts using the given program.
   *
   * @param {string} vertex_shader_source
   * @param {string} fragment_shader_source
   */
  // prettier-ignore
  setProgram(vertex_shader_source, fragment_shader_source) {
    const program = WebGL.CREATE_AND_LINK_PROGRAM_FROM_SOURCE(this.gl, vertex_shader_source, fragment_shader_source);

    this.glProgram = program;
    this.gl.useProgram(program);
  }
}
