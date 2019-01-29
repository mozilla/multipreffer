/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const {assert} = require("chai");
const utils = require("./utils");

const allPrefs = [
  "pref1",
];

async function checkPrefs(driver, prefs) {
  for (const pref of allPrefs) {
    if (prefs[pref] !== undefined) {
      const val = await utils.getPreference(driver, pref);
      assert.equal(val, prefs[pref], `set the right pref for ${pref}`);
    } else {
      const hasUserValue = await utils.prefHasUserValue(driver, pref);
      assert.isFalse(hasUserValue, `${pref} is set to the default`);
    }
  }
}

describe("setup and teardown", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;

  // runs ONCE
  before(async () => {
    driver = await utils.setupWebdriver.promiseSetupDriver(
      utils.FIREFOX_PREFERENCES,
    );
  });

  after(() => {
    driver.quit();
  });

  describe("sets up the correct prefs, depending on the variation", function() {
    const SETUP_DELAY = 500;
    let addonId;

    describe("sets the correct prefs for variation Control", () => {
      before(async () => {
        await utils.setPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName", "Control");
        addonId = await utils.setupWebdriver.installAddon(driver);
        await driver.sleep(SETUP_DELAY);
      });

      it("has the correct prefs after install", async () => {
        await checkPrefs(driver, {
          "security.pki.distrust_ca_policy": 1,
          "browser.contentblocking.ui.enabled": false,
          "browser.fastblock.enabled": false,
        });
      });

      it("has the correct prefs after uninstall", async () => {
        await utils.setupWebdriver.uninstallAddon(driver, addonId);
        await checkPrefs(driver, {});
      });

      after(async () => {
        await utils.clearPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName");
      });
    });

    describe("sets the correct prefs for variation CookiesBlocked", () => {
      before(async () => {
        await utils.setPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName", "CookiesBlocked");
        addonId = await utils.setupWebdriver.installAddon(driver);
        await driver.sleep(SETUP_DELAY);
      });

      it("has the correct prefs after install", async () => {
        await checkPrefs(driver, {
          "network.cookie.cookieBehavior": 4,
          "browser.contentblocking.trackingprotection.ui.enabled": false,
          "browser.fastblock.enabled": false,
          "browser.contentblocking.fastblock.ui.enabled": false,
          "browser.contentblocking.fastblock.control-center.ui.enabled": false,
          "browser.contentblocking.trackingprotection.control-center.ui.enabled": false,
          "security.pki.distrust_ca_policy": 1,
          "browser.contentblocking.enabled": true,
          "browser.contentblocking.ui.enabled": true,
          "browser.contentblocking.rejecttrackers.ui.recommended": true,
          "browser.contentblocking.rejecttrackers.control-center.ui.enabled": true,
          "browser.contentblocking.cookies-site-data.ui.reject-trackers.recommended": true,
          "browser.contentblocking.cookies-site-data.ui.reject-trackers.enabled": true,
          "browser.contentblocking.reportBreakage.enabled": true,
          "urlclassifier.trackingAnnotationTable": "test-track-simple,base-track-digest256",
          "urlclassifier.trackingAnnotationWhitelistTable": "test-trackwhite-simple,mozstd-trackwhite-digest256",
        });
      });

      it("has the correct prefs after uninstall", async () => {
        await utils.setupWebdriver.uninstallAddon(driver, addonId);
        await checkPrefs(driver, {});
      });

      after(async () => {
        await utils.clearPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName");
      });
    });

    describe("sets the correct prefs for variation AllThirdPartyCookiesBlocked", () => {
      before(async () => {
        await utils.setPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName", "AllThirdPartyCookiesBlocked");
        addonId = await utils.setupWebdriver.installAddon(driver);
        await driver.sleep(SETUP_DELAY);
      });

      it("has the correct prefs after install", async () => {
        await checkPrefs(driver, {
          "network.cookie.cookieBehavior": 1,
          "browser.contentblocking.trackingprotection.ui.enabled": false,
          "browser.fastblock.enabled": false,
          "browser.contentblocking.fastblock.ui.enabled": false,
          "browser.contentblocking.fastblock.control-center.ui.enabled": false,
          "browser.contentblocking.trackingprotection.control-center.ui.enabled": false,
          "security.pki.distrust_ca_policy": 1,
          "browser.contentblocking.enabled": true,
          "browser.contentblocking.ui.enabled": true,
          "browser.contentblocking.rejecttrackers.ui.recommended": true,
          "browser.contentblocking.rejecttrackers.control-center.ui.enabled": true,
          "browser.contentblocking.cookies-site-data.ui.reject-trackers.recommended": true,
          "browser.contentblocking.cookies-site-data.ui.reject-trackers.enabled": true,
          "browser.contentblocking.reportBreakage.enabled": true,
          "urlclassifier.trackingAnnotationTable": "test-track-simple,base-track-digest256",
          "urlclassifier.trackingAnnotationWhitelistTable": "test-trackwhite-simple,mozstd-trackwhite-digest256",
        });
      });

      it("has the correct prefs after uninstall", async () => {
        await utils.setupWebdriver.uninstallAddon(driver, addonId);
        await checkPrefs(driver, {});
      });

      after(async () => {
        await utils.clearPreference(driver, "extensions.cookie-restrictions_shield_mozilla_org.test.variationName");
      });
    });
  });
});
