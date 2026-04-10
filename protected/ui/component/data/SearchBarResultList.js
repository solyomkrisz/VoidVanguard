import LazyItemList from "/ui/component/data/LazyItemList.js";

class SearchBarResultList extends LazyItemList {
  get useEvent() {
    return this.hasAttribute("use-event");
  }

  renderItem(item) {
    const div = document.createElement("div");

    div.innerHTML = `
        <img />
        <div>
          <div class="username">@${item.username}</div>
          ${item.display_name ? `<div class="display-name">${item.display_name}</div>` : ""}
        </div>
        <div>
          <button id="disguise-button">Álcázás mint</button>
          <button id="open-profile-button">Profil megnyitása</button>
        </div>
    `;

    const openProfileButton = div.querySelector("#open-profile-button");
    openProfileButton.addEventListener("click", () => {
      const fullProfile = document.querySelector("full-profile");
      if (!fullProfile) return;

      fullProfile.setAttribute("user-id", item.id);

      const container = document.querySelector("#full-profile-container");
      if (!container) return;

      container.classList.add("active");
    });

    const disguiseButton = div.querySelector("#disguise-button");
    disguiseButton.addEventListener("click", () => {
      if (this.useEvent) {
        this.dispatchEvent(
          new CustomEvent("target-user-change", {
            detail: {
              targetUserId: item.id,
            },
            bubbles: true,
            composed: true,
          }),
        );

        return;
      }

      const modules = document.querySelectorAll("admin-module");

      for (const module of modules) {
        module.setAttribute("target-user-id", item.id);
      }
    });

    return div;
  }

  extractItems(response) {
    return response?.result?.results;
  }
}

window.customElements.define("search-bar-result-list", SearchBarResultList);
