function result() {
  this.init = function () {
    this.tests = 0;
    this.failed = 0;
    this.successful = 0;

    return this;
  };

  this.see = function () {
    const maxLabelLength = Math.max(
      "Total tests".length,
      "Successful".length,
      "Failed".length,
    );

    const addPadding = function (label) {
      return label + ".".repeat(maxLabelLength - label.length + 3);
    };

    console.log(`\n${addPadding("Total tests")}: ${this.tests}
${addPadding("Successful")}: ${this.tests} / ${this.successful} (${((this.successful / this.tests) * 100).toFixed(2)}%)
${addPadding("Failed")}: ${this.tests} / ${this.failed} (${((this.failed / this.tests) * 100).toFixed(2)}%)\n
`);
  };

  this.init();
}

export function $(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function normalizeUrl(input) {
  if (typeof input === "string") return input;

  if (input instanceof Request) return input.url;

  if (input instanceof URL) return input.href;

  return String(input);
}

export function createFetchMock() {
  const routes = [];

  function matchRoute(rawUrl, method) {
    const url = normalizeUrl(rawUrl);

    return routes.find((route) => {
      if (route.method && route.method !== method) return false;

      if (route.url === url) return true;

      if (route.url.endsWith("/") && url.startsWith(route.url)) {
        return true;
      }

      return false;
    });
  }

  async function mockFetch(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    const route = matchRoute(url, method);

    if (!route) {
      console.warn(`No mock route for ${method}:${url}`);

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: "Not mocked" }),
        text: async () => "Not mocked",
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => route.response,
      text: async () => JSON.stringify(route.response),
    };
  }

  return {
    install() {
      if (!window.originalFetch) {
        window.originalFetch = globalThis.fetch;
      }
      globalThis.fetch = mockFetch;
    },

    restore() {
      if (window.originalFetch) {
        globalThis.fetch = window.originalFetch;
      }
    },

    mock({ url, method = "GET", response }) {
      routes.push({ url, method: method.toUpperCase(), response });
    },

    clear() {
      routes.length = 0;
    },
  };
}

// const mockFetch = createFetchMock();
// mockFetch.install();
// mockFetch.mock({
//   url: "/api/users",
//   method: "GET",
//   response: { value: null },
// });

export function getByText(root, text, { ignoreHidden = true } = {}) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    (node) => {
      if (!ignoreHidden) return NodeFilter.FILTER_ACCEPT;

      if (node.nodeType === Node.ELEMENT_NODE) {
        const style = getComputedStyle(node);

        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    },
  );

  let node;

  while ((node = walker.nextNode())) {
    if (node.textContent?.trim() === text) {
      return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    }
  }

  throw new Error(`Text not found: ${text}`);
}

export function queryByText(root, text) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );

  let node;

  while ((node = walker.nextNode())) {
    if (node.textContent?.includes(text)) {
      return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    }
  }

  return null;
}

export function waitFor(fn, timeout = 1000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      try {
        const result = fn();
        resolve(result);
      } catch (error) {
        if (Date.now() - start > timeout) {
          reject(error);
        } else {
          window.requestAnimationFrame(check);
        }
      }
    }

    check();
  });
}

export const results = new result().init();
const tests = [];

export function test(name, fn, log = false) {
  tests.push({ name, fn, log });
  results.tests++;
}

let beforeEachFn = null;

export function beforeEach(fn) {
  beforeEachFn = fn;
}

export async function run() {
  for (const { name, fn, log } of tests) {
    try {
      await beforeEachFn?.();

      await fn();
      await new Promise(requestAnimationFrame);
      await new Promise(queueMicrotask);

      log && console.log("[+]", name);
      results.successful++;
    } catch (error) {
      log && console.log("[-]", name, error);
      results.failed++;
    }
  }
}
