export function element(name, ...children) {
  const result = document.createElement(name);

  for (const child of children) {
    result.appendChild(child);
  }

  result.insertInto = function (e = document.body) {
    e.appendChild(this);

    return this;
  };

  return result;
}

export function text(text) {
  return document.createTextNode(text);
}

export const dir = "./ui/style/"; //Default style directory
