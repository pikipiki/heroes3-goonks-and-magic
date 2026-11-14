# Original WoG 3.58f campaign reference

These four H3C files are unchanged reference fixtures extracted statically from
`main4.wog` in the WoG Team distribution linked by Acid Cave:
https://www.wog.acidcave.net/download.html
https://www.vault.acidcave.net/download.php?id=22

Distribution ZIP SHA-256:
`8f210d789c8c3f799549bc67a5d48ee346036ded726c298ddfb95301e3cfc41a`.
The Windows installer was not run. Per-campaign digests are enforced by
`scripts/era-bridge/campaigns/legacy-importer.mjs`.

The original physical regions include empty slots removed by the VCMI conversion.
`build-native-metadata.mjs` derives the corrected active-region dependencies.
All 137 original ERM text blocks match the converted campaigns after Windows-1252
text decoding and newline normalization. This proves source preservation, not
runtime completion of those scripts.

Original media is imported byte-for-byte from the same archive by
`import-media.mjs`; the manifest pins its complete 78-image / 4-movie cohort.
Movies are retained as source assets and are not yet playable through IF:B.
The script reference `21a.bmp` does not occur in the distribution archives and
must not be replaced with invented artwork under a claim of fidelity.
