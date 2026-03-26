import { debounce } from "../../../common/common.js";
import * as net from "../../common/network.js";
import { on, off } from "/common/eventhub.js";

function listResults(results, container, template) {
  container.innerHTML = "";

  for (const result of results) {
    const fragment = template.content.cloneNode(true);

    Array.from(fragment.querySelectorAll("[data-bind]")).forEach((e) => {
      const bindTarget = e.getAttribute("bind-target") || "textContent";
      e[bindTarget] = result[e.dataset.bind];
    });

    container.appendChild(fragment);
  }
}

export default function Searchbox(target, url, getIterable) {
  let searchbox;

  if (typeof target === "string") {
    searchbox = document.querySelector(target);
  } else {
    searchbox = target;
  }

  const input = searchbox.querySelector("input");
  const div = searchbox.querySelector("div");
  const template = searchbox.querySelector("template");

  if (!input || !div || !template) {
    throw new Error("Unable to initialize searchbox. Invalid structure.");
  }

  const handleInput = debounce(async ({ target }) => {
    const value = target.value;

    if (!value) {
      div.innerHTML = "";
      return;
    }

    const response = await net.send(url + value);
    listResults(getIterable(response), div, template);
  }, 1000);

  input.addEventListener("input", handleInput);

  input.addEventListener("focus", () => (div.hidden = false));
  on("pointerdown", ({ target }) => {
    if (!searchbox.contains(target)) {
      div.hidden = true;
    }
  });
}
