# Per-game WoG options — scoped native plan169

Reference: the supplied TUM3.5 tree, not all historical ERA distributions.
`source-option-references.json` preserves source file hashes and all75 literal
UN:P references found under its Data/s. It distinguishes52 referenced option
identifiers,10 forcedOFF directives, diagnostics904/905 and dormant source.
A referenced option is not evidence of a missing mechanic.

## Owned options

| Slot | Mechanic | Source | Native mapping |
| --- | --- | --- | --- |
|0| Commanders | Mysterious Cave.erm287 checksP3; Archer1379 checks symbolicWOG_OPT_DISABLE_COMMANDERS | modules.commanders ; interface uses positive Enable, not inverted originalDisable flag |
|1| Stack experience | Archer1133/1500 checks symbolicWOG_OPT_STACK_EXPERIENCE | modules.stackExperience ; no numeric ID invented where local reference does not define one |
|2| Object replacement195 | stdlib88 capturesUN:P195; replacer programs use that captured value | First transition0→1 only; OFF returns before plans/RNG, authored objects remain usable |
|3| Build twice228 | stdlib754..777 stores original228 then disables stock script and calls native dailybuild setter1/2 | towns.buildingsPerTurnCap1/2 on this map |
|4| Fourth upgrades300 | Third Upgrade Mod.ers first record; original OnGameEnter blocks2243..2270 add/remove index6 variant3 in nine towns | Exact nine admitted fourth families filtered per town stock; no globalfaction mutation; mapdwellings/HillFort stay available |
|5| Eighth families301 | .ers second record; original blocks2272..2299 add/remove index7 in nine towns | Exact nine pairs filtered per town stock ; Portal reserve at8 retained |

The source ERS records declare300 default0 and301 default1. The shipped Goonk
profile has already enabled both families. Inherit(-1) preserves that existing
profile and map settings rather than silently reverting its defaults. Every
explicit choice is per option, per game, in ExtraOptionsInfo; native setting
overrides are serialized in CMap.GameSettings. Existing saves deserialize to
inherit through the parent-owned version guard. No installed mod JSON is edited.

300/301 ON leaves the registered full native roster intact, including any
map-author building restrictions. OFF removes only the exact source identity
owned by the source faction and tier; other mods' creatures, Goonk factions,
stock counts and row positions remain intact. Future network stock updates,
Cave faction transformations and save restoration pass the same filter. New
building requests for an excluded source dwelling returnFORBIDDEN. Prebuilt
structures retainALREADY_PRESENT while their excluded recruitment is absent.

## XP OFF details

Existing gain APIs and neutral daily gain already use the map's settings.
The remaining global reads in CStackInstance::getExpRank and upgrade retention
now usecanGainExperience; null-callback hypothetical objects retain the native
global fallback. RankRangeLimiter rejects bonuses with STACK_EXPERIENCE
provenance while XP is disabled, including rank0 source carriers; foreign rank
limiters and intrinsic creature-ability bonuses remain unchanged.

The source dispatch's SourceExperienceSink.prepareSourceGroup already calls
sourceXpPrepared→sourceXpModuleEnabled using handler.gameInfo.getSettings.
SourceDwellingExperienceSelectors and periodic summons also check this setting.
Do not disable sourceXpBattleAdmitted itself: it is permission/lifecycle,
not the XP toggle, and also supplies source-owned hero and intrinsic status
semantics. Turning it off would change Blind/Paralyze behavior independently of
experience. This admission marker is therefore deliberately unchanged.

## Other options and source constraints

TUM initialization forcibly disables37 RebalancedCreatures,50 EnhancedMonsters,
67 NeutralTown,125 UpgradedLevel7→8,173 ExtendedUpgrades,188 RampartFaerieDragon,
281 BucklerOfBeelzebub,740 EnhancedCreatureSpecialists,45 CastleUpgrading and820
AdditionalUpgrades. Exposing these as independently supported switches would
contradict the supplied TUM initialization and could duplicate its mechanics.
302 DwellingBanks is defined as a constant but not read in the examined scripts;
there is no behavior to invent from that unused declaration.

Options such as727 BackpackArtifacts,750 DemonicRage,758 Cutthroat and the
other Archer compatibility queries depend on ERA Scripts/Reborn/AdvancedClasses
and their own scripts. This reference does not contain those full packs or their
ERS option definitions. They remain interop dependencies, not newly enabled
switches with speculative implementations.904/905 are error-report controls,
not user gameplay options.

## Verification status

`tests/era-wog-options-native.test.mjs` compiles the actual standalone rule
header under UBSan and checks every300/301 combination for allnine towns,
inherit/ON/OFF semantics, unknown values, exact registered IDs, foreign variants,
Goonk towns, authored empty slots, unchanged stock counts and Dungeon Portal
position. Native WASM compilation, per-game/saved-state integration and mobile
UI checks are performed separately by the parent; this note does not claim them.
