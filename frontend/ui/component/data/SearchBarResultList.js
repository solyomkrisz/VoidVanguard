import LazyItemList from "/ui/component/data/LazyItemList.js";

class SearchBarResultList extends LazyItemList {
  renderItem(item) {
    const div = document.createElement("div");

    div.innerHTML = `
        <img />
        <div>
            <div class="username">@${item.username}</div>
            ${item.display_name ? `<div class="display-name">${item.display_name}</div>` : ""}
        </div>
    `;

    return div;
  }

  extractItems(response) {
    return response?.result?.results;
  }
}

window.customElements.define("search-bar-result-list", SearchBarResultList);
