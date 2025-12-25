export function element(name, ...children) {
  const result = document.createElement(name);

  for (const child of children) {
    result.appendChild(child);
  }

  return result;
}

export function text(text) {
  return document.createTextNode(text);
}
