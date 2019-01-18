# Multipreffer

Allows defining a set of prefs per SHIELD cohort, and sets them at install and cleans them up upon uninstall.
User-modifications to prefs are respected. If any of the prefs to be touched have user-set values, the entire set is ignored.
At uninstall, any individual prefs whose values have been user-changed since install are left alone.

For technical details, please see https://github.com/nhnt11/WEE-Shield-Study-Template/blob/master/README.md

The prefs to be set should be defined in src/prefs.json, following this scheme:

{
  "cohort name": {
    "pref1": "value",
    "pref2": "value"
  },
  "cohort name 2": {
    "pref1": "value",
    "pref2": "value"
  }
}

Each cohort can define its own set of prefs. Different prefs can be set by different cohorts.
