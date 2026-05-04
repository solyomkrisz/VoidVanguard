import { result } from "/common/common.js";

export function createTestSuite(title = "Test Suite") {
  const results = new result().init();
  results.title = title;
  const tests = [];
  let beforeEachFn = null;

  function $(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function normalizeUrl(input) {
    if (typeof input === "string") return input;

    if (input instanceof Request) return input.url;

    if (input instanceof URL) return input.href;

    return String(input);
  }

  function createFetchMock() {
    const routes = [];
    let calls = 0;

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

      calls++;

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
        calls = 0;
      },

      getCallCount() {
        return calls;
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

  function getByText(root, text, { ignoreHidden = true } = {}) {
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

  function queryByText(root, text) {
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

  function waitFor(fn, timeout = 1000) {
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

  function test(name, fn, log = false) {
    tests.push({ name, fn, log });
    results.tests++;
  }

  function beforeEach(fn) {
    beforeEachFn = fn;
  }

  async function run() {
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

  return {
    results,
    test,
    beforeEach,
    createFetchMock,
    $,
    getByText,
    waitFor,
    test,
    run,
  };
}
