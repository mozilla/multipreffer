/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const {assert} = require("chai");
const utils = require("./utils");
const variations = require("../../src/variations.json");

async function checkPrefs(driver, allPrefs, prefs) {
  for (const pref of Object.keys(allPrefs)) {
    if (prefs[pref] !== undefined) {
      const val = await utils.getPreference(driver, pref);
      assert.equal(val, prefs[pref], `set the right pref for ${pref}`);
    } else {
      const val = await utils.getPreference(driver, pref);
      assert.equal(val, allPrefs[pref], `set the right pref for ${pref}`);
    }
  }
}

describe("setup and teardown", function() {
  const SETUP_DELAY = 1000;
  const RESTART_DELAY = 2000;
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(30000);

  let driver;

  describe("sets up the correct prefs, depending on the variation", function() {
    let addonId;

    for (const variation in variations) {
      const prefs = variations[variation].prefs;
      let allPrefs = {};
      describe(`sets the correct prefs for variation ${variation}`, () => {
        before(async () => {
          driver = await utils.setupWebdriver.promiseSetupDriver(
            utils.FIREFOX_PREFERENCES,
          );
          await utils.setPreference(driver, "extensions.multipreffer.test.variationName", variation);
          allPrefs = {};
          for (const pref of Object.keys(prefs)) {
            allPrefs[pref] = await utils.getPreference(driver, pref);
          }
          addonId = await utils.installAddon(driver);
          await driver.sleep(SETUP_DELAY);
        });

        it("has the correct prefs after install", async () => {
          await checkPrefs(driver, allPrefs, prefs);
        });

        it("has the correct prefs after restart", async () => {
          driver = await utils.restartDriverWithSameProfile(driver);
          await driver.sleep(RESTART_DELAY);
          await checkPrefs(driver, allPrefs, prefs);
        });

        it("has the correct prefs after uninstall", async () => {
          await utils.uninstallAddon(driver, addonId);
          await driver.sleep(SETUP_DELAY);
          const prefsToCheck = Object.assign({}, prefs);
          for (const pref of Object.keys(prefs)) {
            prefsToCheck[pref] = undefined;
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
