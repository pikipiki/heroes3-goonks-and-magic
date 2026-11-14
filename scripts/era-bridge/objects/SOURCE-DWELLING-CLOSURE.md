# Source dwelling dependency closure

`stage-dwelling-closure.mjs PROJECT TUM FRESH_OUTPUT` stages all 44 remaining
non-bank actors in the 54-member enabled replacement dependency closure. The ten
bank actors are provided by `stage-six-banks.mjs`. Existing actors are not patched.

The source archive, sound archive, templates, names, upgrade program, constants
and individual creature CFG files are hash-pinned. All sprites, portraits, map
masks, projectiles and audio are extracted from these original sources. Candidate
registries retain final Archer experience profiles and source skeleton targets.
Depth-zero source MA:U upgrades are applied in addition to CFG upgrades.

Every whole actor retains its unbound CFG/XP obligations. `candidateIds` includes
only locally closed actors whose dwelling-upgrade dependencies are closed; it is
not native admission. All output remains private and `activationReady` is false.
Do not merge the whole definition file or identity patch into an enabled manifest.

Reusable existing native adapters cover regeneration, rebirth and daily resources.
Source movement teleporting, positive morale floors, mirror and resistance aura
use their existing native bonuses. Fixed-power Mirth/Fortune candidates retain an
explicit source mode2 target-proof gate. Demonology279→315 and334→60 reuse the
existing eraDemonology effect with exact50HP/count and corpse caps, and retain
corpse eligibility/army-slot/reload proof gates. They require friendly/enemy/undead,
antimagic/hypnosis, charges and reload controls before admission.

The original creature305 has an invalid adventure amount range25..16. The private
candidate sorts these bounds to16..25, records the original values and keeps a
native-validation obligation, following the owner's instruction to document
corrections to undefined source values. Its battle statistics are unmodified.

Scoped native adapters now cover Ghost325 HP growth, query-only creature
artifact mimicry90/123, source Sorceress316 selection, additive H+309/310,
periodic288/316/322/323, cold immunity, physical deflection, defense reduction,
DeathBlow200/326, vampire296, finite125 retaliations308 and the basic wall shot314.
DragonSlayer200 adds100 flat damage against a dragon; DragonResistant200 removes
50 flat damage from dragon attacks in the same CFG personal-damage accumulator.
These are not percentage multipliers. Earth resistance292 blocks exactly source
spells17/19/26/57, including Titan Bolt, without broad earth-school immunity.

The original14-slot c dispatcher uses the LAST active c row, then makes one
proc roll. For284, c54/100 in slot11 shadows c71 in slot5. Its separate
ACAST_CUSTOM fields are dormant because no custom Spell-effect selector enables
them; AfterShoot54 remains active. Old selector defaults remain unchanged.

Source u316/#193 runs only at round2; U288/#123 and U323/#83,#27 run at
round2+4n; l322/#26,#82 run every round from2 and set clone+summon flags.
Source creature numbers, row order and fresh geometry/occupancy checks are
retained. Summoned193 uses the existing WoG Sorceress identity, with its original
selector and CFG Hate257=200 only in the source316 provenance context. Its source
fightValue800 differs from the installed native200, which may affect native AI
valuation. This is not a whole193 port: rank0 unowned rows and persistence are
dormant, and the unchanged HP35 drives casualty XP; no invented XP800 is awarded.

Ghost325 uses signed32 multiplication and REAL4 truncation, confirmed in shipped
Amethyst1001B9B0. Healing is bounded by victim pre-hit HP and missing HP plus
killedCount*GhostHP; undead victims are not rejected by this CFG ability. The
source ZGhost.TXT (SHA256e3e3f61db8a7dc843e9a694d3ad75d59d7d4cd04ddcd6b2c44e908d93c580a33)
sets default100 and exclusions145..149,159..163 to0. The original low-byte target
index is retained. A byte index above196 reads undefined adjacent memory in the
original; the port uses its source default100 there, documenting the authorized
exception. Native damage outside the source signed32 domain is clamped before
this adapter.

Artifact mimicry uses the original positive-count hero army only.311 grants
Boots-of-Levitation movement;288 grants Sea-Captain-Hat whirlpool protection and
available boat spells. It does not copy the hat's500 naval movement bonus or
invent extra spell mastery. H+ uses an existing hidden NONE bonus carrier and
REAL4 addition before specialty health, adding no serialized fields.

`EraDwellingServices` is absent/off inert; private policy output is disabled by
default. All whole-actor gameplay, native saves and legacy bridge regressions
still require evidence before publication.

Validation: `node --test tests/era-dwelling-closure.test.mjs`. Native engine/battle
and save/reload evidence is required separately for admission.
