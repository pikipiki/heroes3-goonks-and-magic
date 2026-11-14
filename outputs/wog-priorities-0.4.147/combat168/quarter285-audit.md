# Source285: innate spell reduction ordering

Confirmed static discrepancy, corrected in CSpellHandler.cpp. No original executable was executed or uploaded. Static analysis used the existing local h3era.exe and CommandLineTools llvm-objdump.

## Counterexample

Actor285, magical incoming Lightning Bolt damage35 (power1, no caster damage bonuses), basic Protection from Air30%, no source g row / OrbChaos / Conflux caster. Original: truncate(35/4)=8, then truncate(8*0.7)=5. Previous engine: truncate(35*0.7)=24, then truncate(24*25/100)=6.

Source references:

- `../Third-Upgrade-Mod-Full/Data/Creatures/285.cfg`: vulnerability selector1. Compiler `scripts/era-bridge/objects/source-dwelling-services.mjs:15` emits native ANY reduction75.
- Original5A7C26 applies caster bonus;5A7C3B calls44B180 innate correction;5A7C46 calls5A7EC0 school protection. Captured in `quarter285-original-order.asm`.
- `work/downloads/wog-port185/replacements/quarter-44b200.asm`:44B200..44B20F computes signed division by4 toward zero.
- Original5A7F18..5A7F27 multiplies by air protection fraction then calls617F94. Captured in `quarter285-original-protection.asm`.617F94 explicitly sets x87 rounding toward zero before FISTP.
- Native `config/spells/timed.json` protectAir base reduction30. CSpellHandler source branch already follows the original order; its ordinary branch applies school before ANY reduction and caster bonus last.

## Minimal correction

Admitted `DwellingServices.actor(285, exactKey)` plus magical effect enters the existing source-order branch. No compiler/config or balance change. Unknown actors, other mods and nonmagical effects retain their existing branch. The intrinsic ANY bonus75 is applied exactly once before school protection; explicit source g metadata retains its existing replacement priority.

For the source signed Win32 input domain, int64 multiplication by25 cannot overflow and `raw*25/100` equals signed `raw/4`, including negative inputs. No saturation or unsigned division added. The caster non-null invariant is unchanged: before this fix the ordinary branch already unconditionally called `caster->getSpellBonus`; the source branch does the same earlier. No new nullable-caster path is introduced.

## Verification and limits

`node --test tests/era-dwelling-quarter-damage.test.mjs tests/era-experience-magic-reduction.test.mjs`:4 passed. The new contract assertion guards exact actor admission, magical scope and ordering in the real engine source; signed arithmetic checks include INT32 endpoints and the35→5 counterexample. Existing g metadata/F32 tests remain green.

No WASM build or native battle was run by this audit worker. Parent must build with `ninja -j32 html5` and preferably observe actor285 + ProtectionAir30 + Lightning35 before publication. This report does not claim a native gameplay witness.

Other immunity checks: actor323 compiler uses native MAGIC_MIRROR20 INDEPENDENT_MAX, matching source448531 maximum(active mirror, intrinsic) arithmetic. No concrete mirror defect established. wC277/285/311 emits exact IceBolt/FrostRing rank5..10 immunity. Interaction of those XP immunities with Orb93 remains a proof gap here:71CC3B applies w rows separately but the exact dynamic hook ordering has not been closed. Do not change Orb behavior from this incomplete observation alone. Existing toxic335/336 native evidence already covers poison/disease/paralyze and foreign ignoreImmunity preservation.
