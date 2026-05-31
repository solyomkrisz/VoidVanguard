/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/UI.js
 * Szerep: Kis DOM-epito helper fuggvenyek lancolhato attribútum- es stiluskezelessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export function element(name, ...children) {
  const result = document.createElement(name);

  for (const child of children) {
    result.appendChild(child);
  }

  // Ezek a rovid segedek azert vannak, hogy a kezi DOM-epites olvashatobb legyen.
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

    // Az onClick jellegu kulcsokbol automatikusan DOM esemenykezelo lesz.
    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
      continue;
    }

    // A boolean attribútumoknal a jelenlet szamit, nem a szoveges ertek.
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
