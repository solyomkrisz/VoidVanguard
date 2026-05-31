/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/test/functional/appmodal.js
 * Szerep: Frontend teszt: kliens oldali funkciok es feluleti viselkedes ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { createTestSuite } from "/common/functionaltest.js";
import AppModal from "/ui/component/feedback/AppModal.js"; // Import your modal component

const {
  createFetchMock,
  $,
  getByText,
  waitFor,
  test,
  beforeEach,
  afterEach,
  run,
  results,
} = createTestSuite("App Modal Tests");

const fetchMock = createFetchMock();
fetchMock.install();

beforeEach(() => {
  fetchMock.clear();
  document.body.innerHTML = "";
});

test(
  "modal opens with correct data",
  async () => {
    const modal = document.createElement("app-modal");
    document.body.appendChild(modal);

    // open modal but dont await so the rest of the code runs (await only resolves if either button is clicked inside the modal)
    const openResult = modal.open({
      title: "Test Modal",
      message: "This is a test message",
    });

    // wait for modal content to appear
    await waitFor(() => {
      const titleElement = modal.shadowRoot.querySelector(".modal-title");
      const messageElement = modal.shadowRoot.querySelector(".modal-message");
      if (!titleElement || !messageElement) {
        throw new Error("Modal content is not rendered yet");
      }
    });

    // now that the modal is open, find the confirm button and click it
    const confirmButton = modal.shadowRoot.querySelector(
      ".modal-confirm-button",
    );

    if (!confirmButton) {
      throw new Error("Confirm button not found in the modal");
    }

    // click the confirm button to close the modal
    confirmButton.click();

    // wait for the modal to close and the promise from open to resolve
    const result = await openResult;

    if (!result) {
      throw new Error("The result does not represent the chosen state");
    }
  },
  true,
);

test(
  "modal closes with correct data when cancel button is clicked",
  async () => {
    const modal = document.createElement("app-modal");
    document.body.appendChild(modal);

    // open the modal
    const openResult = modal.open({
      title: "Test Modal",
      message: "This is a test message",
    });

    // wait for modal content to appear
    await waitFor(() => {
      const titleElement = modal.shadowRoot.querySelector(".modal-title");
      const messageElement = modal.shadowRoot.querySelector(".modal-message");
      if (!titleElement || !messageElement) {
        throw new Error("Modal content is not rendered yet");
      }
    });

    // now that the modal is open, find the cancel button and click it
    const cancelButton = modal.shadowRoot.querySelector(".modal-cancel-button");

    if (!cancelButton) {
      throw new Error("Cancel button not found in the modal");
    }

    // click the cancel button to close the modal
    cancelButton.click();

    // wait for the modal to close and the promise from open to resolve
    const result = await openResult;

    if (result) {
      throw new Error("The modal should not resolve with 'true' on cancel");
    }
  },
  true,
);

test(
  "modal does not open twice",
  async () => {
    const modal = document.createElement("app-modal");
    document.body.appendChild(modal);

    // open the modal
    const openResult = modal.open({
      title: "Test Modal",
      message: "This is a test message",
    });

    // attempt to open it again before the first one resolves
    const secondOpenResult = modal.open({
      title: "Second Test Modal",
      message: "This is a second test message",
    });

    // wait for modal content to appear
    await waitFor(() => {
      const titleElement = modal.shadowRoot.querySelector(".modal-title");
      const messageElement = modal.shadowRoot.querySelector(".modal-message");
      if (!titleElement || !messageElement) {
        throw new Error("Modal content is not rendered yet");
      }
    });

    // click the confirm button to close the modal
    const confirmButton = modal.shadowRoot.querySelector(
      ".modal-confirm-button",
    );
    confirmButton.click();

    // wait for the first modal to close
    const firstResult = await openResult;

    // wait for the second modal to resolve but it should not open
    const secondResult = await secondOpenResult;

    if (secondResult) {
      throw new Error("The second modal should not have been opened");
    }

    if (!firstResult) {
      throw new Error(
        "The first modal should resolve with 'true' when confirmed",
      );
    }
  },
  true,
);

test(
  "modal updates with new data after closing",
  async () => {
    const modal = document.createElement("app-modal");
    document.body.appendChild(modal);

    // open the modal with initial data
    const firstOpenResult = modal.open({
      title: "First Modal",
      message: "This is the first message",
    });

    // wait for the modal to be rendered
    await waitFor(() => {
      const titleElement = modal.shadowRoot.querySelector(".modal-title");
      const messageElement = modal.shadowRoot.querySelector(".modal-message");
      if (!titleElement || !messageElement) {
        throw new Error("Modal content is not rendered yet");
      }
    });

    // confirm and close the first modal
    const confirmButton = modal.shadowRoot.querySelector(
      ".modal-confirm-button",
    );
    confirmButton.click();

    // wait for the first modal to close
    await firstOpenResult;

    // now open the modal with new data
    const secondOpenResult = modal.open({
      title: "Second Modal",
      message: "This is the second message",
    });

    // wait for the modal content to be rendered again with new data
    await waitFor(() => {
      const titleElement = modal.shadowRoot.querySelector(".modal-title");
      const messageElement = modal.shadowRoot.querySelector(".modal-message");
      if (!titleElement || !messageElement) {
        throw new Error("Modal content is not rendered yet");
      }
      if (
        titleElement.textContent !== "Second Modal" ||
        messageElement.textContent !== "This is the second message"
      ) {
        throw new Error("Modal did not update with the new data");
      }
    });

    // confirm and close the second modal
    confirmButton.click();

    // wait for the second modal to close
    const result = await secondOpenResult;

    if (!result) {
      throw new Error(
        "The second modal should resolve with 'true' when confirmed",
      );
    }
  },
  true,
);

test(
  "modal respects custom button labels",
  async () => {
    const modal = document.createElement("app-modal");
    document.body.appendChild(modal);

    // open the modal with custom button labels
    const openResult = modal.open({
      title: "Test Modal",
      message: "This is a test message",
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "No, Cancel",
    });

    // wait for modal content to appear
    await waitFor(() => {
      const confirmButton = modal.shadowRoot.querySelector(
        ".modal-confirm-button",
      );
      const cancelButton = modal.shadowRoot.querySelector(
        ".modal-cancel-button",
      );

      if (!confirmButton || !cancelButton) {
        throw new Error("Buttons are not rendered yet");
      }

      if (confirmButton.textContent !== "Yes, Confirm") {
        throw new Error("Confirm button text is incorrect");
      }

      if (cancelButton.textContent !== "No, Cancel") {
        throw new Error("Cancel button text is incorrect");
      }
    });

    // close the modal by clicking the confirm button
    const confirmButton = modal.shadowRoot.querySelector(
      ".modal-confirm-button",
    );
    confirmButton.click();

    // wait for the modal to close and resolve
    const result = await openResult;

    if (!result) {
      throw new Error("The modal should resolve with 'true' when confirmed");
    }
  },
  true,
);

// await run();
// results.see();
export { run, results, fetchMock };
