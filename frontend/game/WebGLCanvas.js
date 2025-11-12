import Canvas from "./Canvas.js";
import WebGL from "./WebGL.js";

export default class WebGLCanvas extends Canvas {
  constructor() {
    super();

    this.gl = null;
    this.glProgram = null;
    this.cameraMatrixUniformLocation = -1;
  }

  clearCanvas() {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Sets the gl variable of the Game class instance if WebGL is available.
   */
  initWebGL() {
    if (!this.hasCanvas()) {
      throw new Error(
        "GAME-initWebGL: Couldn't initialize WebGL: there is no canvas selector for this Game instance."
      );
    }

    this.gl = this.canvas.getContext("webgl2");

    if (!this.gl) {
      throw new Error(
        "GAME-initWebGL: Your browser does not support WebGL or it is disabled! Also you might have already requested another context for this canvas!"
      );
    }
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
