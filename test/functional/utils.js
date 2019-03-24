/* eslint-env node */

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const cmd = require("selenium-webdriver/lib/command");
const Context = firefox.Context;
const path = require("path");

// Preferences set during testing
const FIREFOX_PREFERENCES = {
  // Ensure e10s is turned on.
  "browser.tabs.remote.autostart": true,
  "browser.tabs.remote.autostart.1": true,
  "browser.tabs.remote.autostart.2": true,

  "extensions.legacy.enabled": true,
  "xpinstall.signatures.required": false,

  // Improve debugging using `browser toolbox`.
  "devtools.chrome.enabled": true,
  "devtools.debugger.remote-enabled": true,
  "devtools.debugger.prompt-connection": false,

  // Removing warning for `about:config`
  "general.warnOnAboutConfig": false,

  // Force variation for testing
  // "extensions.cookie-restrictions_shield_mozilla_org.test.variationName": "0",

  // Enable verbose shield study utils logging
  "shieldStudy.logLevel": "All",

  /** WARNING: Geckodriver sets many additional prefs at:
   * https://dxr.mozilla.org/mozilla-central/source/testing/geckodriver/src/prefs.rs
   *
   * In, particular, this DISABLES actual telemetry uploading
   * ("toolkit.telemetry.server", Pref::new("https://%(server)s/dummy/telemetry/")),
   *
   */
};

// Re-usable test methods from shield-studies-addon-utils
const { executeJs } = require("shield-studies-addon-utils/testUtils/executeJs");
const { nav } = require("shield-studies-addon-utils/testUtils/nav");
const {
  setupWebdriver,
} = require("shield-studies-addon-utils/testUtils/setupWebdriver");
const { telemetry } = require("shield-studies-addon-utils/testUtils/telemetry");
const { ui } = require("shield-studies-addon-utils/testUtils/ui");

async function setPreference(driver, name, value) {
  if (typeof value === "string") {
    value = `"${value}"`;
  }

  driver.setContext(Context.CHROME);
  await driver.executeScript(`
    var Preferences = ChromeUtils.import("resource://gre/modules/Preferences.jsm", {}).Preferences;
    Preferences.set("${name}", ${value});
  `);
}

async function getPreference(driver, name) {
  driver.setContext(Context.CHROME);
  const value = await driver.executeScript(`
    var Preferences = ChromeUtils.import("resource://gre/modules/Preferences.jsm", {}).Preferences;
    return Preferences.get("${name}");
  `);
  return value;
}

async function clearPreference(driver, name) {
  driver.setContext(Context.CHROME);
  await driver.executeScript(`Services.prefs.clearUserPref("${name}");`);
}

function prefHasUserValue(driver, name) {
  driver.setContext(Context.CHROME);
  return driver.executeScript(`return Services.prefs.prefHasUserValue("${name}");`);
}

async function openNewTab(driver) {
  driver.setContext(Context.CHROME);
  await driver.executeScript(`
    gBrowser.selectedTab = gBrowser.addTab("about:blank", {triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})});
  `);
}

async function removeCurrentTab(driver) {
  driver.setContext(Context.CHROME);
  await driver.executeScript(`
    gBrowser.removeTab(gBrowser.selectedTab);
  `);
}

async function restartDriverWithSameProfile(driver) {
  const profile = (await driver.getCapabilities()).get("moz:profile");

  const options = new firefox.Options();
  options.setProfile(profile);

  const builder = new webdriver.Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options);

  // Use standalone geckodriver server, launched by `npm-run-all -p test:func:*`
  if (process.env.GECKODRIVER_URL) {
    builder.usingServer(process.env.GECKODRIVER_URL);
  }

  const binaryLocation = process.env.FIREFOX_BINARY || "firefox";
  await options.setBinary(new firefox.Binary(binaryLocation));
  const driver2 = await builder.build();
  // Firefox will be started up by now
  driver2.setContext(Context.CHROME);
  await driver.quit();
  return driver2;
}

async function installAddon(driver, fileLocation) {
  // references:
  //    https://bugzilla.mozilla.org/show_bug.cgi?id=1298025
  //    https://github.com/mozilla/geckodriver/releases/tag/v0.17.0
  fileLocation =
    fileLocation || path.join(process.cwd(), process.env.ADDON_ZIP);

  const executor = driver.getExecutor();
  executor.defineCommand(
    "installAddon",
    "POST",
    "/session/:sessionId/moz/addon/install",
  );
  const installCmd = new cmd.Command("installAddon");

  const session = await driver.getSession();
  installCmd.setParameters({
    sessionId: session.getId(),
    path: fileLocation,
    temporary: false,
  });
  const addonId = await executor.execute(installCmd);
  console.log(
    `Add-on at ${fileLocation} installed with (addonId: ${addonId})`,
  );
  return addonId;
}

async function uninstallAddon(driver, addonId) {
  const executor = driver.getExecutor();
  executor.defineCommand(
    "uninstallAddon",
    "POST",
    "/session/:sessionId/moz/addon/uninstall",
  );
  const uninstallCmd = new cmd.Command("uninstallAddon");

  const session = await driver.getSession();
  uninstallCmd.setParameters({ sessionId: session.getId(), id: addonId });
  await executor.execute(uninstallCmd);
  console.log(`Add-on with id ${addonId} uninstalled`);
}


// What we expose to our add-on-specific tests
module.exports = {
  FIREFOX_PREFERENCES,
  executeJs,
  nav,
  setupWebdriver,
  telemetry,
  ui,
  setPreference,
  getPreference,
  clearPreference,
  prefHasUserValue,
  openNewTab,
  removeCurrentTab,
  restartDriverWithSameProfile,
  installAddon,
  uninstallAddon,
};
