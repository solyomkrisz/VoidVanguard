import * as vec2 from "/common/vec2.js";
import WebGL from "/game/WebGL.js";
import * as MATRIX from "/common/common.js";
import * as vec from "/common/vec.js";
import DynamicTooltip from "/ui/component/game/DynamicTooltip.js";
import Shape from "/game/Shape.js";

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

    const float PI = 3.141592653589793;

    in vec2 vertexPosition;
    in vec2 textureCoordinate;
    in vec2 localPosition;
    in vec2 parentPosition;
    in mat2 rotationMatrix;
    in vec2 uvOffset;
    in vec2 uvScale;
    in float texRotationRad;
    in float layerId;
    in float instanceParallax;

    out vec2 vTexCoord;
    flat out int textureLayerId;

    uniform float backgroundZoom;
    uniform mat3 cameraMatrix;

    vec2 rotateTexture(vec2 texCoord, float rad) {
      mat2 texRotationMatrix = mat2(
        cos(rad), sin(rad),
        -sin(rad), cos(rad)
      );

      vec2 centeredTexCoord = texCoord - 0.5;
      vec2 rotatedTexCoord = texRotationMatrix * centeredTexCoord;

      return rotatedTexCoord + 0.5; // We also shift it back to the original position
    }

    void main() {
      vTexCoord = uvOffset + rotateTexture(textureCoordinate, texRotationRad) * uvScale;
      textureLayerId = int(layerId);

      vec2 translatedAndRotated = (rotationMatrix * (localPosition + vertexPosition)) + parentPosition; 

      if (layerId >= 0.0) {
        vec2 aligned = translatedAndRotated + 0.5;
        vec2 zoomed = aligned * backgroundZoom;
        vec2 scaled = vec2(cameraMatrix[0][0] * zoomed.x, cameraMatrix[1][1] * zoomed.y);
        vec2 parallaxed = scaled + vec2(cameraMatrix[2][0], cameraMatrix[2][1]) * instanceParallax;
        gl_Position = vec4(parallaxed, 0.0, 1.0);
      } else {
        gl_Position = vec4(cameraMatrix * vec3(translatedAndRotated, 1.0), 1.0); 
      }
    }
  `;

  static FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    uniform vec4 backgroundColor;

    uniform sampler2D uSampler;
    uniform highp sampler2DArray textureArray;

    in vec2 vTexCoord;
    flat in int textureLayerId;
    out vec4 outputTexture;

    void main() {
      if (textureLayerId >= 0) {
        outputTexture = texture(textureArray, vec3(vTexCoord, float(textureLayerId)));
      } else {
        outputTexture = texture(uSampler, vTexCoord);
      }
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
    const floatPerInstance = 15;

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
    game.uniform.backgroundColor = gl.getUniformLocation(prog, "backgroundColor");
    game.uniform.r = gl.getUniformLocation(prog, "r");
    game.uniform.p = gl.getUniformLocation(prog, "p");
    game.uniform.noiseScale = gl.getUniformLocation(prog, "noiseScale");
    game.uniform.textureArray = gl.getUniformLocation(prog, "textureArray");
    game.uniform.backgroundZoom = gl.getUniformLocation(prog, "backgroundZoom");

    const stride = Float32Array.BYTES_PER_ELEMENT * floatPerInstance;

    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.localPosition, 2, gl.FLOAT, false, stride, 0, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.parentPosition, 2, gl.FLOAT, false, stride, 8, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.rotationMatrix, 2, gl.FLOAT, false, stride, 16, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.rotationMatrix + 1, 2, gl.FLOAT, false, stride, 24, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.uvOffset, 2, gl.FLOAT, false, stride, 32, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.uvScale, 2, gl.FLOAT, false, stride, 40, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.texRotationRad, 1, gl.FLOAT, false, stride, 48, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.layerId, 1, gl.FLOAT, false, stride, 52, 1);
    WebGL.SETUP_INSTANCED_ATTRIBUTE(gl, a.instanceParallax, 1, gl.FLOAT, false, stride, 56, 1);

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

      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.subarray(0, instanceCount * this.floatPerInstance), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return instanceCount;
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  static from(blockState) {
    const [x, y] = blockState.localPosition;
    const shape = Shape.from(blockState.shape);

    const block = new Block({
      x,
      y,
      shape,
      spriteID: blockState.spriteID,
      gradeID: blockState.gradeID,
      mass: blockState.mass,
      health: blockState.health,
      adjacencyRules: vec.clone(blockState.adjacencyRules),
    });

    block.type = blockState.type;
    block.textureRotation = new Map(blockState.textureRotation);
    block.isRemovable = blockState.isRemovable;

    return block;
  }

  // prettier-ignore
  constructor({ x, y, shape, spriteID, gradeID = 0, mass = 1, health = 100, adjacencyRules = vec.create(0) } = {}) {
    this.type = 0;
    this.localPosition = vec2.fromValues(x, y);
    this.shape = shape;
    this.spriteID = spriteID;
    this.gradeID = gradeID;
    this.textureRotation = new Map();
    this.mass = mass;
    this.isRemovable = true;
    this.toRemove = false;
    this.health = health;
    this.adjacencyRules = adjacencyRules;
    this.CoM = vec2.create();
    this.I = this.shape.getMomentOfInertiaAndCoM(this.mass, this.CoM);
  }

  exportSave() {
    return {
      type: this.type,
      localPosition: [...this.localPosition],
      shape: this.shape.exportSave(),
      spriteID: this.spriteID,
      gradeID: this.gradeID,
      textureRotation: [...this.textureRotation],
      mass: this.mass,
      isRemovable: this.isRemovable,
      health: this.health,
      adjacencyRules: [...this.adjacencyRules],
    };
  }

  rotateTexture(textureName, rad) {
    this.textureRotation.set(textureName, rad);
    return this;
  }

  removeTextureRotation(textureName) {
    this.textureRotation.has(textureName) &&
      this.textureRotation.delete(textureName);
    return this;
  }

  getTextureRotation(textureName) {
    return this.textureRotation.has(textureName)
      ? this.textureRotation.get(textureName)
      : 0;
  }

  onRemove(parent) {
    this.toRemove = false;
    return this;
  }

  onInsert(parent) {
    return this;
  }

  // prettier-ignore
  showBasicDetails(parent) {
    const ttip = parent.game.tooltip;
    if (ttip.showTemplate(this, ttip.template.BLOCK_INFO, parent.game.frameId)) return;

    const t = ttip.template.BLOCK_INFO;
    t.localPosition.textContent = this.localPosition;
    t.shapeVertices.textContent = this.shape.vertices;
    t.mass.textContent = this.mass;
    t.isRemovable.textContent = this.isRemovable;
    t.health.textContent = this.health;
    t.CoM.textContent = this.CoM;
  }

  showDetails(parent) {
    this.showBasicDetails(parent);
    parent.game.tooltip.show();
  }
}
