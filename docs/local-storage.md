# Local workspace storage and browser downloads

The November 16, 2026 audit found roughly 35 GiB in the main checkout, including 22 GiB in `work/campaign-validation217`. Most of that directory consisted of 23 complete, generated preview sites (`release217` through `release229`). The published site was about 0.9 GiB; the manifest's complete game-data payload was 752,378,113 bytes, plus engine/interface files. The size of the development checkout is not the browser download size.

The cleanup shares identical, content-addressed **generated snapshot assets** using filesystem hard links. It does not recompress assets, change their URLs or contents, remove snapshot directories, stop preview servers, or touch native saves, browser profiles, source mods, current `dist`, engine binaries, Git history, or downloaded source references. Each eligible file's SHA-256 is verified before an atomic replacement. Removing one snapshot leaves the shared files in the other snapshots intact.

Run an audit first, from the checkout that contains the preview sites:

```sh
node scripts/dedupe-local-test-assets.mjs --root=work/campaign-validation217
```

Apply the verified deduplication:

```sh
node scripts/dedupe-local-test-assets.mjs --root=work/campaign-validation217 --apply --report=/tmp/goonk-local-assets.json
```

Only immutable files named by their content hash under snapshot `assets/base`, `assets/packs`, and public game directories in `assets/data` qualify. Keep these snapshot assets immutable: reconstruct a preview by replacing its directory, rather than editing shared asset files in place. The tool defaults to an audit and can safely be rerun; already-shared files are counted separately.

This is a local disk-space optimization. It introduces no browser decompression, download, or gameplay work. Private-mode loading continues to use the existing bounded asset cache and partial archive reads. Wrapping all game data in a new compressed archive would require changing that access model and should not be treated as a free performance optimization. Small-asset packs retain direct URLs needed by browser portraits/cards; removing them indiscriminately would break those consumers.

The final cleanup counts and released-space measurement are recorded in `outputs/local-storage-audit/validation.json`. Disk free space is a point-in-time observation; APFS sharing and other concurrent work can make it differ from the sum of duplicate file lengths.

Distribution improvements and the distinction between transfer size and installed size are documented in [web-payload.md](web-payload.md).

## Repeat maintenance and public snapshot files

New full preview builds can recreate duplicates after a cleanup. On November 17 the five additional previews brought the snapshot count to 28; sharing their verified assets replaced 51,133 copies representing 4,323,992,521 bytes. A separate unused Git `tmp_pack_*` file occupied 1,820,196,864 bytes. It was removed only after checking Git connectivity and confirming no process had it open; connectivity passed again afterwards. The maintenance script deliberately does not delete Git files.

For further savings, opt in to sharing identical **public site files inside these immutable snapshots**, including the engine, interface images/styles/modules and the allowlisted site entry points:

```sh
node scripts/dedupe-local-test-assets.mjs --root=work/campaign-validation217 --include-site-files
node scripts/dedupe-local-test-assets.mjs --root=work/campaign-validation217 --include-site-files --apply --report=/tmp/goonk-local-site-files.json
```

Each file is hashed before sharing. Engine filenames also have their embedded hash prefix checked. Files with different permissions stay separate. The allowlist excludes saves, local settings JSON, unknown root files and symlinks. The tool verifies an already shared inode once per run while its identity, size and timestamps remain unchanged; it still validates every path's expected content hash. Neither commands nor output affect browser runtime or decompression.

The public-file pass shared another 20,116 copies representing 1,124,003,657 bytes. Together with the new asset copies and stale temporary pack, this eliminated 7,268,193,042 bytes of duplicate/temporary file lengths. All 84 preview manifest/engine/entry-point hashes stayed unchanged, and 29 active local preview endpoints served byte-identical manifest, image and game-pack samples. These counts are in `outputs/local-storage-audit/second-cleanup.json`; they are not a claim that APFS free space must increase by precisely that sum.

The remaining checkout includes Git history, source/reference material and private regression replays. Keep those available for ongoing development. Do not remove historical archives, test saves or entire preview directories merely because they are old: they may still support an open preview or a reproducible regression. The goal of this cleanup is sharing identical bytes, not a minimal standalone release. A standalone release's size is documented separately.
