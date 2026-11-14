# Additional faithful recruitment access

`source-recruitment-access.mjs` prepares the two source links needed to make the remaining new families recruitable on the authored maps. It does not alter the102 source replacement rules or probabilities.

```js
const result = prepareSourceRecruitmentAccess({sourceRoot, resolver});
// result.files: Map<content-relative path, Buffer>
// result.modPatch: {objects: [...], creatures: [...]}
// result.provenance: pinned sources, exact identities, guards and file hashes
stageSourceRecruitmentAccess(result, freshPrivateDirectory, {projectRoot, sourceRoot});
```

The resolver is the existing production object resolver extended with the reviewed new actor catalogue. In particular it must resolve original141,360 and362 to native registered definitions. The function pins AmeCre.pac, the original upgrade function/constants,141/362 CFG files, source object names and original dwelling templates. It returns HolyPeaks17/166 with original three-HolyDragon guards, its original DEF/MSK, and a narrowly scoped native Mummy upgrade patch. The result has four content files and deliberately claims no native integration validation.

The original `141.cfg UpgradesTo=360` agrees with the last unconditional `MA:U141/360` in the bounded original `tum_SetUpNewUpgrades` function. The native source identity remains `core:mummy`. An already equivalent resolved evolution is preserved; a conflicting/unresolved native evolution aborts instead of being overwritten. No Mummy stats, abilities or other source creature definitions are replaced.

Reproducible private staging:

```
node scripts/era-bridge/objects/source-recruitment-access.mjs \
  --project "$PWD" \
  --source ../Third-Upgrade-Mod-Full \
  --catalogue /tmp/goonk-replacement185-union-complete \
  --output /tmp/goonk-source-recruitment-access185
```

Use a fresh output path. The CLI accepts reviewed candidate or normalized actor catalogue filenames. The staging function refuses existing destinations, production mod paths and the original source pack. Root must copy only `content/` into its review union and register both `modPatch` additions. Staging a resource alone does not register or activate it. Final map capture/recruitment/upgrade and save compatibility checks remain separate native tests.

`node --test tests/era-source-recruitment-access.test.mjs` verifies byte equivalence with the independently generated full-importer HolyPeaks output, deterministic staging, equivalent/conflicting upgrade handling and source pin rejection.
