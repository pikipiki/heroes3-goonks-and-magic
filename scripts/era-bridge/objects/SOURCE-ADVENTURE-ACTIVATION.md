# Production activation preflight

`activate-adventure-port.mjs` deliberately performs **preflight only**. It writes a reviewable JSON plan outside `mod/`; it never applies changes. The plan contains byte-hashed content copies and complete JSON document writes. Root must review and apply the plan only after all native evidence passes on the final engine. No `--apply` mode exists.

```
node scripts/era-bridge/objects/activate-adventure-port.mjs \
  --union /tmp/goonk-replacement185-union-complete \
  --source ../Third-Upgrade-Mod-Full \
  --proofs /absolute/path/native-activation-proofs.json \
  --output /tmp/goonk-adventure-production-plan.json
```

The proof descriptor follows `adventure-activation-proofs.schema.json`: schemaVersion1, a lowercase64character final `engineSha256`, and these entries:

- `integration`: the final-engine integration smoke, map/save/reload, all54actors at R0, and critical316/XP17 regression evidence.
- `actors`: exactly54 entries, one per `DWELLING_CLOSURE` sourceId. Each entry contains `sourceId`, `file`, `sha256`, `nativeValidated:true`, its own tested `engineSha256`, and explicit `scope`.
- `banks`, `cave`, `replacements`: each contains `file`, `sha256`, `nativeValidated:true`.
- `bankXp`, `dwellingXp`: each contains `file`, `sha256`, `nativeValidated:true`, plus `admission` pointing to the actual proposed production gate JSON.

`file` and `admission` resolve relative to the descriptor. Every evidence file must contain `passed:true` and its actual tested engine hash as `engineSha256`, `engine.sha256`, or `metadata.engineSha256`. The descriptor entry binds that hash independently of the final engine. A SHA binds the actual bytes, rather than a filename or unverified summary. Shared evidence may be referenced by several actors, but must explicitly include every verified actor in `validatedSourceIds` (or numeric `wholeActors`). A missing proof, changed byte, engine differing from its own attestation, or unlisted actor aborts before a plan is returned. These fields are attestations of completed checks; the tool does not manufacture missing native validation.

Historical tests retain their original engine SHA. They are accepted only with an explicit `scope` and a nonempty `sourceHashes` map of relevant implementation paths to unchanged SHA256 values; every listed file is checked against the current source. This is scoped source continuity, not a claim of whole-engine binary equivalence. A separate `integration` proof must use the final engine and contain `integrationSmokeValidated`, `mapSaveReloadValidated`, `playerRolesPreserved`, `actualResumedTurnTransitionsValidated`, `critical316Validated`, `xp17Validated` true and `r0MixSourceIds` exactly matching all54actors.

Additional native evidence requirements:

- Banks: `validatedBankIds` exactly48,51,64,65,66,67, `saveReloadValidated:true`, `revisitValidated:true`.
- Cave: `completeSourceChoicesValidated:true`, `saveReloadValidated:true`.
- Replacements: exact `sourceProgramSha256`, `sourceProgramCount:102`, and all of `nativeDayOneOnly`, `nativeReloadIdempotent`, `shared143NativeValidated`, `nativeDeterministicSeed`, `nativeOffInert` true. This retains the documented VCMI PRNG adaptation and does not claim original seed equivalence.
- XP gates must match the source fixture rows and cohort SHA, use `validated-all6`/`validated-all17`, set `enabled` and `nativeValidated` true, and contain real64character `contractsSha256`/`migrationSha256` hashes. The XP descriptor entry also supplies `contracts` and `migration` paths; the preflight opens those exact files and verifies both hashes. The whole actor proof sets must exactly match the corresponding native policy headers: bank10actors and dwelling16actors (including305/316 timed lifecycle participants without extra XP rows). Each proof hash must bind the same actor evidence listed in the descriptor.

The preflight independently recompiles all102 replacements with production admission evidence and the full symbolic object resolver. It does not copy the private replacement gate. Candidate configuration filenames become normal production filenames; private admission modes and candidate references are rejected in proposed JSON. Only `content/` resources enter the copy plan: no temporary review files, browser harnesses, diagnostic scripts, saves, or local settings.

The activation plan includes all54 identities; creature/spell/object manifest entries; French bank text; native combat layouts; XP/runtime/skeleton/fear/status merges; enabled44dwelling service admission; exact10bank actor admission; production XP gates; and the newly admitted102replacement policy. Applying, staging Git changes, validating the production data pack, building WebAssembly, browser regression checks, commit/push and Pages verification remain Root's responsibility.

