/* Ordered-XP execution services, not an admission or BAP hook. The caller owns
 * chance+primary resistance RNG, group entry alive and14-slot sequencing.
 * Source5A0140/5A8950/5A7390. GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "EraFaerieChainRuntime.h"
#include "../../lib/CStack.h"
#include "../../lib/era/EraSourceXpPlacementRule.h"
#include "../../lib/era/EraSourceXpElementalState.h"
#include "../../lib/era/EraSourceXpGeometryState.h"
#include "../../lib/era/EraBattleSlots.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../../lib/battle/AccessibilityInfo.h"
#include "../../lib/battle/CObstacleInstance.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/spells/TargetCondition.h"
#include "EraSourceXpEarthquake.h"
namespace era_compat_server
{
inline bool supportsXpGeometryDamage(int spell)
{
    switch(spell){case 10:case 11:case 13:case 14:case 16:case 17:case 19:case 21:case 22:case 25:case 66:case 67:case 68:return true;default:return false;}
}
inline void initializeXpElementalBookkeeping(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    // Call only after independent source-XP admission, BEFORE first native action.
    if(!era_compat::xpElementalState(battle))
        era_compat::writeXpElementalState(battle,{-1,-1},[&](auto & p){handler.sendAndApply(p);});
}
inline void initializeXpGeometryState(CGameHandler & handler,const CBattleInfoCallback & battle)
{era_compat::initializeXpGeometryState(battle,[&](auto & packet){handler.sendAndApply(packet);});}
inline int queryXpGeometryDamage(const CBattleInfoCallback & battle,const CStack * actor,
    const CStack * target,int spellId,BattleSide currentSide,BattleSide querySide)
{
    if(!supportsXpGeometryDamage(spellId)||!actor||!target)throw std::runtime_error("Invalid source XP geometry query");
    const auto * spell=SpellID(spellId).toSpell();
    era_compat::ConfluxSideScope current(currentSide,1);
    era_compat::ConfluxResistanceScope side(true,querySide);
    if(!era_compat::sourceSpellContextAllows(battle,target,spell))return 0;
    //44A384 checks original UNDEAD before Orb negation or racial resistance.
    if(spellId==25&&!target->hasBonusOfType(BonusType::UNDEAD))return 0;
    // XP5A8950 ignores physical/friendly side; do not invoke smart ownership
    // target filters or the source Faerie/CFG FLOAT prequery here.
    era_compat::ExperienceAttackCaster ability(actor,battle.sideToPlayer(querySide),3);
    spells::BattleCast query(&battle,&ability,spells::Mode::PASSIVE,spell);
    query.setSpellLevel(3);query.setEffectPower(3);query.setEffectDuration(3);
    auto mechanics=spell->battleMechanics(&query);
    const auto * f=spells::TargetConditionItemFactory::getDefault();spells::TargetCondition condition;
    condition.absolute={f->createAbsoluteSpell(),f->createAbsoluteLevel()};
    condition.normal={f->createElemental(),f->createNormalLevel(),f->createNormalSpell()};
    condition.negation={f->createReceptiveFeature(),f->createImmunityNegation()};
    if(spellId==19)
        if(const auto rod=era_compat::sourceLightningResistance(battle,19,currentSide,*target))return 100-*rod;
    if(!condition.isReceptive(mechanics.get(),target))return 0;
    return era_compat::statusRawAccuracy(battle,target,true,querySide);
}
inline era_bridge_xp_geometry::RawSourceCell xpPlacementCell(const CBattleInfoCallback & battle,int hex)
{
    const BattleHex tile(hex);era_bridge_xp_geometry::RawSourceCell cell{0,-1,0};
    const auto access=battle.getAccessibility();
    if(access[hex]!=EAccessibility::ACCESSIBLE&&access[hex]!=EAccessibility::ALIVE_STACK)cell.flags1D4|=2;
    // Source flags1(anchor)/2(blocker)/4/8/16/32 reject all source non-moat
    // obstacles, including passable traps. Source1E0 separately rejects corpses.
    const auto cached=era_compat::xpGeometryState(battle);
    if(!cached)throw std::runtime_error("Source XP geometry enrollment must precede first action");
    cell.flags1D4|=cached->flags[hex]&63;
    for(const auto & obstacle:battle.battleGetAllObstacles())
        if(era_compat::xpObstacleFlags(*obstacle)==0&&obstacle->obstacleType!=CObstacleInstance::MOAT
            &&(obstacle->pos==tile||obstacle->getAffectedTiles().contains(tile)))cell.flags1D4|=1;
    for(const auto * unit:battle.battleGetStacksIf([](const CStack * s){return !s->isGhost();}))
    {
        if(unit->sourceMassSlot()<0||!unit->getPosition().isValid()||!unit->getHexes().contains(tile))continue;
        if(unit->alive())cell.side1DC=int(unit->unitSide());else ++cell.occupancy1E0;
    }
    return cell;
}
inline void xpPutObstacle(CGameHandler & handler,const CBattleInfoCallback & battle,int spell,
    int hex,int mastery,int power,BattleSide currentSide,bool cachedNativeEnemy)
{
    SpellCreatedObstacle obstacle;obstacle.uniqueID=battle.nextObstacleId();obstacle.pos=BattleHex(hex);
    obstacle.ID=spell;obstacle.trigger=SpellID::NONE;obstacle.casterSide=currentSide;obstacle.spellLevel=mastery;
    obstacle.turnsRemaining=spell==13?2:-1;obstacle.casterSpellPower=0;obstacle.minimalDamage=power;
    obstacle.passable=true;obstacle.hidden=spell!=13;obstacle.nativeVisible=false;
    obstacle.revealed=spell==13||cachedNativeEnemy;obstacle.trap=spell==10;obstacle.removeOnTrigger=spell==11;
    obstacle.animation=AnimationPath::builtin(spell==10?"C17SPE1":spell==11?"C09SPF1":"C07SPF61");
    obstacle.appearAnimation=AnimationPath::builtin(spell==10?"C17SPE0":spell==11?"C09SPF0":"C07SPF60");
    obstacle.appearSound=AudioPath::builtin(spell==10?"QUIKSAND":spell==11?"LANDMINE":"FIREWALL");
    obstacle.animationYOffset=spell==10?-42:0;obstacle.customSize.insert(BattleHex(hex));
    if(spell==11)obstacle.trigger=SpellID(SpellID::decode("tum-era:sourceXpLandMineTrigger"));
    if(spell==13)obstacle.trigger=SpellID(SpellID::decode("tum-era:sourceXpFireWallTrigger"));
    BattleObstaclesChanged packet;packet.battleID=battle.getBattle()->getBattleID();
    packet.changes.emplace_back();obstacle.toInfo(packet.changes.back());handler.sendAndApply(packet);
    era_compat::noteXpGeometryCreated(battle,obstacle,[&](auto & p){handler.sendAndApply(p);});
}
inline int xpRawValue(int spell,int mastery,int power)
{
    const auto * source=SpellID(spell).toSpell();
    // OriginalIMUL32+ADD32. Win32 wrap is defined explicitly, not int64.
    return era_bridge_xp_geometry::rawValue(power,source->getBasePower(),source->getLevelPower(mastery));
}
inline void xpElementalSummon(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,int spell,int mastery,int power,BattleSide currentSide)
{
    const int id=spell==66?114:spell==67?113:115;const auto type=CreatureID(id);
    const auto access=battle.getAccessibility();
    const bool wide=type.toCreature()->isDoubleWide();
    const int hex=era_bridge_xp_geometry::summonPosition(int(currentSide),
        [&](){return handler.getRandomGenerator().nextInt(0,32767);},[&](int p)
        {return access.accessible(BattleHex(p),wide,currentSide);});
    // Source5A74D6 writes latest type BEFORE both no-room and no-slot failures.
    era_compat::recordXpElemental(battle,currentSide,id,[&](auto & p){handler.sendAndApply(p);});
    std::vector<era_bridge::BattleSlotState> slots;
    for(const auto * unit:battle.battleGetStacksIf([](const CStack *){return true;}))
        if(unit->unitSide()==currentSide&&unit->sourceMassSlot()>=0)
            slots.push_back({unit->sourceMassSlot(),unit->alive()&&!unit->isGhost(),unit->summoned});
    if(hex<0||!era_bridge::allocateBattleSlot(slots).originalDomain)return;
    const int32_t count=era_bridge_xp_geometry::rawValue(power,SpellID(spell).toSpell()->getLevelPower(mastery),0);
    // Defined Win32 behavior outside the positive-count port domain: source
    // would allocate a nonpositive record which still occupies hex/slot and
    // can prevent battle end. Preserve source bookkeeping/RNG above, omit that
    // corrupt battle unit explicitly; do not describe this as undefined behavior.
    if(!era_bridge_xp_geometry::positiveSummonDomain(count))return;
    battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=type;
    info.count=count;info.side=currentSide;info.position=BattleHex(hex);info.summoned=true;
    BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();
    packet.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);info.save(packet.changedStacks.back().data);
    BattleSpellCast cue;cue.battleID=packet.battleID;cue.side=currentSide;cue.spellID=SpellID(spell);
    cue.tile=BattleHex(hex);cue.casterStack=actor->unitId();cue.castByHero=false;cue.activeCast=false;
    handler.sendAndApply(cue);handler.sendAndApply(packet);
    // Passive pre-attack casts do not have a separate spell action to drain
    // the client's HIT stage. Finish the summon/fade before movement or attack
    // can replace that stage; this packet carries no injury or random draw.
    StacksInjured finish;finish.battleID=packet.battleID;handler.sendAndApply(finish);
}
inline void castXpGeometryDamage(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,int spell,int mastery,
    BattleSide currentSide,BattleSide querySide,int power)
{
    if(!supportsXpGeometryDamage(spell)||!actor||!target||mastery<0||mastery>3)
        throw std::runtime_error("Invalid source XP geometry/damage dispatch");
    era_compat::ConfluxSideScope current(currentSide,1);
    if(spell==14){castSourceXpEarthquake(handler,battle,actor,mastery);return;}
    if(spell>=66&&spell<=68){xpElementalSummon(handler,battle,actor,spell,mastery,power,currentSide);return;}
    if(spell==10||spell==11||spell==13)
    {
        if(!era_compat::xpGeometryState(battle))throw std::runtime_error("Source XP geometry enrollment must precede first action");
        const bool nativeEnemy=battle.battleHasNativeStack(currentSide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER);
        const int raw=spell==10?0:xpRawValue(spell,mastery,power);
        if(spell==13)
        {
            for(const int hex:era_bridge_xp_geometry::fireWallCells(target->getPosition().toInt(),mastery,int(currentSide)))
                if(hex>=0&&hex<187&&hex%17!=0&&hex%17!=16)xpPutObstacle(handler,battle,13,hex,mastery,raw,currentSide,false);
            return;
        }
        era_bridge_xp_geometry::randomPlacements(mastery,[&](){return handler.getRandomGenerator().nextInt(0,32767);},
            [&](int hex){return xpPlacementCell(battle,hex);},[&](int hex){xpPutObstacle(handler,battle,spell,hex,mastery,raw,currentSide,nativeEnemy);});
        return;
    }
    const auto * source=SpellID(spell).toSpell();
    era_compat::ExperienceAttackCaster ability(actor,battle.sideToPlayer(querySide),mastery);
    era_compat::ConfluxCaster caster(&ability,battle.battleGetFightingHero(currentSide),battle.sideToPlayer(querySide));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,source);
    cast.eraExperiencePreAttack=true;cast.setSpellLevel(mastery);cast.setEffectPower(power);cast.setEffectDuration(power);
    cast.setEffectValue(xpRawValue(spell,mastery,power)); //5A0140 dispatch IMUL32+ADD32 before hero correction.
    if(spell==19){applySourceXpNormalChain(handler,battle,actor,target,cast,currentSide);return;}
    spells::Target destination;destination.emplace_back(target);cast.cast(handler.spellcastEnvironment(),destination);
}
}
