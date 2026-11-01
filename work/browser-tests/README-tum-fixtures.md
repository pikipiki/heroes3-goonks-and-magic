# Native TUM browser fixtures

These tools run actual VCMI/WASM battles and object visits against a built preview. They use isolated Playwright contexts, original `.vmap` fixtures, the public save-choice route and normal native commands. They never remove Saves entries. ERA files are optional; frozen factual creature identities and source expectations are included.

Run from the project checkout with the existing `work/browser-tests` dependencies:

```sh
node --test work/browser-tests/tum-preinit.test.mjs
node work/browser-tests/tum-objects-e2e.mjs --ready --origin http://127.0.0.1:8774 --cdp http://127.0.0.1:9224
node work/browser-tests/tum-sorrow-e2e.mjs --ready --origin http://127.0.0.1:8774 --cdp http://127.0.0.1:9224
```

`--project PATH` chooses a different checkout. `--tum PATH` optionally verifies the selected original source-file hashes; it is not needed to run the browser tests. `--cases bank:43,bank:44` selects object cases. `--fixtures PATH` selects another complete fixture directory with its frozen metadata. Unknown case selectors fail. `--report-dir PATH` selects an evidence directory. `--fresh-context` disables the shared test-context cache and uses a new context per case. The normal shared-context route is `?mobile=1&choose-save=1`, then “Retour”, then “Nouvelle aventure”; a fresh context is the fallback if that boot fails.

The pre-main hook disables commanders for these controlled fixtures. Object fixtures use 500 Black Dragons, a spellbook and a day-one baseline-resource budget so guarding and recruitment can be tested. Guards, recruit rosters and rewards use installed production data. Source level-one dwellings give their whole weekly growth for free; other dwellings buy exactly one creature, then close the native window. Bank tests match resources, creature rewards and guardian amounts against the same source state, and revisit after moving away to reject duplicate payment.

`--resource-array` is an explicit **candidate data override** for banks 43/44. It converts scoped resource dictionaries to VCMI’s supported identifier/amount list before native main. Use it only to validate an unpublished data correction; reports mark the override. Omit it when verifying published data. It never changes preview files.

The Sorrow fixtures patch only the isolated test FS: Dread Skipper gets durable controlled stats, two living enemy stacks are created, and primary resistance is 100 or 0. Its original expert Sorrow ability remains intact. Native `battleUnits[].morale` is required. The first case must block Sorrow on both targets; the second must reduce both targets’ morale by two after an actual attack.

Each run records SHA256 hashes of the preview HTML, manifest and hashed runtime files **before** creating test pages. Source attestation, candidate overrides and fixture changes are explicit in the report. Native reward dialogs and screenshots supplement the JSON assertions; the bridge does not expose inventory contents. These tests cover visits and battles, not random-map distribution or audio playback.

For an explicitly authorized source preview with unhashed URLs, pass `--source-runtime`. This captures `/`, its manifest and the exact unhashed runtime references before boot; it does not read the upstream raw `game.html`. Published hashed previews remain the default and are required unless this mode is selected. Initial native/download boot may wait15minutes; gameplay deadlines remain unchanged.
