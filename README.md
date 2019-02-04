# Multipreffer

- Allows defining a set of prefs per SHIELD cohort, and sets them at install and cleans them up upon uninstall.
- User-modifications to prefs are respected:
  - If any of the prefs to be touched have user-set values, the entire set is ignored.
  - At uninstall, any individual prefs whose values have been user-changed since install are left alone.
- The pref changes are resilient to changes in default values after an update: i.e. the requested values are kept after update, and the new defaults are respected during cleanup at uninstall-time.

The prefs to be set should be defined in src/variations.json, following this scheme:

```
{
  "cohort 1": { // Name of cohort
    "weight": 1, // Weight determines relative chance of getting assigned to this cohort
    "prefs": {
      "setValues": { // Prefs and values to set upon install
        "pref1": "string1",
        "pref2": true,
        "pref3": 99
      },
      "resetDefaults": ["pref1"], // Prefs to reset to default values upon uninstsall
      "resetValues": { // Prefs and values to set upon uninstall
        "pref3": 100
      }
    }
  },

  [...]
}
```

Each cohort can define its own set of prefs. Different prefs can be set by different cohorts.
