# Earned stack XP through town upgrades and save/load

Run this gated browser integration check against an owned preview and a dedicated Chrome CDP instance. The harness always creates a new browser context; it does not reuse the default context, change user settings, delete caches or upload save bytes. Run each mode with a fresh output directory.

```sh
ERA_TOWN_GATE=owner-confirmed ERA_TOWNS=castle ERA_XP_PROFILE=source \
ERA_REQUIRE_PROJECTED_UPGRADE=1 GAME_ORIGIN=http://127.0.0.1:8781 \
CDP_URL=http://127.0.0.1:9227 \
ERA_EXPECT_WASM_SHA256=9b35c0b49206b3c38f10e45cf470d823e5407e839736aae5656215363512acc5 \
node work/browser-tests/tum-earned-xp-upgrade-e2e.mjs . mod/tum-era /tmp/tum-xp-source
```

Repeat with `ERA_XP_PROFILE=accelerated` and another output directory. The preview must be built for its local CSP origin with `GOONK_TEST_ORIGIN` and served by `static-server.mjs`. The Node dependencies come from `work/browser-tests/package.json`.

The source mode leaves the production experience profiles unchanged. The hero starts with two Supreme Archangels and one companion, wins an actual battle, returns to the owned town, transfers the experienced troop to its garrison, builds the final dwelling, pays for the upgrade, recruits one untrained creature, saves and reloads. Expected per-unit XP is200→150→100, with total XP400→300→300. The25% upgrade loss and recruitment dilution are intentional source rules.

The accelerated mode changes only the fixture's rank thresholds and battle cap. Expected XP100→75→50 yields ranks10→8→6. Live creature details after recruitment and reload must match, including health650, attack/defense51, damage81 and speed22. No live XP setter is used. Enemy/companion controls and disabled commanders are confined to the owned fixture; they do not change production data.

The fixture reads the embedded town entrance mask, handles legitimate extra turns from morale and confirms the Castle stables arrival message. An earlier harness omitted those UI transitions. Both final scenarios passed without JS/native errors. Current evidence is at `outputs/native-evidence/earned-xp-persistence/report.json`; its exact original harness is archived and its raw logs are specifically post-reload logs. This bounded check does not establish every troop composition or full ERA compatibility.
