/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/WebGL.js
 * Szerep: WebGL shader-, program- es buffersegedek gyujtemenye.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class WebGL {
  static IS_WEBGL2_RENDERING_CONTEXT(gl) {
    // Sok helper csak WebGL2-vel ertelmes, ez a gyors tipusellenorzes vedi a tobbi fuggvenyt.
    return gl instanceof WebGL2RenderingContext;
  }

  static THROW_NO_GL_ERROR(gl, from) {
    // A hibauzenetbe bekerul a hivo nev is, hogy konnyebb legyen visszafejteni, melyik setup lepes romlott el.
    if (!WebGL.IS_WEBGL2_RENDERING_CONTEXT(gl)) {
      throw new Error(
        `${from}: The given parameter is not a WebGL2RenderingContext!`
      );
    }
  }

  static THROW_NO_SHADER_ERROR(a, from) {
    // Kulon shaderellenorzes kell, mert compile es link lepeseknel mar nem eleg csak a gl contextet vizsgalni.
    if (!(a instanceof WebGLShader)) {
      throw new Error(
        `WEBGL-${from}: The given parameter is not a WebGLShader!`
      );
    }
  }

  static CREATE_SHADER(gl, source, type) {
    // A shader itt meg csak letrejon es megkapja a source-t; a tenyleges fordítás kulon lepésben tortenik.
    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-createShader");

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    return shader;
  }

  static COMPILE_SHADER(gl, shader) {
    // Forditasi hibanal azonnal exception jon a driver hibauzenetevel, hogy ne egy rossz shaderrel fusson tovabb a program.
    WebGL.THROW_NO_SHADER_ERROR(shader, "compileShader");

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(
        `WEBGL-compileShader: Failed to compile shader: ${gl.getShaderInfoLog(
          shader
        )}`
      );
    }
  }

  static CREATE_AND_LINK_PROGRAM(gl, vertex_shader, fragment_shader) {
    // A teljes shaderprogram pipeline: compile, attach, link, majd siker utan a kulon shaderobjektumok mar eldobhatok.
    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-createAndLinkProgram");
    WebGL.THROW_NO_SHADER_ERROR(vertex_shader, "createAndLinkProgram");
    WebGL.THROW_NO_SHADER_ERROR(fragment_shader, "createAndLinkProgram");

    const program = gl.createProgram();

    WebGL.COMPILE_SHADER(gl, vertex_shader);
    gl.attachShader(program, vertex_shader);

    WebGL.COMPILE_SHADER(gl, fragment_shader);
    gl.attachShader(program, fragment_shader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `WEBGL-createAndLinkProgram: Failed to link program: ${gl.getProgramInfoLog(
          program
        )}`
      );
    } else {
      gl.deleteShader(vertex_shader);
      gl.deleteShader(fragment_shader);
    }

    return program;
  }

  /**
   * Similar to CREATE_AND_LINK_PROGRAM however for this function
   * it is enough to provide the source codes for the two shaders.
   * @see {CREATE_AND_LINK_PROGRAM}
   */
  // prettier-ignore
  static CREATE_AND_LINK_PROGRAM_FROM_SOURCE(gl, vertex_shader_source, fragment_shader_source) {
    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-createAndLinkProgram");

    const program = gl.createProgram();

    const vertex_shader = WebGL.CREATE_SHADER(gl, vertex_shader_source, gl.VERTEX_SHADER);
    const fragment_shader = WebGL.CREATE_SHADER(gl, fragment_shader_source, gl.FRAGMENT_SHADER);

    WebGL.COMPILE_SHADER(gl, vertex_shader);
    gl.attachShader(program, vertex_shader);

    WebGL.COMPILE_SHADER(gl, fragment_shader);
    gl.attachShader(program, fragment_shader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `WEBGL-createAndLinkProgramFromSource: Failed to link program: ${gl.getProgramInfoLog(
          program
        )}`
      );
    } else {
      gl.deleteShader(vertex_shader);
      gl.deleteShader(fragment_shader);
    }

    return program;
  }

  static CREATE_AND_LOAD_BUFFER(gl, target, data, usage) {
    // Egy lepesben general GL buffert, bekoti es feltolti a kapott adattombbel.
    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-createAndLoadBuffer");

    const buffer = gl.createBuffer();

    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);

    return buffer;
  }

  // prettier-ignore
  static SETUP_INSTANCED_ATTRIBUTE(gl, attributeLocation, size, type, normalized, stride, offset, divisor) {
    // Az instanced attribute azt mondja meg, hogy egy adat hany példányonként valtson uj ertekre rajzolas kozben.
    if (!Number.isInteger(attributeLocation) || attributeLocation < 0) {
      throw new Error("WEBGL-setupInstancedAttribute: The provided attribute location is not valid!");
    }

    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-setupInstancedAttribute");

    gl.enableVertexAttribArray(attributeLocation);
    gl.vertexAttribPointer(attributeLocation, size, type, normalized, stride, offset);
    gl.vertexAttribDivisor(attributeLocation, divisor);
  }

  static GET_ATTRIB_LOCATIONS(gl, prog, vertexShaderSource, storage) {
    // A shader source-bol kikeresi az `in` deklaraciokat, es automatikusan lekerdezi a hozzajuk tartozo attribútumhelyeket.
    WebGL.THROW_NO_GL_ERROR(gl, "WEBGL-getAttribLocations");

    vertexShaderSource
      .split(";")
      .map((i) => i.replace(/\n/g, "").trim().replace(/\s+/g, " "))
      .filter((i) => i.startsWith("in"))
      .map((i) => i.split(" ")[2])
      .forEach((i) => (storage[i] = gl.getAttribLocation(prog, i)));

    return storage;
  }
}
