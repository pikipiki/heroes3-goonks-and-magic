# Repeated battle crash investigation — 0.4.230

The production 0.4.228 engine (`cbc5d2e17b1f26acc81c9d824d647a275876d09fe3aaf9298172deacf903c6cd`) crashed twice in desktop WebKit during the third battle of an uninterrupted synthetic game. Each cycle hired and dismissed a hero, inspected equipment/commander/spellbook, rotated the viewport, changed battle views, cast a spell, then enabled auto combat. Both failures followed Fireball on battle three. OPFS and native autosaves were enabled. No user saves or connected phones were used.

The exact production binary was rebuilt with matching SHA256 to resolve its symbol map. The failing worker stack was:

```
__memset
mi_thread_init
mi_heap_get_default
_mi_malloc_generic
mi_malloc
operator new
std::allocator<char> allocation
std::string initialization
BattleInterface::requestAutofightingAIToTakeAction() thread
```

The failure occurred during allocation at thread startup, before the automatic decision. Reserved WASM memory was stable (256–288 MiB), so this trace does not establish an out-of-memory kill. Five baseline fights without the hire/dismiss cycle passed. A standalone 2,000-thread allocation exercise also passed on both browser engines: the evidence does not establish a general mimalloc defect or identify the original source of an invalid allocation.

The web build switches to the shared thread-safe dlmalloc allocator, avoiding mimalloc's per-thread heap initialization on this path. Validation must replay the complete mixed sequence, rather than only repeat fights in fresh sessions. This is a targeted mitigation for the reproduced allocator trap; desktop WebKit/Chromium results do not prove that every iOS/Android restart has the same cause.

The test harness serves engine overrides at the HTTP server, including worker requests. A page-only interception was discarded because Chromium worker scripts could otherwise use a different runtime from the WASM module. That test setup failure is not counted as a game regression.

Final counts, durations and memory samples are recorded in `validation.json` after the uninterrupted sessions finish. Diagnostic instrumentation exists only in the test harness and is not part of the published runtime.

Validation completed: two uninterrupted 30-battle OPFS sessions passed (60 hires/dismissals, 60 equipment/commander inspections, 33 spellbook inspections, 354 viewport rotations, 300 battle-view changes, ten spell types). Reserved WASM memory stayed at 256 MiB. After integrating main revision `5960228f`, the final production engine passed 20 additional mixed-session battles and a 20-battle classic/Goonk matrix. Total: 100 post-fix battles with zero native traps, page errors or unexpected reloads. All 743 executed general tests passed (48 skipped). Physical phones were not connected during this investigation.
