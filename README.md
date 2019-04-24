# Multipreffer

- Allows defining a set of prefs per SHIELD branch, and sets them at install and cleans them up upon uninstall.
- Pref values are set on the default branch. User values are preserved.

The prefs to be set should be defined in src/variations.json, following this scheme:

```
{
  "branch 1": { // Name of branch
    "weight": 1, // Weight determines relative chance of getting assigned to this branch
    "prefs": { // Prefs and values to set upon install
      "pref1": "string1",
      "pref2": true,
      "pref3": 99
    }
  },

  [...]
}
```
