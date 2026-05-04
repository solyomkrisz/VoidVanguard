import { debounce } from "../../../common/common.js";
import * as net from "../../common/network.js";
import { on, off } from "/common/eventhub.js";

function listResults(results, container, template, { append = false } = {}) {
  if (!append) {
    container.innerHTML = "";
  }

  for (const result of results) {
    console.log(result);
    const fragment = template.content.cloneNode(true);

    Array.from(fragment.querySelectorAll("[data-bind]")).forEach((e) => {
      const bindTarget = e.getAttribute("bind-target") || "textContent";
      e[bindTarget] = result[e.dataset.bind] ?? e.dataset.default ?? "";
    });

    const avatarShell = fragment.querySelector(".searchbox-avatar-shell");
    const avatarImage = avatarShell?.querySelector("img");

    if (avatarShell && avatarImage) {
      const hasProfile =
        result?.has_profile !== false && result?.has_profile !== 0;

      avatarShell.classList.toggle("no-profile-avatar", !hasProfile);
      avatarImage.classList.toggle("no-profile-avatar", !hasProfile);

      if (!hasProfile) {
        avatarImage.src = "/image/defaultPfp.png";
      } else if (!avatarImage.src) {
        avatarImage.src = "/image/defaultPfp.png";
      }
    }

    container.appendChild(fragment);
  }
}

export default function Searchbox(target, url, getIterable, options = {}) {
  const resolvedOptions =
    typeof options === "boolean" ? { isProtected: options } : options;
  const isProtected = resolvedOptions?.isProtected ?? true;

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

  let currentQuery = "";
  let page = 1;
  let hasNext = false;
  let loading = false;
  let queryVersion = 0;
  const PAGE_SIZE = 20;

  const buildSearchUrl = (query, targetPage) =>
    `${url}${encodeURIComponent(query)}&page=${targetPage}&limit=${PAGE_SIZE}`;

  async function fetchPage({ reset = false } = {}) {
    if (!currentQuery || loading) return;

    loading = true;
    const versionAtStart = queryVersion;
    const targetPage = reset ? 1 : page + 1;

    try {
      const response = await net.send(
        buildSearchUrl(currentQuery, targetPage),
        { method: "GET" },
        isProtected,
      );

      // Ignore outdated responses when the query changed meanwhile.
      if (versionAtStart !== queryVersion) return;

      const results = getIterable(response) || [];
      listResults(results, div, template, { append: !reset });

      page = targetPage;
      hasNext = Boolean(response?.result?.hasNext);
    } finally {
      loading = false;
    }
  }

  const handleInput = debounce(async ({ target }) => {
    const value = target.value.trim();

    if (!value) {
      div.innerHTML = "";
      currentQuery = "";
      page = 1;
      hasNext = false;
      return;
    }

    currentQuery = value;
    queryVersion += 1;
    page = 0;
    hasNext = false;

    await fetchPage({ reset: true });
  }, 1000);

  input.addEventListener("input", handleInput);

  input.addEventListener("focus", () => (div.hidden = false));
  div.addEventListener("scroll", () => {
    if (loading || !hasNext) return;

    const threshold = 48;
    const nearBottom =
      div.scrollTop + div.clientHeight >= div.scrollHeight - threshold;
    if (nearBottom) {
      fetchPage({ reset: false });
    }
  });

  on("pointerdown", ({ target }) => {
    if (!searchbox.contains(target)) {
      div.hidden = true;
    }
  });
}
