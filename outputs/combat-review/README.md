# Combat review — 0.4.138

The general mobile UI and language fixes are published separately in commit `d3ac71123cb8ab03ecf56b0d72278683d3b167c7` (0.4.137).

## Coverage

- 281 active native creature detail views loaded and rendered. Unused original placeholders (122, 124, 126, 128) are excluded.
- 276 ordinary creatures exercised in live vertical battles in 41 groups, with a commander. Forty samples per group check sprite geometry and nontransparent atlas content; no blank sprites were observed. See `cases/`.
- Catapult, ballista, first-aid tent and ammo cart exercised in a dedicated native castle siege. Arrow towers and walls use the native siege terrain/effect plane rather than an ordinary hero army slot. Summon Fire Elemental exercised in that siege.
- 290 animation definitions resolve to 288 unique animations, containing 30,385 frames. All resources resolve; no entirely transparent PNG frames. Intentional zero-size DEF death/fade frames are accepted.
- Focused Chromium and WebKit native scenarios cover explicit portrait mode selection, touch movement, Magic Arrow effects, animation updates, small phones and iPad dimensions, and returning to landscape.
- Unit suite: 487 passed, 22 skipped. WebAssembly `ninja -j32 html5`, site build and site verification passed.

## Changes

Classic view is the default for each new combat. In portrait, the view button explicitly enables vertical mode. Selection has a dark outline and cyan fill, enemy markers are red, shooting markers cyan, and beneficial markers follow native action legality. Native position packets arrive every 50 ms in vertical mode and are interpolated between packets. Missing lazy-loaded animation frames retain the last available pose. New battles reset the interpolation cache. Long unit descriptions scroll.

## Limits

This is exhaustive catalog/resource/rendering coverage, not an assertion that every creature has performed every action or every combination of spells. No new front/back artwork has been created: existing lateral sprites remain upright. Siege walls remain in the rotated terrain plane, so their perspective still needs a dedicated visual treatment. Browser emulation does not reproduce physical iOS/Android lock-screen and wake behavior. The vertical view remains experimental for these reasons.

## Reproduce

Serve the built site at port 8777, then use `work/browser-tests/vertical-battle-native-e2e.mjs` (`BROWSER=webkit` for WebKit), `vertical-complex-native-e2e.mjs`, `vertical-siege-native-e2e.mjs`, `combat-catalog-native-e2e.mjs`, and `audit-combat-animation-catalog.mjs`. The matrix runner accepts `START_BATCH` / `END_BATCH` for bounded runs. Fixtures are created in memory and are never shipped as saved games.