## Multi-run indexes

An evidence entry may use `multiRunIndex:true` for Cave, actor or bank aggregates. Its `file`/`sha256` bind the retained index bytes. Set `nativeValidated:true` and an explicit `scope`; **omit `engineSha256` on the index entry**. The index must have `nativeValidated:true`, `pending:[]`, its own scope and a nonempty `proofs` array. Each member contains `file`, `passed:true`, `engineSHA256` and `proofSHA256`. Paths resolve relative to the index directory. Every retained file is opened, hashed, checked for `passed:true`, and compared to its actually embedded engine. Reports are never rewritten, relabelled, or given a fictional common engine. Identical raw SHA plus engine may appear only once per index, even under different filenames; a copied report is not another run.

An unfinished retained checkpoint may instead use `checkpoint:true`, an explicit record `scope`, and nonempty `casePointers` (for example `["/report/periodic288","/report/periodic322"]`). The record still binds the exact raw `proofSHA256` and actually embedded `engineSHA256`. Each pointer must select a distinct case object whose own `passed` is `true`; overlapping selections are rejected. A raw top-level `passed:false` is always rejected. Only selected cases contribute coverage, flags or other summaries, and attestation pointers must stay within those cases. The checkpoint does not acquire a top-level native PASS and its unselected siblings prove nothing. `passed:true` on the index member is optional in this mode; no raw bytes are changed.

`continuityReviews` contains one explicit review for every indexed engine differing from the final descriptor engine:

```json
{
  "engineSha256": "ACTUAL_OLD_ENGINE_SHA",
  "finalEngineSha256": "ACTUAL_FINAL_ENGINE_SHA",
  "reviewed": true,
  "scope": "The particular functions whose historical test remains relevant",
  "notes": "Distinguish unchanged source from later changes and later tests; no whole-engine equivalence claim.",
  "currentSourceHashes": {"work/vcmi-wasm/lib/mapObjects/CGMysteriousCave.cpp": "ACTUAL_CURRENT_SOURCE_SHA"},
  "coveredBy": [{"file":"grail-web-availability.json","pointer":"/report/extras/grailAvailability/passed","expected":true,"assertion":"The later native case covers the modified web availability guard."}]
}
```

`currentSourceHashes` bind the review to current source bytes, not to unretained historical source bytes. `coveredBy` is optional; when supplied, each JSON pointer is resolved against an already hash-verified retained report and its actual value must equal `expected`.

Cave `completeSourceChoicesValidated` is derived only from `rewards45.json` containing exactly the45 numeric choices20..64, all passed, on the indexed actual engine, each with effective before/after observations. A count or an index-level claim alone does not establish completeness.

Save/reload is derived from an explicit actual `saveReloadValidated:true` flag, or a scoped review bound to actual native evidence:

```json
{"attestations":{"saveReloadValidated":{"reviewed":true,"scope":"Actual save/reload checks, not merely save creation","evidence":[{"file":"pool-and-migration.json","pointer":"/report/extras/legacyMigration39/passed","expected":true,"assertion":"Reviewer explains how this native case loads and verifies an existing saved state."}]}}}
```

A positive `saveBytes` count alone never proves a reload. Future actor/bank indexes can carry `validatedSourceIds`/`validatedBankIds` from child reports. Additional reviewed coverage requires an equally scoped attestation whose evidence references carry `sourceId`/`bankId` and bind to the actual passed case fields. Index files and native reports remain untouched.

Final integration remains a separate single-run proof on the descriptor's final engine, including map/save compatibility, R0mix54, critical316 and XP17 regression checks. It cannot be replaced by a historical multi-engine index. The replacement policy's admission retains the actual102-test engine SHA even when source continuity and final integration are reviewed on a later engine.

A distinct `caseAttestation:true` record may retain successful independent cases from a raw report explicitly marked `passed:false`. It requires `reviewed:true`, an explicit `scope`, a precise `excludedFailureReason`, and the same exact passing case-object pointers and raw SHA/engine binding. It cannot also be a checkpoint. Verification exposes `rawGlobalPassed:false` and `wholeRunValidated:false`; it never turns that run into a native PASS. Only selected successful cases may support scoped attestations, and a pointer to an excluded failure is rejected. This mode is appropriate when a separate training prerequisite failed while independent earlier native cases had already passed.
