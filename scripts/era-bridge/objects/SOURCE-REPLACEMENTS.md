# Original TUM map replacements

`source-replacements.mjs` parses all 102 supplied replacement files, in the
original ERA filename/priority order. It returns a policy and a review ledger;
it never installs or activates a policy by default. Production activation needs
all source and target identities plus matching native evidence. A private
selection cannot be passed off as the full production configuration.

The policy resource is `config/era-object-replacements-v1.json`. Absence or
`enabled:false` is inert. `mod/tum-era` must register the target definitions before
an enabled policy is loaded. Each object uses two explicitly resolved identifiers
(`group` and `type`); no ERA subtype is reused as a VCMI numeric subtype.

The native hook runs on the serialized new-game day transition0→1. It cannot
replay when a day1 save is loaded or on a later day. The ordered kernel captures
one type-only count per source slot, then searches by coordinates (z/y/x), draws
0..99 before testing subtype or x bounds, and retains a shifted cursor after
replacement. Earlier programs and slots remain visible to later ones. For an
exhausted search the previous cursor is retained; there is no object-ID snapshot.

Original executable evidence (static, not observed Windows execution):

- h3era.exe SHA256451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181:
  UN:U count72f468, predicate72f394, coordinate continuation72f67b. The predicate
  uses entry tiles (access flag0x10), including a hero's underlying object.
- era.dll SHA256ced15e83ddab9b4edf8039cf337341b5810609fbe1f84f3bc1d8ec7d118ea451:
  directory loader48e528 and ordered-list builder48df18; equal-ID trigger linker
  48f8c4 preserves a Next chain. Source correspondence:
  https://github.com/ethernidee/era/blob/master/Erm.pas
  (`GetOrderedPrioritizedFileList`, `LoadScriptsFromDir`,
  `OptimizeFastAccessListAndRelinkTriggers`).

Both source files143_Frigate and144_Defunct declare CB_143 parameters and
FU(CB_143_Replace). They are retained, not arbitrarily dropped. With the supplied
source order the last parameters come from144_Defunct (target17/130, source17/67,
10%, offset0). Both day-one callbacks invoke the two identical FU handlers.
`functionMultiplicity:2` models their shared cursor and repeated draws. Native
validation of this collision is explicitly required by the production gate.

Scripts delete with UN:O, create with UN:I, then apply PO:N3. The original
PO:N3 / CB coordinate metadata is retained in the new object's
serialized unique instance name. It is not interpreted as creature-bank reward
or visitor state. A created Mysterious Cave also receives its actual visited
value3 while retaining the unvisited subtype: an AI first player sees it closed
until the subsequent human weekly reset, as in the source. Preplaced caves are
not changed by this placement adapter. Exact native behavior proofs are required before
production activation. The handling of a general Windows ERM error dialog is
not reproduced by the portable interpreter.

`tests/era-object-replacements.test.mjs` compiles the actual production kernel
with strict warnings and UBSan, covering chance boundaries, wrong subtypes,
x bounds, coordinate order, shared handlers, source slot ordering and gates.
The optional source test checks the supplied102 files and activation rejection.

The source callback guard is `x1=1/x3=1` (day1 and first player), not a later
read of the CB coordinate flags. The filename `Mysterious Cave.erm` sorts after
all numeric-underscore replacer filenames, so its daily RNG does not split the
102 selected replacement callbacks.

VCMI uses `std::minstd_rand` and its native integer distribution. Replacement
rolls use the same native global stream as newly created objects' reward and
appearance configuration. Those configuration draws are intentionally retained.
No equality between an original WoG seed and a VCMI seed is claimed. Tests check
source program/slot/cursor ordering and unchanged probabilities, deterministic
native positions, real created target anchors and native reload/day2 idempotence.
The private browser harness is `work/browser-tests/wog-replacements185-native-e2e.mjs`.
