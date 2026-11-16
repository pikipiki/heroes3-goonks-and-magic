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
