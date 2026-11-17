# Henchmen banner source order

The port's scalar rule helpers use the henchman-adjusted battlefield stats as
their cached original EA values. This is established by the original WoG
source, rather than inferred from the order of VCMI bonuses.

Pinned upstream revision: `GrayFace/wog@04331ca2bf9e895703c0cf5854a14a754f671bc6`.

- [T1/Monsters.cpp, lines 5691–5699](https://github.com/GrayFace/wog/blob/04331ca2bf9e895703c0cf5854a14a754f671bc6/T1/Monsters.cpp#L5691):
  `BU:S` delegates to `SammonCreature`.
- [T1/common.cpp, lines 3600–3643](https://github.com/GrayFace/wog/blob/04331ca2bf9e895703c0cf5854a14a754f671bc6/T1/common.cpp#L3600):
  after native creation at address `0x479A30`, `SammonCreatureEx` explicitly
  clears `CrExpBon::BFStat` for the spawned stack at line 3637.
- Enhanced Henchmen 1.2 `29 wog - henchmen.erm`, lines 246–279: `BU:S`,
  `hench_ManageHenchStats`, then `hench_StackExpBF`.
- `hench_StackExpBF`, lines 918–941: `EA:E`, then `EA:R`.
- `T1/crexpo.cpp`, `ERM_AICrExp`, lines 4853–4897: both commands call
  `CrExpBon::Apply`. The first call caches the already-adjusted henchman stat;
  the second recalculates from that cache, rather than doubling the first row.

Downloaded original byte SHA-256 (files use legacy encoding/CRLF):

| Source | SHA-256 |
| --- | --- |
| T1/common.cpp | `ccd321db5d0e64dbf16ed550e1cdf806cd444fe17a134479f9e8d62b0674c462` |
| T1/Monsters.cpp | `7f1fd4a23a15df2f1acab089ff0474c409a4ee4207cd11fe488ef230161b7814` |
| T1/crexpo.cpp | `cf07b343bd23a306c5e787d608ed99c4bed9854e190229adb9030136b4252306` |

`EraHenchmanBannerRulesStandalone.cpp` checks all nine styles, including source
float-to-integer truncation, doubled EA operands with flat bonuses, defence
clamping, independent partial-block rolls, retaliation and experience caps.
These checks verify the pure rules; they do not attest native UI integration or
admit the still-incomplete Henchmen module.
