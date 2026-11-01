# Rebuild the eight closed TUM creature definitions

Run from any directory, using explicit source and output directories:

```sh
node scripts/era-bridge/roster8/import-roster8.mjs PROJECT_ROOT TUM_SOURCE OUTPUT
```

OUTPUT must be outside PROJECT_ROOT. This produces an overlay at
`OUTPUT/mod/tum-era`, never modifies the project, and retains existing manifest,
artifact/runtime policies and unrelated XP profiles. Source IDs202,219,295,297,
299,357,359,361 have complete extracted definitions. Original portraits use frame
`ERA_ID+2`, accounting for the two dummy frames. All16 generated portraits are
PNG-decoded and compared pixel-for-pixel with source DEF frames.

The importer uses relative bridge APIs and requires the project's existing
`work/browser-tests` Node dependencies (sharp/json5). It validates native schema,
actual BonusEnum names, spell/creature references and dynamic corpse mappings.
The current source checkout yields8 definitions,233 XP profiles,242 mapped
transformation identities and112 overlay files. Profile count is reported rather
than fixed, so later complete additions do not break the importer.

For official Hit Landing Effects resources:

```sh
node scripts/era-bridge/roster8/import-landing-assets.mjs HIT_EFFECTS_DATA OUTPUT
```

This extracts Burst04/14/16/17/23/25 and PHOEMOVE/FAERATTK/DEATHCLS WAVs, records archive and
individual asset hashes, and reports the source TUM bindings. It never invents
fallback visuals or claims that extraction alone installs a native landing-effect
adapter. Resources remain subject to their upstream license and game-data terms.

Native source adapters must already be compiled before applying the roster
output. The generator does not assert that a browser gameplay test was performed.
