/* globals ExtensionAPI */

Cu.importGlobalProperties(["fetch"]);

ChromeUtils.defineModuleGetter(this, "AddonManager",
  "resource://gre/modules/AddonManager.jsm");
ChromeUtils.defineModuleGetter(this, "Preferences",
  "resource://gre/modules/Preferences.jsm");
const DefaultPreferences = new Preferences({ defaultBranch: true });

let gExtension;

this.multipreffer = class extends ExtensionAPI {
  getAPI(context) {
    gExtension = context.extension;
    return {
      multipreffer: {
        async studyReady(studyInfo) {
          await FirefoxHooks.studyReady(studyInfo);
        },
      },
    };
  }
};

this.FirefoxHooks = {
  // Default branch prefs can't be "reset" since they ARE
  // (supposed to be) the defaults. So in order to reset
  // them at cleanup, we cache the values of our target
  // prefs in this object before modifying them.
  _oldDefaultValues: {},
  async studyReady(studyInfo) {
    // Called every time the add-on is loaded.
    try {
      const res = await fetch(gExtension.getURL("variations.json"));
      this.variations = await res.json();
    } catch (e) {
      console.error("Failed to load variations!");
      return;
    }

    const variationName =
      Preferences.get(
        "extensions.multipreffer.test.variationName", studyInfo.variation.name);

    const prefs = this.variations[variationName].prefs;

    for (const pref of Object.keys(prefs)) {
      let val = Preferences.get(pref);
      if (val === undefined) {
        // If undefined, save it as a false-y value.
        // This is the best we can do to reset it at cleanup
        // since there's no way to clear the value of a pref
        // on the default branch.
        switch (typeof prefs[pref]) {
          case "string":
            val = "";
            break;
          case "boolean":
            val = false;
            break;
          case "number":
            val = 0;
            break;
        }
      }
      this._oldDefaultValues[pref] = val;
    }

    DefaultPreferences.set(prefs);

    AddonManager.addAddonListener(this);
  },

  cleanup() {
    // Called when the add-on is being removed for any reason.
    DefaultPreferences.set(this._oldDefaultValues);
  },

  async onUninstalling(addon) {
    if (addon.id !== gExtension.id) {
      return;
    }
    this.cleanup();
    AddonManager.removeAddonListener(this);
  },
};
