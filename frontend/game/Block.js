import WebGL from "./WebGL.js";

export default class Block {
  // prettier-ignore
  static VERTICES = new Float32Array([
    -0.5,  0.5,
     0.5,  0.5,
    -0.5, -0.5,
    -0.5, -0.5,
     0.5,  0.5,
     0.5, -0.5,
  ]);

  static VERTEX_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    in vec2 vertexPosition;

    void main() {
      gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
  `;

  static FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    out vec4 outputColor;

    void main() {
      outputColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `;

  // prettier-ignore
  static CREATE_GL_PROGRAM(gl) {
    return WebGL.CREATE_AND_LINK_PROGRAM_FROM_SOURCE(gl, Block.VERTEX_SHADER_SOURCE, Block.FRAGMENT_SHADER_SOURCE);
  }

  /**
   * ! Call it before any render attempt! (In this case call it before Game.start)
   */
  // prettier-ignore
  static INIT_RENDER(game) {
    const gl = game.gl;
    const prog = game.glProgram;

    WebGL.THROW_NO_GL_ERROR(gl, "BLOCK-initRender");

    const vertexBuffer = WebGL.CREATE_AND_LOAD_BUFFER(gl, gl.ARRAY_BUFFER, Block.VERTICES, gl.STATIC_DRAW);
    const vertexAttrLoc = gl.getAttribLocation(prog, "vertexPosition");
    gl.enableVertexAttribArray(vertexAttrLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexAttrLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
