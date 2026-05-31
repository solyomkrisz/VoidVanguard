/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/functionaltest.js
 * Szerep: Bongeszos functional teszt segedek UI-szcenariok futtatasahoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { result } from "/common/common.js";

// Egyszeru functional-teszt keszletet ad DOM-hoz, mock fetchhez es aszinkron varakozashoz.
export function createTestSuite(title = "Test Suite") {
  const results = new result().init();
  results.title = title;
  const tests = [];
  let beforeEachFn = null;

  // CSS selector alapjan tombbe gyujti a talalatokat.
  function $(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  // Kulonbozo URL-formatumokat egységes string alakka alakit a mockolo retegnek.
  function normalizeUrl(input) {
    if (typeof input === "string") return input;

    if (input instanceof Request) return input.url;

    if (input instanceof URL) return input.href;

    return String(input);
  }

  // Mock fetch gyarat keszit route-tablaval es hivas-szamlalassal.
  function createFetchMock() {
    const routes = [];
    let calls = 0;

    // Megkeresi, melyik kamu route illik az adott kerésre.
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

    // A browser fetch helyett ezt futtatjuk a teszt alatt, hogy fix valaszokat kapjunk.
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

  // Kikeres egy pontos szoveget a DOM-bol, es hiba helyett nem csendben bukik el.
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

  // Lazabb szovegkereso: reszleges egyezest is elfogad, es nullt ad vissza, ha nincs talalat.
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

  // Addig probal ujra egy ellenorzest, amig sikerul vagy le nem jar az ido.
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

  // Felvesz egy uj tesztesetet a kesobb futtathato listaba.
  function test(name, fn, log = false) {
    tests.push({ name, fn, log });
    results.tests++;
  }

  // Opcionális elokeszitot allit be, ami minden teszt elott lefut.
  function beforeEach(fn) {
    beforeEachFn = fn;
  }

  // Sorban lefuttatja az osszes regisztralt tesztet, es frissiti a statisztikakat.
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
