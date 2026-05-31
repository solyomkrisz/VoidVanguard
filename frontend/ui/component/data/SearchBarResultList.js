/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/data/SearchBarResultList.js
 * Szerep: Keresesi talalatlista a LazyItemList-re epitett egyszeru adapterrel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import LazyItemList from "/ui/component/data/LazyItemList.js";

class SearchBarResultList extends LazyItemList {
  renderItem(item) {
    // Itt csak azt adjuk meg, hogyan nez ki egyetlen elem; a lapozast es a toltést maga a LazyItemList intezi.
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
