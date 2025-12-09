const DEFAULT_CSS = `
  position: absolute;
  z-index: 1001;
  user-select: none;
  pointer-events: none;
  max-width: 250px;
  /*background-color: #EEE;
  color: #000;
  border-radius: 8px;*/
  overflow-wrap: break-word;
  word-break: break-word;
`;

export default class Tooltip {
  // prettier-ignore
  constructor(element = null) {
    this.element = element;
    this.domRect = null;
    element && (this.domRect = element.getBoundingClientRect());
    this.isFollowing = false;
    this.mouse = {
      clientX: 0,
      clientY: 0,
      getX() { return this.clientX; },
      getY() { return this.clientY; },
    };
    this.onMouseMove = this.onMouseMove.bind(this);
    this.anchor = null;
    this.frameId = null;
    this.layout = {};
    this.offset = { x: 10, y: 0 };
    this.update = this.update.bind(this);
  }

  init() {
    if (this.element) return this;

    const el = document.createElement("div");
    el.style.cssText = DEFAULT_CSS;
    el.classList.add("tooltip");
    document.body.appendChild(el);
    this.domRect = el.getBoundingClientRect();
    this.element = el;
  }

  onMouseMove(e) {
    this.mouse.clientX = e.clientX;
    this.mouse.clientY = e.clientY;

    this.setPosition();
  }

  enableMouseFollow() {
    if (this.isFollowing) return;
    this.isFollowing = true;
    this.anchor = this.mouse;
    document.addEventListener("mousemove", this.onMouseMove);
  }

  disableMouseFollow() {
    if (!this.isFollowing) return;
    this.isFollowing = false;
    this.anchor = null;
    document.removeEventListener("mousemove", this.onMouseMove);
  }

  setPosition() {
    const s = this.element.style;

    let l = this.anchor.getX() - this.domRect.width - this.offset.x;
    let t = this.anchor.getY() - this.domRect.height / 2 - this.offset.y;

    t < 0 && (t = 0 + this.offset.y);
    l < 0 && (l = this.anchor.getX() + this.offset.x);

    s.left = l + "px";
    s.top = t + "px";
  }

  show() {
    if (this.element.getAttribute("visible") === "true") return;

    this.element.setAttribute("visible", "true");
    this.element.style.display = "block";
  }

  hide() {
    if (this.element.getAttribute("visible") === "false") return;

    this.element.setAttribute("visible", "false");
    this.element.style.display = "none";
  }

  reset() {
    return;
  }

  setContent(html) {
    if (!this.anchor) return;
    if (this.element.children[0] === html) return;
    this.element.appendChild(html);
    queueMicrotask(() => (this.domRect = this.element.getBoundingClientRect()));
  }

  onUpdate() {
    if (!this.isFollowing) return;
    this.reset();
  }

  update() {
    this.onUpdate();
    this.frameId = requestAnimationFrame(this.update);
  }

  // prettier-ignore
  createLayout(id, layout) {
    const sections = layout.split("------").map((i) => i.trim()).filter((i) => i).map((i) => i.replace(/\s+/g, " "));
    const template = {};

    const html = document.createElement("div");
    html.style.display = "flex";
    html.style.flexDirection = "column";
    html.style.gap = "10px";

    for (const section of sections) {
      const lines = section.split("/").map((i) => i.replace(/\s+/g, " ").trim()).filter((i) => i);
      const afterSectionStart = lines[0].split("->")[1].trim();
      const firstLine = afterSectionStart.split("|").filter((i) => i);
      const sectionId = firstLine[0].trim();
      const style = firstLine[1].trim();
      template[sectionId] = {};

      const sectionDiv = document.createElement("div");
      sectionDiv.style.cssText = style;
      const title = document.createElement("div");
      title.textContent = sectionId.toUpperCase();
      sectionDiv.appendChild(title);
      sectionDiv.appendChild(document.createElement("hr"));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        const div = document.createElement("div");
        const span = document.createElement("span");
        span.textContent = line + ": ";
        div.appendChild(span);

        const field = document.createElement("span");
        field.setAttribute("id", line);
        div.appendChild(field);

        sectionDiv.appendChild(div);
        template[sectionId][line] = { html: div, field };
        html.appendChild(sectionDiv);
      }
    }

    template.html = html;
    this.layout[id] = template;
  }
}
