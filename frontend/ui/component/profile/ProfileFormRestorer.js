import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/ui/component/profile/ProfileForm.js";

export default class ProfileFormRestorer extends FormRestorer {
  static mapping = {
    display_name: "display_name",
    description: "description",
    visibility: "visibility",
  };

  getEndpoint() {
    return "/api/profiles/" + this.getAttribute("user-id") + "?view=admin";
  }
}

window.customElements.define("profile-form-restorer", ProfileFormRestorer);
