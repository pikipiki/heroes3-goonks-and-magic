# Combat follow-up — 0.4.140

## Implemented

- Catapult wall targets come from the native engine's legal attack cells. Red reticles and the Targets list expose them in classic and vertical views; confirmation sends the normal native action.
- Portrait siege fortifications are separated from the rotated terrain. A connected upright curtain follows native wall cells and preserves native destroyed-section breaches. Native tower artwork is retained. The curtain is a 2D adaptation, not newly rendered faction-specific 3D artwork.
- Browser test instructions require silent end-to-end tests. The shared helper mutes the final output without disabling the native audio engine or changing saved player settings (introduced in 0.4.139).

## Verified

- WebAssembly build: `ninja -j32 html5`.
- Unit suite: 511 tests, 489 passed, 22 skipped, zero failed.
- Web preparation, build and packaged-site verification.
- Native siege: an elemental summon, machines, legal wall selection, and a confirmed catapult shot. Screenshot inspected after the shot.
- Native Goonk army actions: 1,440 live-sprite samples, none fully transparent.
- Native gold/black dragons and archangels: 801 live-sprite samples, none fully transparent.
- Both action fixtures also freeze/resume the Chromium page and rotate between 740×390, 390×740, 768×1024 and 320×568. Navigation remains inside the viewport; no reload is used.
- Tests run with audio output muted.

## Coverage limits

These action checks are additional to the earlier idle animation catalogue checks. They do not establish exhaustive coverage of every creature/spell/siege combination, and checking for fully transparent sprites cannot rule out every visual artifact. The reported striped flicker was not reproduced by these checks and must not be described as conclusively fixed.

Creature sprites still use their original lateral animation artwork. This change does not create front/back animation sets. Physical iOS/Android lock-screen recovery has not been tested: browser lifecycle simulation is not a substitute for it.
