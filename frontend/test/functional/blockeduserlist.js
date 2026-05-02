import { createTestSuite } from "/common/functionaltest.js";
import BlockedUserList from "/ui/component/account/BlockedUserList.js";

const {
  createFetchMock,
  $,
  getByText,
  waitFor,
  test,
  beforeEach,
  run,
  results,
} = createTestSuite("BlockedUserList Tests");

const fetchMock = createFetchMock();
fetchMock.install();

beforeEach(() => {
  fetchMock.clear();
  document.body.innerHTML = "";
});

test("renders empty state when no blocked users are present", async () => {
  fetchMock.mock({
    url: "http://127.0.0.1:3000/api/blocks?targetId=testUser&page=1&limit=10",
    response: {
      success: true,
      result: {
        blocks: [],
        hasNext: false,
        page: 1,
        limit: 10,
        total: 0,
      },
    },
  });

  const blockedUserList = document.createElement("blocked-user-list");
  document.body.appendChild(blockedUserList);
  blockedUserList.setAttribute("user-id", "testUser");

  // wait for the empty state to render
  await waitFor(() => {
    getByText(document.body, "Nincsenek megjeleníthető felhasználók.");
  });
});

test("renders blocked users list", async () => {
  fetchMock.mock({
    url: "http://127.0.0.1:3000/api/blocks?targetId=testUser&page=1&limit=10",
    response: {
      success: true,
      result: {
        blocks: [
          { userId: "blockedUser1", name: "Blocked User 1" },
          { userId: "blockedUser2", name: "Blocked User 2" },
        ],
        hasNext: false,
        page: 1,
        limit: 10,
        total: 2,
      },
    },
  });

  const blockedUserList = document.createElement("blocked-user-list");
  document.body.appendChild(blockedUserList);
  blockedUserList.setAttribute("user-id", "testUser");

  // wait for the blocked users to render
  await waitFor(() => {
    getByText(document.body, "Blocked User 1");
    getByText(document.body, "Blocked User 2");
  });
});

test("renders multiple pages of blocked users", async () => {
  fetchMock.mock({
    url: "http://127.0.0.1:3000/api/blocks?targetId=testUser&page=1&limit=10",
    response: {
      success: true,
      result: {
        blocks: [
          { userId: "blockedUser1", name: "Blocked User 1" },
          { userId: "blockedUser2", name: "Blocked User 2" },
        ],
        hasNext: true,
        page: 1,
        limit: 10,
        total: 20,
      },
    },
  });

  fetchMock.mock({
    url: "http://127.0.0.1:3000/api/blocks?targetId=testUser&page=2&limit=10",
    response: {
      success: true,
      result: {
        blocks: [
          { userId: "blockedUser3", name: "Blocked User 3" },
          { userId: "blockedUser4", name: "Blocked User 4" },
        ],
        hasNext: false,
        page: 2,
        limit: 10,
        total: 20,
      },
    },
  });

  const blockedUserList = document.createElement("blocked-user-list");
  blockedUserList.setAttribute("controls", "pagination");
  document.body.appendChild(blockedUserList);
  blockedUserList.setAttribute("user-id", "testUser");

  // wait for the first page of blocked users to render
  await waitFor(() => {
    getByText(blockedUserList, "Blocked User 1");
    getByText(blockedUserList, "Blocked User 2");
  });

  const nextButton = getByText(blockedUserList, "Következő");
  console.log(nextButton);
  nextButton.click();

  // simulate clicking "Következő" to load the second page
  // blockedUserList.loadNextPage();

  // wait for the second page to render
  await waitFor(() => {
    getByText(blockedUserList, "Blocked User 3");
    getByText(blockedUserList, "Blocked User 4");
  });
});

export { run, results, fetchMock };
