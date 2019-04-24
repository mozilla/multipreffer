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

# [WIP] Process to develop a multipreffer-based study

TODO: streamline, automate.

1. Make a copy of the repo
2. Update metadata in `src/manifest.json` and `package.json`
3. Update `abort` and `branch_name` prefs
4. Define branches and target prefs/values in `src/variations.json`
4. `npm install`
5. `npm run build`
6. `npm run test`

If the tests pass, should be good to go! Build is in `dist/` - upload to the study bug for signing.
