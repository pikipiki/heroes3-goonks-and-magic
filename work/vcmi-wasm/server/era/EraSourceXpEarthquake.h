#pragma once
#include "../../lib/era/EraSourceXpEarthquakeRule.h"
namespace era_compat_server {
inline void castSourceXpEarthquake(CGameHandler&handler,const CBattleInfoCallback&battle,const CStack*actor,int mastery){
 // Original wall identifiers5,6,8,9,10,12,13,14 map to the corresponding
 // logical native fortification parts; native siege graphics keep their own hexes.
 constexpr std::array<EWallPart,8> parts{EWallPart::UPPER_WALL,EWallPart::OVER_GATE,EWallPart::GATE,EWallPart::BELOW_GATE,EWallPart::BOTTOM_WALL,EWallPart::BOTTOM_TOWER,EWallPart::KEEP,EWallPart::UPPER_TOWER};
 std::array<int,8> health{};for(int i=0;i<8;++i)health[i]=std::max(0,int(battle.battleGetWallState(parts[i])));
 const auto hits=era_bridge::sourceXpEarthquakeHits(health,SpellID(14).toSpell()->getLevelPower(mastery),[&](int lo,int hi){return handler.getRandomGenerator().nextInt(lo,hi);});
 BattleSpellCast cue;cue.battleID=battle.getBattle()->getBattleID();cue.side=actor->unitSide();cue.spellID=SpellID(14);cue.casterStack=actor->unitId();cue.activeCast=false;cue.castByHero=false;handler.sendAndApply(cue);
 CatapultAttack packet;packet.battleID=cue.battleID;packet.attacker=actor->unitId();
 for(int i=0;i<8;++i)if(hits[i]){CatapultAttack::AttackInfo info;info.attackedPart=parts[i];info.damageDealt=hits[i];info.destinationTile=battle.wallPartToBattleHex(parts[i]).toInt();packet.attackedParts.push_back(info);}
 if(!packet.attackedParts.empty())handler.sendAndApply(packet);
 BattleUnitsChanged removed;removed.battleID=cue.battleID;
 for(const auto&entry:std::array<std::pair<EWallPart,BattleHex>,3>{{{EWallPart::KEEP,BattleHex::CASTLE_CENTRAL_TOWER},{EWallPart::BOTTOM_TOWER,BattleHex::CASTLE_BOTTOM_TOWER},{EWallPart::UPPER_TOWER,BattleHex::CASTLE_UPPER_TOWER}}})
  if(battle.battleGetWallState(entry.first)==EWallState::DESTROYED)
   for(const auto*unit:battle.battleGetUnitsIf([&](const battle::Unit*u){return !u->isGhost()&&u->getPosition()==entry.second;}))removed.changedStacks.emplace_back(unit->unitId(),UnitChanges::EOperation::REMOVE);
 if(!removed.changedStacks.empty())handler.sendAndApply(removed);
}
}
