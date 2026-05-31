/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/test/functional/core.js
 * Szerep: Frontend teszt: kliens oldali funkciok es feluleti viselkedes ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// prettier-ignore
import { createTestSuite} from "/common/functionaltest.js";
const {
  createFetchMock,
  $,
  getByText,
  waitFor,
  test,
  beforeEach,
  run,
  results,
} = createTestSuite("Test Tester Test");

// import components for test
import "/ui/component/profile/FullProfile.js";

class TestComponent extends HTMLElement {
  async connectedCallback() {
    const res = await fetch("/api/something");
    const data = await res.json();

    this.innerHTML = `<div>${data.value}</div>`;
  }
}

window.customElements.define("test-component", TestComponent);

const fetchMock = createFetchMock();

beforeEach(() => {
  fetchMock.install();
  fetchMock.clear();
  document.body.innerHTML = "";
});

test(
  "component renders API data",
  async () => {
    fetchMock.mock({
      url: "/api/something",
      method: "GET",
      response: { value: "hello" },
    });

    document.body.innerHTML = `<test-component></test-component>`;

    await waitFor(() => {
      getByText(document.body, "hello");
    });
  },
  true,
);

test(
  "profile component renders error for invalid user id",
  async () => {
    fetchMock.mock({ url: "/ui/style/" });

    document.body.innerHTML = `<full-profile user-id="testUser"></full-profile>`;

    await waitFor(() => {
      getByText(document.body, "Hiba történt a profil betöltése közben");
    });
  },
  true,
);

test(
  "profile component renders error for invalid response from /api/profiles/:id",
  async () => {
    fetchMock.mock({ url: "/ui/style/" });
    fetchMock.mock({ url: "/api/profiles/testUser" });

    document.body.innerHTML = `<full-profile user-id="testUser"></full-profile>`;

    await waitFor(() => {
      getByText(document.body, "Hiba történt a profil betöltése közben");
    });
  },
  true,
);

test(
  "profile component renders as intended",
  async () => {
    fetchMock.mock({ url: "/ui/style/" });
    fetchMock.mock({
      url: "/api/profiles/testUser",
      response: {
        success: true,
        result: {
          user_id: "testUser",
          avatar: null,
          display_name: "TESZT FELHASZNÁLÓ",
          description: "Teszt szöveg...",
          friendship_status: "not-blocked",
          block_status: "not-blocked",
        },
        message: "Profile fetched successfully",
      },
    });

    document.body.innerHTML = `<full-profile user-id="testUser"></full-profile>`;

    await waitFor(() => {
      getByText(document.body, "TESZT FELHASZNÁLÓ");
      getByText(document.body, "Teszt szöveg...");
    });
  },
  true,
);

// await run();
// results.see();
// fetchMock.restore();
export { run, results, fetchMock };
