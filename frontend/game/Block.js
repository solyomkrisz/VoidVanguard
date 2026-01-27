import * as vec2 from "../common/vec2.js";
import WebGL from "./WebGL.js";
import * as MATRIX from "../common/common.js";
import * as vec from "../common/vec.js";
import DynamicTooltip from "../ui/component/DynamicTooltip.js";

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
    out vec2 fragCoord;
    out float hasTexture;

    uniform mat3 cameraMatrix;

    void main() {
      vec2 rotatedAndTranslated = (rotationMatrix * (localPosition + vertexPosition)) + parentPosition;
      vec3 position = cameraMatrix * vec3(rotatedAndTranslated, 1.0);
      gl_Position = vec4(position, 1.0);
      vTexCoord = uvOffset + textureCoordinate * uvScale;
      fragCoord = rotatedAndTranslated;
      hasTexture = uvOffset.x;
    }
  `;

  static FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision mediump float;

    uniform float noiseScale;

    uniform float r[256];
    uniform int p[512];
    int m = 255;

    uniform sampler2D uSampler;

    in float hasTexture;
    in vec2 fragCoord;
    in vec2 vTexCoord;
    out vec4 outputTexture;

    float lerp(float a, float b, float t) {
      return a + (b - a) * t;
    }

    float valuenoise(float x, float y) {
      int xi = int(floor(x));
      int yi = int(floor(y));

      float tx = x - float(xi);
      float ty = y - float(yi);

      float sx = smoothstep(0.0, 1.0, tx);
      float sy = smoothstep(0.0, 1.0, ty);

      int x0 = xi & m;
      int y0 = yi & m;
      int x1 = (x0 + 1) & m;
      int y1 = (y0 + 1) & m;

      float x0y0 = r[p[p[x0] + y0]];
      float x1y0 = r[p[p[x1] + y0]];
      float x0y1 = r[p[p[x0] + y1]];
      float x1y1 = r[p[p[x1] + y1]];

      float t = mix(x0y0, x1y0, sx);
      float b = mix(x0y1, x1y1, sx);

      return mix(t, b, sy);
    }

    float fBm_valuenoise(float x, float y, int layers, float lacunarity, float gain) {
      float total = 0.0;
      float frequency = 1.0;
      float amplitude = 1.0;
      float maxValue = 0.0;

      for (int i = 0; i < layers; i++) {
        total += valuenoise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
      }

      return total / maxValue;
    }

    float threshold = 0.685;

    float H_scale = 1.0 / 2.0;
    float H_offset = 100.0;

    float O_scale = 1.0 / 6.0;
    float O_offset = 200.0;

    float He_scale = 1.0 / 2.0;
    float He_offset = 300.0;

    vec4 nebula() {
      vec2 v_xy = fragCoord * noiseScale;
      float v = fBm_valuenoise(v_xy.x, v_xy.y, 3, 2.0, 0.5);
      float a = min(1.0, max(0.0, (v - threshold) * 3.0));
      
      vec2 H_xy = (fragCoord + H_offset) * H_scale;
      float H = fBm_valuenoise(H_xy.x, H_xy.y, 5, 2.0, 0.5);

      vec2 O_xy = (fragCoord + O_offset) * O_scale;
      float O = fBm_valuenoise(O_xy.x, O_xy.y, 5, 2.0, 0.5);

      vec2 He_xy = (fragCoord + He_offset) * He_scale;
      float He = fBm_valuenoise(He_xy.x, He_xy.y, 5, 2.0, 0.5);

      vec4 nebulaColor = vec4(H, O, He, 1.0);
      vec4 backgroundColor = vec4(0.0, 0.0, 0.0, 1.0);

      return mix(backgroundColor, nebulaColor, a);
    }

    void main() {
      if (hasTexture < 0.0) {
        outputTexture = nebula();
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
    game.uniform.r = gl.getUniformLocation(prog, "r");
    game.uniform.p = gl.getUniformLocation(prog, "p");
    game.uniform.noiseScale = gl.getUniformLocation(prog, "noiseScale");

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

  // prettier-ignore
  constructor({ x, y, shape, spriteId, mass = 1, health = 100, adjacencyRules = vec.create(0) } = {}) {
    this.localPosition = vec2.fromValues(x, y);
    this.shape = shape;
    this.spriteId = spriteId;
    this.mass = mass;
    this.isRemovable = true;
    this.toRemove = false;
    this.health = health;
    this.adjacencyRules = adjacencyRules;
    this.CoM = vec2.create();
    this.I = this.shape.getMomentOfInertiaAndCoM(this.mass, this.CoM);
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
