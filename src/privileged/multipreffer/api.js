/* globals ExtensionAPI */

Cu.importGlobalProperties(["fetch"]);

ChromeUtils.defineModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");
ChromeUtils.defineModuleGetter(this, "ExtensionCommon",
  "resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.defineModuleGetter(this, "AddonManager",
  "resource://gre/modules/AddonManager.jsm");
ChromeUtils.defineModuleGetter(this, "Preferences",
  "resource://gre/modules/Preferences.jsm");

let gExtension;

this.multipreffer = class extends ExtensionAPI {
  getAPI(context) {
    gExtension = context.extension;
    FirefoxHooks.init();

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
  init() {
    AddonManager.addAddonListener(this);
  },

  async setup() {
    // Called the first time the study is setup - so only once.
    const variationName = Preferences.get("extensions.multipreffer.test.variationName", this.studyInfo.variation.name);
    const prefs = this.variations[variationName].prefs;
    try {
      for (const name of Object.keys(prefs.setValues)) {
        if (Preferences.isSet(name)) {
          // One of the prefs has a user-set value, ABORT!!!
          // TODO: End the study/uninstall the addon?
          this.ABORT = true;
          return;
        }
      }
      Preferences.set(prefs.setValues);
    } catch (e) {
      Cu.reportError(e);
    }
  },

  async studyReady(studyInfo) {
    // Called every time the add-on is loaded.
    this.studyInfo = studyInfo;
    try {
      const res = await fetch(gExtension.getURL("variations.json"));
      this.variations = await res.json();
    } catch (e) {
      console.error("Failed to load variations!");
      return;
    }

    await this.setup();
  },

  async cleanup() {
    // Called when the add-on is being removed for any reason.
    if (this.ABORT) {
      return;
    }

    try {
      const variationName = Preferences.get("extensions.multipreffer.test.variationName", this.studyInfo.variation.name);
      const prefs = this.variations[variationName].prefs;
      const setValues = prefs.setValues;

      // Handle the prefs that need to be reset to default.
      const resetDefaults = [];
      for (const pref of prefs.resetDefaults) {
        if (Preferences.get(pref) === setValues[pref]) {
          // Pref value hasn't changed from what we set. Include it.
          resetDefaults.push(pref);
        }
      }
      Preferences.reset(resetDefaults);

      // Handle the prefs that need to be set to a specified value.
      const resetValues = prefs.resetValues;
      for (const [name, value] of Object.entries(setValues)) {
        if (Preferences.get(name) !== value) {
          // Pref was modified. Make sure it's not in the resetValues list.
          delete resetValues[name];
        }
      }
      Preferences.set(resetValues);
    } catch (e) {
      Cu.reportError(e);
    }
  },

  onUninstalling(addon) {
    this.handleDisableOrUninstall(addon);
  },

  onDisabled(addon) {
    this.handleDisableOrUninstall(addon);
  },

  async handleDisableOrUninstall(addon) {
    if (addon.id !== gExtension.id) {
      return;
    }
    await this.cleanup();
    AddonManager.removeAddonListener(this);
    // This is needed even for onUninstalling, because it nukes the addon
    // from UI. If we don't do this, the user has a chance to "undo".
    addon.uninstall();
  },
};
