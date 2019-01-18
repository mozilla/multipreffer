this.Experiment = {
  async setup() {
    // Called the first time the study is setup - so only once.
  },

  async init(studyInfo) {
    // Called every time the add-on is loaded.
    if (studyInfo.isFirstRun) {
      this.setup();
    }
  },

  async cleanup() {
    // Called when the add-on is being removed for any reason.
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
