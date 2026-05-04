export function element(name, ...children) {
  const result = document.createElement(name);

  for (const child of children) {
    result.appendChild(child);
  }

  result.attr = function (name, value) {
    this.setAttribute(name, value);
    return this;
  };

  result.styl = function (name, value) {
    this.style[name] = value;
    return this;
  };

  result.insertInto = function (e = document.body) {
    e.appendChild(this);

    return this;
  };

  return result;
}

export function text(text) {
  return document.createTextNode(text);
}

export const dir = "/ui/style/"; //Default style directory

export function el(name, attrs = {}, children = []) {
  const node = document.createElement(name);

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;

    if (key === "class") {
      node.className = value;
      continue;
    }

    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
      continue;
    }

    if (typeof value === "boolean") {
      if (value) node.setAttribute(key, "");
      else node.removeAttribute(key);
      continue;
    }

    node.setAttribute(key, value);
  }

  for (const child of children) {
    node.append(child?.nodeType ? child : document.createTextNode(child));
  }

  return node;
}
