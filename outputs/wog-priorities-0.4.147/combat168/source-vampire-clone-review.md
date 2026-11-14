# Source vampire drain after clone rebirth

Observed production mismatch: source creature296 (Red Skeleton) has 3HP,
3 initial casts, configured rebirth chance1/fraction0.3/sure0.5 and selector0
vampire drain. Its cloned stack can return with only80% of initialHP and retain
CLONE. The next round, drain was rejected by native `CUnitState::heal` solely
because `cloned` remained true.

Source evidence:

- `../Third-Upgrade-Mod-Full/Data/Creatures/296.cfg`: selector0 and rebirth values.
- `../h3era-plugins/Amethyst2/amethyst/tables.cpp:4056-4115`: rebirth excludes
  DONE and living stacks, not CLONE; both configured/XP restoration are supported.
- `work/downloads/wog-port185/replacements/vampire-440900.asm`: original440921
  tests only victim living bit4. Addresses440935-4409A5 compute missing actorHP,
  cap by min(rawDamage,pre-hit targetHP), subtract woundedHP and restore units.
  There is no actor CLONE exclusion in that branch. This is static evidence;
  the original executable was not run for this audit.
- `server/era/EraRebirth.h` already uses CloneHealScope specifically to reproduce
  original resurrection while keeping the clone fragile.
- `lib/battle/CUnitState.cpp:992-1001` rejects cloned healing; previous BAP drain
  called it directly for both source and native actors.

Concrete valid case atR0: clone10 Red Skeletons (30 initialHP), destroyed,
configured rebirth returns24HP (8 units). Next activation attacks a living
target with at least12 pre-hitHP, raw damage12. Source drain restores6HP,
returning10 units; previous port restores0HP and remains8. CLONE must stay true,
so the next positive damage still destroys the fragile clone. XP rebirth is
disabled atR0, making this example deterministic.

Correction is scoped to `sourceVampire` (currently runtime policy296): temporarily
bypass the generic clone-healing rejection around the existing heal call,
restore CLONE before publishing state. Ordinary/vanilla/Goonk drain keeps its
existing branch. Damage, victim biology, physical-deflection order and capacity
calculation are unchanged.

Validation: `node --test tests/era-source-vampire-clone.test.mjs` passed. It compiles
the actual production drain dispatch with ASan/UBSan, uses the real rebirth helper
to obtain24HP, and verifies source-clone healing, normal-clone rejection, ordinary
partial healing and capacity limits. Its state double reproduces only native
CLONE rejection/capacity; it is not a full native battle or original-Windows
runtime witness. Parent task owns full build and runtime integration checks.
The same test was also run against the prior drain dispatch in a temporary
directory (production files untouched): it failed at the expected
`sourceClone.hp==30&&sourceClone.cloned` assertion, confirming the regression
test distinguishes the previous behavior.

Other bounded conclusions: CFG regeneration270/276/279/284/312 is bound to the
shared sourceRegeneration service and uses max(cfg HP,native HP bonus), capped
by the first creature's missingHP. No additional concrete mismatch was found
in those five actors during this pass. Absence of a separate per-actor native
scenario is not evidence that their port is incomplete.

## Native lifecycle follow-up

The first actual Clone witness initially defended the new clone before the
enemy MagicArrow. DEFEND correctly sets source DONE, so source rebirth was
ineligible; the private fixture now uses real WAIT instead. No production
change was justified by that fixture failure.

With WAIT, native rebirth did restore24HP and consume one charge, but the clone
disappeared at the next round. This exposed a second production mismatch:
`BattleInfo::setUnitState` removed the native `NONE/SPELL_EFFECT/CLONE65/N_TURNS`
lifetime carrier while clearing death/resurrection spell effects. Native
`CUnitState::afterNewRound` then interpreted its absence as clone expiry.

The original executable has an independent private clone counter, not a
spell65 duration slot:

- `5A71B5..5A71BB` initializes actor+0x2C with caster duration.
- `443F48..443F64` clears81 active spell-duration slots at actor+0x198 onward
  during death cleanup. `444230..4445C0` implements those removals without
  resetting private actor+0x2C.
- `5A7870..5A7B9C` restoresHP and clears DEAD; it retains the private counter.
- `446F06..446F0E` decrements positive private actor+0x2C once per round;
  `447033..44703E` destroys the clone when that counter reaches zero.

Local LLVM disassembly and original binary digest are retained under
`combat168/source-oracle/clone-*.asm` and `clone-lifetime-manifest.json`. This
establishes static original behavior; no Windows executable was run.

The narrow correction preserves only the exact native finite lifetime carrier
for cloned actors with a source rebirth policy, both across death and actual
restoration. It reuses `deferredEraClone`, preserves the remaining duration
without renewal, and leaves all other spell-effect cleanup/vanilla actors
unchanged. Failed rebirth still removes the clone through the existing path.

`tests/era-source-clone-lifetime.test.mjs` compiles the actual production cleanup
selector with metadata doubles and checks the exact carrier, unrelated effect
types/IDs/durations, ordinary behavior, and unchanged seven/zero remaining
turns across repeated cleanup. It and the drain dispatch regression passed
with ASan/UBSan. Full WASM build and native lifecycle rerun remain owned by the
parent task.
