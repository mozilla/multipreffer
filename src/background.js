let gEventListener = async function(payload) {
  console.log(payload);
  //  browser.study.sendTelemetry(payload);
};

async function init() {
  browser.study.onReady.addListener(async (studyInfo) => {
    await browser.firefoxhooks.onEvent.addListener(gEventListener);
    await browser.firefoxhooks.studyReady(studyInfo);
  });

  browser.study.onEndStudy.addListener(async (ending) => {
    for (const url of ending.urls) {
      await browser.tabs.create({ url });
    }
    browser.management.uninstallSelf();
  });

  await browser.study.setup({
    allowEnroll: true,
    activeExperimentName: browser.runtime.id,
    studyType: "shield",
    telemetry: {
      send: true,
      removeTestingFlag: false,
    },
    weightedVariations: [
      {
        name: "cohort1",
        weight: 1,
      },
      {
        name: "cohort2",
        weight: 1,
      },
      {
        name: "cohort3",
        weight: 1,
      },
    ],
    endings: {
      "user-disable": {
        baseUrls: [
          "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=user-disable",
        ],
      },
      expired: {
        baseUrls: [
          "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=expired",
        ],
      },
    },
    expire: {
      days: 14,
    },
  });
}

init();
