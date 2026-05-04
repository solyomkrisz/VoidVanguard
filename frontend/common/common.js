import * as net from "/common/network.js";
import { isExpired, decode } from "/common/jwt.js";

if (!window.VoidVanguard) {
  window.VoidVanguard = {};
}

export const DATA_STRUCTURE =
  typeof Float32Array !== "undefined" ? Float32Array : Array;

export const EPSILON = 0.01;

export function LERP(a, b, alpha) {
  return a + (b - a) * alpha;
}

export function getAngleDiff(a, b) {
  const diff = a - b;
  return Math.atan2(Math.sin(diff), Math.cos(diff));
}

export function getMinMaxXY(
  target,
  objects,
  getX = (o) => o.localPosition[0],
  getY = (o) => o.localPosition[1],
) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const object of objects) {
    const x = getX(object);
    const y = getY(object);

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  target.push(minX, minY, maxX, maxY);

  return target;
}

export function isAdjacent(objects, i, x, y) {
  const [ox, oy] = objects[i].localPosition;
  const dx = Math.abs(x - ox);
  const dy = Math.abs(y - oy);
  return dx + dy === 1;
}

export function mulberry32(seed) {
  return {
    random: function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function clamp(n, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function inCircle(x, y, u, v, r) {
  return (x - u) * (x - u) + (y - v) * (y - v) <= r * r;
}

export function extractForm(form, includeEmpty = false) {
  if (!(form instanceof HTMLFormElement)) {
    return console.error("Received a non-form element");
  }
  const result = {};
  for (const [key, value] of new FormData(form)) {
    if (!includeEmpty && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

export const path = Object.freeze({
  join: function (a, b) {
    return a + b;
  },
});

//#region login stuff start
export function isLoggedIn() {
  return Boolean(window.VoidVanguard?.user?.id);

  // return Boolean(localStorage.getItem("access_token"));

  // const token = localStorage.getItem("access_token");
  // return token && !isExpired(token, 10);
}

export function isUserSet() {
  return Boolean(window.VoidVanguard?.user);
}

export async function isLoggedInAsync() {
  const response = await net.send("/api/sessions", { method: "POST" });

  if (response?.success && response?.result) {
    return true;
  }

  return false;
}

export function isAdmin() {
  return isLoggedIn() && window.VoidVanguard.user?.role >= 1;
}

// auto login
window.addEventListener("storage", (event) => {
  if (event.key !== "access_token") return;

  const hadToken = !!event.oldValue;
  const hasToken = !!event.newValue;

  // login sync (another tab)
  if (!hadToken && hasToken) {
    setUser(decode(event.newValue), { source: "storage" });
  }

  // logout sync (another tab)
  if (hadToken && !hasToken) {
    dispatchLogoutEvent();
  }
});

export async function setUser(userdata, { origin = "unknown" } = {}) {
  if (!window?.VoidVanguard) {
    window.VoidVanguard = {};
  }

  const current = window.VoidVanguard?.user;

  // prevent duplicate login events
  if (current?.id === userdata?.id) return;

  window.VoidVanguard.user = { ...userdata };

  console.log("User set and login event fired with origin:", origin);
  document.dispatchEvent(
    new CustomEvent("login", {
      detail: {
        user: { ...userdata },
        origin,
      },
      bubbles: true,
      composed: true,
    }),
  );
}

export async function autologin() {
  try {
    const response = await net.send("/api/sessions", { method: "POST" });

    if (response.success) {
      setUser(response.result, { origin: "autologin" });
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

export async function onDOMContentLoaded({ requireAuth = false } = {}) {
  const ok = await autologin();
  if (requireAuth && !ok) {
    window.location.href = "/";
  }
}

export async function logout() {
  const token = localStorage.getItem("access_token");

  if (!isLoggedIn() && !token) {
    console.log(
      "Login helper function returned early, due to being not logged in",
    );
    return;
  }

  try {
    if (token) {
      const response = await fetch("/api/tokens", {
        method: "DELETE",
        credentials: "include",
      });

      /**
       * we must remove the access_token from localStorage after the server finishes with its part of logging out
       * if we don't do this, then the above event listener for the storage event completely runs in all other tabs
       * in which we still have a refresh token since this function's refresh token deletion part (fetch) didn't run yet
       * so they do their onLogout tasks which probably include fetching. If they do, then since we still have valid
       * refresh token, they succeed, get a new access_token and save it in localStorage. Then we come back here
       * where the server part of logout runs -> deletes refresh token and dispatches logout event.
       *
       * When this event is dispatched what we have is:
       * - no refresh token
       * - probably access token because we deleted that before deleting refresh token and so other pages renewed them
       *
       * so we are left with an access token that cannot be refreshed and the page shows that we are logged in.
       *
       * the solution is that we must delete the access token from localstorage after clearing refresh token
       * so when the storage event runs the other tabs cannot refresh the access token and put it back
       */
      localStorage.removeItem("access_token");

      if (!response.ok) {
        throw new Error("Logout failed");
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  dispatchLogoutEvent();

  return true;
}

export function dispatchLogoutEvent() {
  let detail = { oldId: null, newId: null };

  if (window?.VoidVanguard?.user) {
    const oldId = window.VoidVanguard.user?.id;

    if (oldId) {
      detail.oldId = oldId;
    }

    window.VoidVanguard.user = {};
  }

  document.dispatchEvent(new CustomEvent("logout", { detail }));
}
//#region login stuff end

export function debounce(fn, delay) {
  let timerId;

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function isIndex(key) {
  return String(Number(key)) === key;
}

export function lookupProperty(root, path = "") {
  let current = root;
  if (current == null) return current;

  for (const part of path.split(".")) {
    const key = isIndex(part) ? Number(part) : part;

    current = current[key];

    if (current == null) {
      return current;
    }
  }

  return current;
}

export function isEqual(obja, objb, path = "") {
  const vala = lookupProperty(obja, path);
  const valb = lookupProperty(objb, path);

  return Object.is(vala, valb);
}

export function setFieldValue(field, value) {
  if (field instanceof RadioNodeList) {
    Array.from(field).forEach((input) => {
      input.checked = input.value === String(value ?? "");
    });
    return;
  }

  if (field.type === "checkbox") {
    field.checked = Boolean(value);
  } else if (
    field.tagName === "SELECT" &&
    field.multiple &&
    Array.isArray(value)
  ) {
    Array.from(field.options).forEach((option) => {
      option.selected = value.includes(option.value);
    });
  } else {
    field.value = value ?? "";
  }
}

export function formatDate(ts) {
  const date = new Date(ts);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}`
  );
}

export function getLocalSaves() {
  const parsed = JSON.parse(window.localStorage.getItem("localSaves"));
  return new Map(Array.isArray(parsed) ? parsed : []);
}

export function isInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

//#region for testing
export function result() {
  this.title = "Untitled";

  this.init = function () {
    this.features = 0;
    this.tests = 0;
    this.failed = 0;
    this.successful = 0;

    return this;
  };

  this.see = function () {
    const maxLabelLength = Math.max(
      "Features tested".length,
      "Total tests".length,
      "Successful".length,
      "Failed".length,
    );

    const addPadding = function (label) {
      return label + ".".repeat(maxLabelLength - label.length + 3);
    };

    console.log(`\n===== ${this.title} =====\n
${addPadding("Features tested")}: ${this.features}
${addPadding("Total tests")}: ${this.tests}
${addPadding("Successful")}: ${this.tests} / ${this.successful} (${((this.successful / this.tests) * 100).toFixed(2)}%)
${addPadding("Failed")}: ${this.tests} / ${this.failed} (${((this.failed / this.tests) * 100).toFixed(2)}%)\n
`);
  };

  this.init();
}
