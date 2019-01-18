this.Experiment = {
  async setup(studyInfo) {
    // Called the first time the study is setup - so only once.
    try {
      let res = await fetch(gExtension.getURL("prefs.json"));
      let prefs = await res.json();
      for (let name of Object.keys(prefs)) {
        if (Preferences.isSet(name)) {
          // One of the prefs has a user-set value, ABORT!!!
          // TODO: End the study/uninstall the addon?
          return;
        }
      }
      Preferences.set(prefs[this.studyInfo.variation.name].setValues);
    } catch (e) {
      Cu.reportError(e);
    }
  },

  async init(studyInfo) {
    // Called every time the add-on is loaded.
    this.studyInfo = studyInfo;
    console.log(`Multipreffer initializing. Cohort is "${studyInfo.variation.name}"`);
    if (studyInfo.isFirstRun) {
      this.setup();
    }
  },

  async cleanup() {
    // Called when the add-on is being removed for any reason.
    try {
      let res = await fetch(gExtension.getURL("prefs.json"));
      let prefs = await res.json();
      // TODO: Don't mess with prefs that the user modified while we
      // weren't looking.
      Preferences.reset(prefs[this.studyInfo.variation.name].resetDefaults);
      Preferences.set(prefs[this.studyInfo.variation.name].resetValues);
    } catch (e) {
      Cu.reportError(e);
    }
  },

  getString(aKey) {
    return FirefoxHooks.getString(aKey);
  },

  getFormattedString(aKey, args) {
    return FirefoxHooks.getFormattedString(aKey, args, args.length);
  },

  async sendTelemetry(payload) {
    await FirefoxHooks.notifyEventListeners(payload);
  },
};
