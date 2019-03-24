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
  this.timeout(45000);

  let driver;

  describe("sets up the correct prefs, depending on the variation", function() {
    const SETUP_DELAY = 500;
    let addonId;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      const allPrefs = Object.keys(prefs.setValues);
      describe(`sets the correct prefs for variation ${variation}`, () => {
        before(async () => {
          driver = await utils.setupWebdriver.promiseSetupDriver(
            utils.FIREFOX_PREFERENCES,
          );
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          addonId = await utils.installAddon(driver);
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after restart", async () => {
          driver = await utils.restartDriverWithSameProfile(driver);
          await driver.sleep(SETUP_DELAY);
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after uninstall", async () => {
          await utils.uninstallAddon(driver, addonId);
          await driver.sleep(SETUP_DELAY);
          const prefsToCheck = Object.assign({}, prefs.setValues);
          for (const pref of prefs.resetDefaults) {
            prefsToCheck[pref] = undefined;
          }
          for (const pref in prefs.resetValues) {
            prefsToCheck[pref] = prefs.resetValues[pref];
          }
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        after(async () => {
          await driver.quit();
        });
      });
    }
  });

  describe("Check whether prefs user-modified after install are left user-modified after cleanup", function() {
    const SETUP_DELAY = 500;
    let addonId;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      const allPrefs = Object.keys(prefs.setValues);

      const testPref = allPrefs[0];
      const val = prefs.setValues[testPref];
      let testVal;
      if (typeof val === "number") {
        testVal = 999;
      } else if (typeof val === "string") {
        testVal = "Test Value!";
      } else if (typeof val === "boolean") {
        testVal = true;
      }

      describe(`sets the correct prefs for variation ${variation}`, () => {
        before(async () => {
          driver = await utils.setupWebdriver.promiseSetupDriver(
            utils.FIREFOX_PREFERENCES,
          );
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          addonId = await utils.installAddon(driver);
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after restart", async () => {
          driver = await utils.restartDriverWithSameProfile(driver);
          await driver.sleep(SETUP_DELAY);
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after uninstall", async () => {
          await utils.setPreference(driver, allPrefs[0], testVal);
          await utils.uninstallAddon(driver, addonId);
          const prefsToCheck = Object.assign({}, prefs.setValues);
          for (const pref of prefs.resetDefaults) {
            prefsToCheck[pref] = undefined;
          }
          for (const pref in prefs.resetValues) {
            prefsToCheck[pref] = prefs.resetValues[pref];
          }
          prefsToCheck[testPref] = testVal;
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        after(async () => {
          await driver.quit();
        });
      });
    }
  });

  describe("Set up some prefs with unexpected values, ensure addon doesn't do anything", function() {
    const SETUP_DELAY = 500;
    let addonId;
    let abortedPref;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      const allPrefs = Object.keys(prefs.setValues);

      const testPref = allPrefs[0];
      const testVal = "Test Value!";

      describe(`no prefs should be set for ${variation}`, () => {
        before(async () => {
          driver = await utils.setupWebdriver.promiseSetupDriver(
            utils.FIREFOX_PREFERENCES,
          );
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          await utils.setPreference(driver, testPref, testVal);
          addonId = await utils.installAddon(driver);
          abortedPref = `extensions.multipreffer.${addonId}.aborted`;
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          // Take the first of the target prefs and set it to some value
          // before installing the addon.
          const prefsToCheck = {};
          prefsToCheck[testPref] = testVal;
          // The addon should set this pref to indicate that it aborted.
          allPrefs.push(abortedPref);
          prefsToCheck[abortedPref] = true;
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        it("has the correct prefs after restart", async () => {
          driver = await utils.restartDriverWithSameProfile(driver);
          await driver.sleep(SETUP_DELAY);
          // Take the first of the target prefs and set it to some value
          // before installing the addon.
          const prefsToCheck = {};
          prefsToCheck[testPref] = testVal;
          prefsToCheck[abortedPref] = true;
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        it("has the correct prefs after uninstall", async () => {
          const prefsToCheck = {};
          prefsToCheck[testPref] = testVal;
          await utils.uninstallAddon(driver, addonId);
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        after(async () => {
          await driver.quit();
        });
      });
    }
  });

  describe("Ensure expectNonDefaults works", function() {
    const SETUP_DELAY = 500;
    let addonId;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      if (!prefs.expectNonDefaults.length) {
        continue;
      }
      const allPrefs = Object.keys(prefs.setValues);

      const testPref = prefs.expectNonDefaults[0];
      const val = prefs.setValues[testPref];
      let testVal;
      if (typeof val === "number") {
        testVal = 999;
      } else if (typeof val === "string") {
        testVal = "Test Value!";
      } else if (typeof val === "boolean") {
        testVal = true;
      }

      describe(`sets the correct prefs for ${variation}`, () => {
        before(async () => {
          driver = await utils.setupWebdriver.promiseSetupDriver(
            utils.FIREFOX_PREFERENCES,
          );
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          await utils.setPreference(driver, testPref, testVal);
          addonId = await utils.installAddon(driver);
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after restart", async () => {
          driver = await utils.restartDriverWithSameProfile(driver);
          await driver.sleep(SETUP_DELAY);
          await checkPrefs(driver, allPrefs, prefs.setValues);
        });

        it("has the correct prefs after uninstall", async () => {
          await utils.uninstallAddon(driver, addonId);
          const prefsToCheck = Object.assign({}, prefs.setValues);
          for (const pref of prefs.resetDefaults) {
            prefsToCheck[pref] = undefined;
          }
          for (const pref in prefs.resetValues) {
            prefsToCheck[pref] = prefs.resetValues[pref];
          }
          await checkPrefs(driver, allPrefs, prefsToCheck);
        });

        after(async () => {
          await driver.quit();
        });
      });
    }
  });
});
