/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/profile/ProfileFormRestorer.js
 * Szerep: Profiladatokat kepez le a profilurlap megfelelo mezoihez.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/ui/component/profile/ProfileForm.js";

export default class ProfileFormRestorer extends FormRestorer {
  // Szerver-mezo -> form mezonev megfeleltetes.
  static mapping = {
    avatar: "avatar",
    display_name: "display_name",
    description: "description",
    visibility: "visibility",
  };

  getEndpoint() {
    return "/api/profiles/" + this.getAttribute("user-id");
  }
}

window.customElements.define("profile-form-restorer", ProfileFormRestorer);
