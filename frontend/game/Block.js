import * as vec2 from "../common/vec2.js";
import WebGL from "./WebGL.js";
import * as MATRIX from "../common/common.js";

export default class Block {
  // prettier-ignore
  static VERTICES = new MATRIX.DATA_STRUCTURE([
    -0.5,  0.5,
     0.5,  0.5,
    -0.5, -0.5,
    -0.5, -0.5,
     0.5,  0.5,
     0.5, -0.5,
  ]);

  // prettier-ignore
  static TEX_COORDS = new MATRIX.DATA_STRUCTURE([
    0, 1,
    1, 1,
    0, 0,
    0, 0,
    1, 1,
    1, 0,
  ]);

  static VERTEX_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    in vec2 vertexPosition;
    in vec2 textureCoordinate;
    in vec2 localPosition;
    in vec2 parentPosition;
    in mat2 rotationMatrix;
    in vec2 uvOffset;
    in vec2 uvScale;

    out vec2 vTexCoord;

    uniform mat3 cameraMatrix;

    void main() {
      vec3 position = cameraMatrix * vec3((rotationMatrix * (localPosition + vertexPosition)) + parentPosition, 1.0);
      gl_Position = vec4(position, 1.0);
      vTexCoord = uvOffset + textureCoordinate * uvScale;
    }
  `;

  static FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    in vec2 vTexCoord;
    out vec4 outputTexture;

    uniform sampler2D uSampler;

    void main() {
      outputTexture = texture(uSampler, vTexCoord);
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

    WebGL.THROW_NO_GL_ERROR(gl, "BLOCK-initRender");

    const prog = game.glProgram;
    const floatPerInstance = 12;

    const a = game.attribute;
    game.vao._1 = gl.createVertexArray();
    gl.bindVertexArray(game.vao._1);

    WebGL.GET_ATTRIB_LOCATIONS(gl, prog, Block.VERTEX_SHADER_SOURCE, game.attribute);

    WebGL.CREATE_AND_LOAD_BUFFER(gl, gl.ARRAY_BUFFER, Block.VERTICES, gl.STATIC_DRAW);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.vertexPosition, 2, gl.FLOAT, false, 0, 0, 0);

    WebGL.CREATE_AND_LOAD_BUFFER(gl, gl.ARRAY_BUFFER, Block.TEX_COORDS, gl.STATIC_DRAW);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.textureCoordinate, 2, gl.FLOAT, false, 0, 0, 0);

    game.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, game.instanceBuffer);
    game.uniform.cameraMatrix = gl.getUniformLocation(prog, "cameraMatrix");

    const stride = Float32Array.BYTES_PER_ELEMENT * floatPerInstance;

    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.localPosition, 2, gl.FLOAT, false, stride, 0, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.parentPosition, 2, gl.FLOAT, false, stride, 8, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.rotationMatrix, 2, gl.FLOAT, false, stride, 16, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.rotationMatrix + 1, 2, gl.FLOAT, false, stride, 24, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.uvOffset, 2, gl.FLOAT, false, stride, 32, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.uvScale, 2, gl.FLOAT, false, stride, 40, 1);

    game.draw = function(instanceCount) {
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
    }

    game.initInstancing = function () {
      this.floatPerInstance = floatPerInstance;
      this.instanceData = new MATRIX.DATA_STRUCTURE(
        this.instanceCapacity * this.floatPerInstance
      );

      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bindVertexArray(this.vao._1);
    }

    game.updateInstanceBuffer = function () {
      const gl = this.gl;

      const instanceCount = this.dataCollector.length / this.floatPerInstance;
      if (instanceCount === 0) return -1;

      if (instanceCount > this.instanceCapacity) {
        this.instanceCapacity = instanceCount * 2;
        this.instanceData = new MATRIX.DATA_STRUCTURE(this.instanceCapacity * this.floatPerInstance);
      }

      this.instanceData.set(this.dataCollector, 0);
      gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.subarray(0, instanceCount * this.floatPerInstance), gl.DYNAMIC_DRAW);

      return instanceCount;
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  constructor(x, y, shape, spriteId, mass = 1) {
    this.localPosition = vec2.fromValues(x, y);
    this.shape = shape;
    this.spriteId = spriteId;
    this.mass = mass;
    this.isRemovable = false;
    this.health = 100;
  }
}
