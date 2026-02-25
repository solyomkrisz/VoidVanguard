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
