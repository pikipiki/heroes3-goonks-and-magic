# Scuttle Boat reference and routing fix

The owner-supplied original resource examined was:
`/Volumes/Crucial X92/h3/Heroes.of.Might.and.Magic.3.Complete.v4.0/vcmi-data/Data/H3bitmap.lod`.
The LOD directory was parsed (92-byte header, 32-byte entries) and the selected text entries were decompressed with zlib. No original executable was run or decompiled.

Observed resource evidence:

- `SPTRAITS.TXT`, SHA-256 `0809ed7b2d7fc1357d96e4cd87bb5f9db6ad813b42d69dab29ab35fa3e1c11b9`, Scuttle Boat record at text line 25: an adventure spell that destroys an owned boat; base/basic success 50%, advanced 75%, expert guaranteed. It is not a hero-equipment action.
- `GENRLTXT.TXT`, SHA-256 `1e61c55cafde5fa234db1e438362d0e7cd426ac3b80811788f491e4d03163ad3`, line 394 supplies the original failure message for an unsuccessful attempt.

Current-engine source evidence:

- `config/spells/adventure.json` identifies `core:scuttleBoat` as a location-targeted remove-object adventure effect, configured for boats and range 9 × 8 from the hero's sight center.
- `lib/spells/adventure/RemoveObjectEffect.cpp` checks the native effect range and the target tile's object type, then applies its normal native probability and removal handling. This routing fix does not change those mechanics.
- `client/windows/CSpellWindow.cpp`, `SpellArea::clickPressed`: the old adventure branch popped only the spellbook, leaving the hero window above the map while entering map casting mode. The cast branch now closes a matching hero sheet as well. Normal spellbook exit still returns to the hero.
- `mobileSelectSpell` now checks target availability only when requesting Scuttle Boat, using the native effect's target validation and currently visible tiles on the hero's map level. With no eligible visible target, it keeps the book and displays an explicit unavailable message, without spending mana or revealing unexplored boats. Other native cast failures continue through the existing engine validation.

Limits: original text establishes intended spell purpose and probabilities; it does not establish original runtime target-selection behavior. The engine's current target rules remain authoritative here. In particular, no broader change to native boat ownership rules is included in this UI/routing fix.
