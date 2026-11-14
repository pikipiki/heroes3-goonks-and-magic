# Source status wake audit — 0.4.168

No new discrepancy established for Blind62, StoneGaze70 or Paralyze74.
This is a source/integration review, not a new native battle observation.

The active production implementation is the typed XP184 lifecycle, rather than
only config/spells/ability.json. `EraXpTimed184Runtime.h` captures Blind and
Paralyze before primary melee; `BattleActionProcessor.cpp` stores the frame,
checks normal retaliation eligibility after the hit and passes its percentage
through SourceXpRetaliationScope. `DamageCalculator.cpp` consumes that scope.
`BattleInfo.cpp` wakes typed62/70/74 on applied physical injury packets; the
explicit eraSourceXpDamageEntered marker includes an entered zero-damage hit,
while the full source physical block omits it. The local wake helper removes
only removable source-owned generations. Fresh post-hit XP effects therefore
survive generic UNTIL_BEING_ATTACKED cleanup.

`EraXpTimed184Rule.h` retains original62 mastery percentages50/50/25/0;
remembered74 caps the wake retaliation at25%, with simultaneous Blind taking
the smaller percentage. Dead targets, exhausted counters, current StoneGaze,
intrinsic suppression and retaliation blocking remain separate checks.
`EraSourceXpTimedRulesTest.cpp`, run by era-source-xp-rules.test.mjs, exercises
the actual production state/retaliation kernel with UBSan. It already covers
refresh, signed/nonpositive durations, expiry, wake percentages and the
counter/blocking checks. The737 committed-module tests pass after the three scoped
combat corrections.

The prior native285/312 XP witnesses prove successful Paralyze/StoneGaze
applications and fixed source duration3. They do not independently measure
wake damage75% reduction; that limitation remains explicit. No speculative
change to a working source lifecycle is warranted by that missing measurement.
