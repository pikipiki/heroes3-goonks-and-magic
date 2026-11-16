# Lossless distribution deduplication — 0.4.232

Compared with main commit `c7ef9198` (0.4.231), the published build preserves all 10,460 native paths, file lengths, SHA-256 hashes and file order. The engine binary and browser loader source are unchanged. No gameplay resources, translations, audio, factions or compatibility definitions are removed, and no compression format or decoder is added.

| Measurement | Before | After |
| --- | ---: | ---: |
| Complete static site, bytes | 916,675,908 | 841,573,100 |
| Distinct game-data transport payload, bytes | 752,574,358 | 702,280,562 |
| Logical native installation, bytes | 752,574,358 | 752,574,358 |

The site reduction is 75,102,808 bytes; the distinct data payload reduction is 50,293,796 bytes. Identical files with the same MIME extension share a direct transport URL. Portraits/cards still resolve through unchanged native paths. Tiny-file packing removes duplicate bytes **inside the original 2 MiB neighbour groups**, preserving temporary-mode locality and cache budgets. Every native file still installs under its original name.

The installed cache retains its current structure: this optimizes distribution size and transfers, not logical installed size. Existing verified installations remain reusable because native paths and hashes match. Actual network traffic can exceed the distinct payload when browsers evict cached responses or refetch blocks.

`verifyAssetTransports` checks every native chunk, reconstructed file, and direct browser asset alias using one 4 MiB scratch buffer and at most sixteen descriptors during the build. Conflicting aliases, corrupt bytes, bad offsets, truncation and path escapes are rejected. No verification or decompression work is added to the browser.

## Validation

- Full catalogue equality and engine binary equality against the current main baseline.
- 754 executed automated tests passed; 48 optional checks skipped.
- Twenty classic/Goonk native battles plus ten mixed-session battles passed under WebKit/Chromium at device scale factor 3, including hires/dismissals, commander/equipment inspection, magic and orientation/view changes. Reserved WASM memory stayed at 256 MiB.
- Final temporary-mode comparisons: WebKit menu 3.805 → 3.141 s, first map 5.673 → 4.990 s; Chromium menu 3.076 → 2.941 s, first map 4.778 → 4.582 s. First-map response bytes decreased by about 12–14 MB.
- Cold OPFS comparison in isolated Chromium contexts: 22.521 → 23.352 s; uncompressed response bytes, including engine/interface, decreased from 836,787,061 to 802,378,806. The wall-clock difference is under one second; storage/process scheduling varies between local runs. No universal speed improvement is claimed.

Measurements use the same Range support and immutable cache headers, fresh isolated contexts and no request routing that would disable HTTP caching. They are not measurements on physical phones or a guarantee for every device/network. Diagnostic instrumentation is not shipped. Aggregate evidence is in `outputs/web-payload-optimization/validation.json`.
