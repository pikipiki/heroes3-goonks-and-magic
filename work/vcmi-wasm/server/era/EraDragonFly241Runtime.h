/* Original intrinsic241 dispel, independently admitted from its XP Weakness. */
#pragma once
#include "../../lib/era/EraDragonFly241State.h"
#include "../../lib/era/EraSourceXpAdmission.h"
#include "EraStatusAttacks.h"
#include "../../lib/era/EraSourceDefendState.h"
namespace era_compat_server
{
struct DragonFly241Permit
{
 bool enabled=false;
 bool sourceProxyOwnershipVerified=false;
 bool packetRemovalHookVerified=false;
};
inline era_bridge::DragonFly241Result runSourceDirectDispel241(CGameHandler & handler,
    const CBattleInfoCallback & battle,const CStack * actor,const CStack * target,
    BattleSide originalCurrentSide,DragonFly241Permit permit)
{
 if(!permit.enabled||!era_compat::sourceXpBattleAdmitted(battle))return{};
 if(!actor||actor->creatureId().toCreature()->getJsonKey()!="third-upgrades:tumChaoticDragonFly")return{};
 if(!permit.sourceProxyOwnershipVerified||!permit.packetRemovalHookVerified)
     throw std::runtime_error("Source241 private ownership/exact packet hook required");
 if(!SpellID(78).toSpell()||SpellID(78).toSpell()->getJsonKey()!="core:dispelHelpful")
     throw std::runtime_error("Source241 canonical spell78 identity changed");
 const auto inheritedDispel=actor->getBonuses(Selector::source(BonusSource::CREATURE_ABILITY,BonusSourceID(actor->creatureId()))
     .And(Selector::typeSubtype(BonusType::SPELL_AFTER_ATTACK,BonusSubtypeID(SpellID(78)))));
 if(inheritedDispel->size()!=1||!era_compat::dragonFly241OwnedNativeDispel(*inheritedDispel->front(),actor->creatureId()))
     throw std::runtime_error("Source241 native intrinsic78 ownership changed");
 if(!target)throw std::runtime_error("Source241 target required");
 if(!target->alive()){era_bridge::DragonFly241Result skipped;skipped.handled=true;return skipped;}
 // Capture and validate BEFORE RNG. No assumption from generic Dispel's
 // positiveness/target filters; only the26 original descriptor IDs are mapped.
 const auto captured=era_compat::captureDragonFly241Effects(*target);
 // Native DEFEND's percentage is dynamic; original4DC is a stored amount.
 // This combination needs its own source DEFEND ledger, not a generic deletion
 // followed by recomputation. Reject before consuming the source primary roll.
 if(target->hasBonusOfType(BonusType::UNIT_DEFENDING)
     &&(captured.durations[46]>0||captured.durations[48]>0||captured.durations[56]>0)
     &&!era_compat::sourceDefendState(*target))
     throw std::runtime_error("Source241 DEFEND stored-defense restoration not reconciled");
 era_bridge::DragonFly241Snapshot snapshot;snapshot.privatePermit=true;
 snapshot.sourceDurationsVerified=true;snapshot.sourceId=241;snapshot.targetAlive=target->alive();
 snapshot.originalActorSide=actor->unitSide()==BattleSide::ATTACKER?0:1;
 snapshot.currentSide=originalCurrentSide==BattleSide::ATTACKER?0:originalCurrentSide==BattleSide::DEFENDER?1:-1;
 snapshot.actorHypnotized=actor->isHypnotized();snapshot.durations=captured.durations;
 const auto targetSide=target->isHypnotized()
     ?(target->unitSide()==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER):target->unitSide();
 snapshot.targetHeroSphere92=era_compat::statusHasArtifact(battle.battleGetFightingHero(targetSide),92);
 struct Sink
 {
     CGameHandler & handler;const CBattleInfoCallback & battle;const CStack * actor;const CStack * target;
     const era_compat::DragonFly241NativeEffects & captured;std::vector<int> removed;
     int uniform(int a,int b){return handler.getRandomGenerator().nextInt(a,b);}
     void beginDirectCast(int spell,int mastery,int power,int kind,int side,int current)
     {
         if(spell!=78||mastery!=0||power!=3||kind!=1||current<0||current>1)throw std::runtime_error("Source241 direct cast contract mismatch");
         BattleSpellCast packet;packet.battleID=battle.getBattle()->getBattleID();packet.activeCast=false;
         packet.side=side==0?BattleSide::ATTACKER:BattleSide::DEFENDER;packet.spellID=SpellID(78);
         packet.tile=target->getPosition();packet.affectedCres.insert(target->unitId());
         packet.casterStack=actor->unitId();packet.castByHero=false;handler.sendAndApply(packet);
     }
     void removePositiveSourceSpell(int spell){removed.push_back(spell);}
     void endDirectCast()
     {
         auto packet=era_compat::dragonFly241RemovalPacket(battle.getBattle()->getBattleID(),*target,captured,removed);
         if(!packet.toRemove.empty()||!packet.toAdd.empty())handler.sendAndApply(packet);
     }
 } sink{handler,battle,actor,target,captured,{}};
 return era_bridge::runPrivateDragonFly241(snapshot,sink);
 // Caller must execute ordered XP after this function, then the previously
 // captured reflection. No queue, chance roll, revalidation or native reroll.
}
inline bool suppressSourceDragonFly241NativeDispel(const Bonus & bonus,const CStack * actor,
    bool direct78Handled)
{
 return direct78Handled&&actor&&actor->creatureId().toCreature()->getJsonKey()=="third-upgrades:tumChaoticDragonFly"
     &&era_compat::dragonFly241OwnedNativeDispel(bonus,actor->creatureId());
}
}
