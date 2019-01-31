/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const {assert} = require("chai");
const utils = require("./utils");
const variations = require("../../src/variations.json");

async function checkPrefs(driver, allPrefs, prefs) {
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

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      const allPrefs = Object.keys(prefs.setValues);
      describe(`sets the correct prefs for variation ${variation}`, () => {
        before(async () => {
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          addonId = await utils.setupWebdriver.installAddon(driver);
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after uninstall", async () => {
          await utils.setupWebdriver.uninstallAddon(driver, addonId);
          const prefsToCheck = prefs.setValues;
          for (const pref of prefs.resetDefaults) {
            prefsToCheck[pref] = undefined;
          }
          for (const pref in prefs.resetValues) {
            prefsToCheck[pref] = prefs.resetValues[pref];
          }
          await checkPrefs(driver, allPrefs, prefsToCheck);
          for (const pref in prefsToCheck) {
            await utils.clearPreference(driver, pref);
          }
        });

        after(async () => {
          await utils.clearPreference(driver, "extensions.multipreffer.test.variationName");
        });
      });
    }
  });

  describe("Set some user prefs, ensure addon doesn't do anything", function() {
    const SETUP_DELAY = 500;
    let addonId;
    let abortedPref;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      const allPrefs = Object.keys(prefs.setValues);
      describe(`no prefs should be set for ${variation}`, () => {
        before(async () => {
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          await utils.setPreference(driver, allPrefs[0], "TEST VALUE!!");
          addonId = await utils.setupWebdriver.installAddon(driver);
          abortedPref = `extensions.multipreffer.${addonId}.aborted`;
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          // Take the first of the target prefs and set it to some value
          // before installing the addon.
          const prefsToCheck = {};
          prefsToCheck[allPrefs[0]] = "TEST VALUE!!";
          // The addon should set this pref to indicate that it aborted.
          allPrefs.push(abortedPref);
          prefsToCheck[abortedPref] = true;
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        it("has the correct prefs after uninstall", async () => {
          const prefsToCheck = {};
          prefsToCheck[allPrefs[0]] = "TEST VALUE!!";
          allPrefs.push(abortedPref);
          await utils.setupWebdriver.uninstallAddon(driver, addonId);
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        after(async () => {
          await utils.clearPreference(driver, "extensions.multipreffer.test.variationName");
        });
      });
    }
  });
});
