/* Original14-slot XP dispatcher. Every new row requires independent admission. */
#pragma once
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/era/EraWeakness45State.h"
#include "../../lib/era/EraWeakness45Generic.h"
#include "EraXpTimed184Runtime.h"
#include "EraSourceXpAccessRuntime.h"
#include "EraSourceXpGeometryDamage.h"
#include "EraSourceXpDispel78.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include "../../lib/IGameSettings.h"
#include "../../lib/callback/IGameInfoCallback.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
namespace era_compat_server
{
inline bool sourceXpModuleEnabled(CGameHandler & handler)
{return handler.gameInfo().getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE);}
inline bool sourceXpPrepared(CGameHandler & handler,const CStack * actor)
{
 return actor&&sourceXpModuleEnabled(handler)&&actor->alive()
   &&actor->unitSlot()!=SlotID::COMMANDER_SLOT_PLACEHOLDER;
}
class SourceExperienceSink
{
 CGameHandler & handler; const CBattleInfoCallback & battle;
 const CStack * actor; const CStack * target; BattleSide currentSide;
public:
 SourceExperienceSink(CGameHandler & h,const CBattleInfoCallback & b,const CStack * a,
   const CStack * t,BattleSide side):handler(h),battle(b),actor(a),target(t),currentSide(side){}
 bool prepareSourceGroup(char)const{return sourceXpPrepared(handler,actor);}
 bool casterAlive()const{return actor->alive();}
 bool targetAlive()const{return target->alive();}
 int chanceRoll(){return handler.getRandomGenerator().nextInt(1,100);}
    int casterQuerySide()const
    {
        auto side=actor->unitSide();if(actor->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
        return side==BattleSide::ATTACKER?0:1;
    }
    era_bridge::SourceXpCurrent currentForCast()const
    {
        const auto * active=battle.battleActiveUnit();
        if(!active)throw std::runtime_error("Source XP CURRENT primary unavailable");
        const auto & key=active->creatureId().toCreature()->getJsonKey();
        const int sourceId=era_compat::StatusAttacks::get().id(key);
        int power=active->getCount();
        if(active->unitSlot()==SlotID::COMMANDER_SLOT_PLACEHOLDER)
        {
            const int raw=active->valOfBonuses(BonusType::CREATURE_SPELL_POWER)/100;
            power=era_bridge::SourceCreatureSpellPower::commander(raw,key=="wake-of-gods.commanders:soulEater1");
        }
        return {sourceId,currentSide==BattleSide::ATTACKER?0:1,static_cast<std::uint32_t>(power)};
    }

 bool primaryAccepts(const era_bridge::SourceXpPrimaryQuery & query)
 {
  const auto & row=query.provenance;
  const auto side=query.primaryQuerySide==0?BattleSide::ATTACKER:BattleSide::DEFENDER;
  int accuracy=0;
  if(supportsXpTimed(row.spell))accuracy=queryXpTimed(handler,battle,actor,target,row.spell,
      era_bridge::sourceXpMastery(row.code),currentSide,side);
  else if(supportsXpGeometryDamage(row.spell))accuracy=queryXpGeometryDamage(battle,actor,target,row.spell,currentSide,side);
  else if(row.spell==78)accuracy=queryXpDispel78(battle,actor,target,row);
  else if(row.spell==71)
  {
   era_compat::ConfluxSideScope current(currentSide,1);
   era_compat::ConfluxResistanceScope primary(true,side);
   accuracy=statusPrimaryAccuracy(battle,actor,target,SpellID(71));
  }
  else if(row.spell==45)
  {
   era_compat::ConfluxSideScope current(currentSide,1);
   era_compat::ConfluxResistanceScope primary(true,side);
   const auto * spell=SpellID(45).toSpell();
   era_compat::ExperienceAttackCaster caster(actor,battle.sideToPlayer(side),era_bridge::sourceXpMastery(row.code));
   spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
   cast.eraExperiencePreAttack=true;cast.setSpellLevel(era_bridge::sourceXpMastery(row.code));
   cast.setEffectPower(3);cast.setEffectDuration(3);
   const bool accepts=era_compat::sourceSpellContextAllows(battle,target,spell)
       &&spell->battleMechanics(&cast)->isReceptive(target);
   accuracy=accepts?era_compat::statusRawAccuracy(battle,target):0;
  }
  else throw std::runtime_error("Unclosed XP43 primary endpoint");
  //71D939 always consumes this integer roll, including0/100 thresholds.
  return handler.getRandomGenerator().nextInt(1,100)<=accuracy;
 }
 void cast(const era_bridge::SourceXpCastRequest & request)
 {
  const auto & row=request.provenance;
  if(!era_compat::SourceXpAdmissionPolicy::get().owns(row)||request.casterKind!=1)
     throw std::runtime_error("Unadmitted XP43 cast");
  const auto side=request.primaryQuerySide==0?BattleSide::ATTACKER:BattleSide::DEFENDER;
  if(supportsXpTimed(row.spell))castXpTimed(handler,battle,actor,target,row.spell,request.power,
      request.mastery,currentSide,side);
  else if(supportsXpGeometryDamage(row.spell))castXpGeometryDamage(handler,battle,actor,target,
      row.spell,request.mastery,currentSide,side,request.power);
  else if(row.spell==78)castXpDispel78(handler,battle,actor,target,request);
  else if(row.spell==71)
  {
   era_compat::ConfluxSideScope current(currentSide,1);
   applySourceStatus(handler,battle,actor,target,SpellID(71),request.mastery,battle.sideToPlayer(side),request.power);
  }
  else if(row.spell==45)
  {
   const auto old=era_compat::readSourceWeakness45(target);
   if(old.foreignWeakness)throw std::runtime_error("Unreconciled original Weakness effect");
   const auto change=era_bridge::weakness45Apply(old.state,old.storedAttack,request.power,
       request.mastery,era_bridge::weakness45XpMagnitude(row.code,row.sourceId));
   BattleSpellCast visual;visual.battleID=battle.getBattle()->getBattleID();visual.activeCast=false;
   visual.side=side;visual.spellID=SpellID(45);visual.tile=target->getPosition();
   visual.affectedCres.insert(target->unitId());visual.casterStack=actor->unitId();visual.castByHero=false;
   handler.sendAndApply(visual);
   auto packet=era_compat::sourceWeakness45Packet(visual.battleID,target,old,change.state);
   if(!packet.toRemove.empty()||!packet.toAdd.empty())handler.sendAndApply(packet);
  }
  else throw std::runtime_error("Unclosed XP43 execution endpoint");
 }
};
// Access/lifecycle scope is installed by the containing original attack frame.
inline bool runSourceExperience(CGameHandler & handler,const CBattleInfoCallback & battle,
 const CStack * actor,const CStack * target,era_bridge::SourceXpPhase phase)
{
 if(!actor||!target||!era_compat::sourceXpBattleAdmitted(battle)||!sourceXpPrepared(handler,actor))return false;
 const auto & key=actor->creatureId().toCreature()->getJsonKey();
 const auto & policy=era_compat::SourceXpAdmissionPolicy::get();
 const auto first=std::find_if(era_bridge::sourceXpAdmissionRows.begin(),era_bridge::sourceXpAdmissionRows.end(),
   [&](const auto & row){return row.nativeId==key&&policy.owns(row);});
 if(first==era_bridge::sourceXpAdmissionRows.end())return false;
 // Every candidate row for this actor must be admitted before any chance draw.
 for(const auto & row:era_bridge::sourceXpAdmissionRows)
   if(row.sourceId==first->sourceId&&!row.existingSourceOwner&&!policy.owns(row))
     throw std::runtime_error("Whole actor XP permission required");
 const auto current=era_compat::confluxActiveSide(battle);
 if(current==BattleSide::NONE)throw std::runtime_error("XP43 CURRENT active side required");
 auto access=sourceXpTimedAccess(handler,battle);
 XpTimed184AccessScope accessScope(access);
 SourceExperienceSink sink(handler,battle,actor,target,current);
 const int rank=actor->base?actor->base->getExpRank():0;
 era_bridge::runSourceXpPhase(era_bridge::sourceXpAdmissionRows,era_bridge::SourceXpPermit::Admitted,
    phase,first->sourceId,key,rank,sink);
 return true;
}
}
