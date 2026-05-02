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
} = createTestSuite("BlockedUserList Test Suite");

const fetchMock = createFetchMock();
fetchMock.install();

beforeEach(() => {
  fetchMock.clear();
  document.body.innerHTML = "";
});

// Test 1: Ensure the blocked users list is rendered correctly
test("renders blocked users list", async () => {
  fetchMock.mock({
    url: "/api/blocks?targetId=testUser",
    response: {
      success: true,
      result: {
        blocks: [
          { userId: "blockedUser1", displayName: "Blocked User 1" },
          { userId: "blockedUser2", displayName: "Blocked User 2" },
        ],
        hasNext: false,
      },
    },
  });

  const blockedUserList = document.createElement("blocked-user-list");
  blockedUserList.setAttribute("user-id", "testUser");
  document.body.appendChild(blockedUserList);

  // Wait for the blocked users to render
  await waitFor(() => {
    getByText(document.body, "Blocked User 1");
    getByText(document.body, "Blocked User 2");
  });
});

export { run, results, fetchMock };
