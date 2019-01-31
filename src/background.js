/* global browser, getStudySetup */

async function getStudySetup() {
  const studySetup = {
    activeExperimentName: browser.runtime.id,

    studyType: "shield",

    telemetry: {
      send: false,
      removeTestingFlag: false,
    },

    endings: { },

    expire: {
      days: 14,
    },
  };

  const res = await fetch(browser.extension.getURL("variations.json"));
  const variations = await res.json();
  studySetup.weightedVariations = Object.keys(variations).map(variation => {
    return {name: variation, weight: variations[variation].weight};
  });

  studySetup.allowEnroll = true;

  return studySetup;
}

async function init() {
  browser.study.onReady.addListener(async (studyInfo) => {
    await browser.multipreffer.studyReady(studyInfo);
  });

  browser.study.onEndStudy.addListener(async (ending) => {
    for (const url of ending.urls) {
      await browser.tabs.create({ url });
    }
    browser.management.uninstallSelf();
  });

  await browser.study.setup(await getStudySetup());
}

init();
