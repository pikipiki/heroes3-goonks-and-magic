/* TUM Horn266 primary-target conversion and BA53 gains; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/era/EraHorn266.h"
#include "../../lib/era/EraHorn266Policy.h"
#include "../../lib/era/EraBattleSlots.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include <optional>
#include <array>

struct EraHorn266Target
{
    uint32_t id;
    int32_t originalCount;
    int32_t maxHealth;
    BattleHex position;
    BattleSide side;
    bool living;
    bool clone;
};
inline std::optional<EraHorn266Target> captureEraHorn266Target(const CStack * stack)
{
    if(!era_compat::Horn266Policy::enabled() || !stack || stack->sourceMassSlot()<0
        || stack->sourceMassSlot()>20 || !stack->getPosition().isValid())return std::nullopt;
    return EraHorn266Target{stack->unitId(),stack->unitBaseAmount(),::era_bridge::hornSigned32(stack->getMaxHealth()),
        stack->getPosition(),stack->unitSide(),stack->hasBonusOfType(BonusType::LIVING),stack->isClone()};
}
inline const CArtifactInstance * equippedEraHorn266(const CBattleInfoCallback & battle,BattleSide side)
{
    if(!era_compat::Horn266Policy::enabled() || (side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER))return nullptr;
    const auto * hero=battle.getBattle()->getSideHero(side);
    if(!hero)return nullptr;
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero->getArt(ArtifactPosition(slot)))
            if(artifact->getType()->getJsonKey()=="tum-era:artifact266")return artifact;
    return nullptr;
}
inline void removeEraHorn266Corpse(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * corpse)
{
    // Source helper excludes clone/tower/special bodies; the following summon
    // attempt still happens. Native clone death already frees its old hex.
    if(!corpse || corpse->alive() || corpse->isGhost() || corpse->isClone() || corpse->isTurret())return;
    for(const auto hex:corpse->getHexes())if(battle.battleGetUnitByPos(hex,true))return;
    JsonNode before;auto state=corpse->acquire();state->save(before);
    const auto resurrected=before["state"]["health"]["resurrected"].Integer();
    BattleUnitsChanged remove;remove.battleID=battle.getBattle()->getBattleID();
    remove.changedStacks.emplace_back(corpse->unitId(),UnitChanges::EOperation::REMOVE);handler.sendAndApply(remove);
    if(resurrected)
    {
        if(const auto * removed=battle.battleGetStackByID(corpse->unitId(),false))
        {
            JsonNode saved;auto after=removed->acquire();after->save(saved);
            saved["state"]["health"]["resurrected"].Integer()=resurrected;
            BattleUnitsChanged restore;restore.battleID=remove.battleID;
            restore.changedStacks.emplace_back(corpse->unitId(),UnitChanges::EOperation::RESET_STATE);
            restore.changedStacks.back().data=std::move(saved);handler.sendAndApply(restore);
        }
    }
}
inline void applyEraHorn266Target(CGameHandler & handler,const CBattleInfoCallback & battle,
    BattleSide side,const std::optional<EraHorn266Target> & snapshot)
{
    if(!snapshot)return;
    const auto * artifact=equippedEraHorn266(battle,side);if(!artifact)return;
    const auto * target=battle.battleGetStackByID(snapshot->id,false);if(!target)return;
    const CreatureID fangarm(CreatureID::decode("tum-era:eraCreature263"));
    std::vector<::era_bridge::BattleSlotState> slots;int sideCount=0;
    for(const auto * stack:battle.battleGetAllStacks(false))
        if(stack->unitSide()==side && stack->sourceMassSlot()>=0 && stack->sourceMassSlot()<=20)
        {
            sideCount=std::max(sideCount,stack->sourceMassSlot()+1);
            slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
        }
    const int count=::era_bridge::horn266Count(snapshot->originalCount,target->getCount(),
        target->isGhost()?snapshot->maxHealth : ::era_bridge::hornSigned32(target->getMaxHealth()),
        ::era_bridge::hornSigned32(fangarm.toCreature()->getMaxHealth()),
        target->isGhost()?snapshot->living:target->hasBonusOfType(BonusType::LIVING),
        target->creatureId()==fangarm,sideCount,true);
    if(count<=0)return;
    removeEraHorn266Corpse(handler,battle,target);
    // Source SP16/audio run before the summon attempt, including failure.
    BattleSpellCast sound;sound.battleID=battle.getBattle()->getBattleID();sound.side=side;
    sound.spellID=SpellID(SpellID::decode("tum-era:sourceHornFangarmSummon"));
    sound.tile=snapshot->position;sound.activeCast=false;sound.castByHero=false;
    handler.sendAndApply(sound);
    // BU:S never searches another hex. Its pointer return is discarded by ERM.
    // Preserve the source20-slot domain even when native supports more units.
    if(::era_bridge::allocateBattleSlot(slots).originalDomain
        && battle.getAccessibility().accessible(snapshot->position,false,side))
    {
        battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=fangarm;info.side=side;
        info.position=snapshot->position;info.summoned=true;info.count=count;
        BattleUnitsChanged add;add.battleID=sound.battleID;
        add.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);
        info.save(add.changedStacks.back().data);handler.sendAndApply(add);
    }
    // BU:E independently reads the current hex cell after BU:S. A failed
    // summon can therefore capture a pre-existing occupant, including another
    // creature or side. This is defined source behavior, not an UB correction.
    const auto * occupant=battle.battleGetUnitByPos(snapshot->position,true);
    if(!occupant)return;
    const auto id=occupant->unitId();
    JsonNode saved;auto state=occupant->acquire();state->save(saved);
    saved["state"]["summoned"].Bool()=true;
    BattleUnitsChanged capture;capture.battleID=sound.battleID;
    capture.changedStacks.emplace_back(id,UnitChanges::EOperation::RESET_STATE);
    capture.changedStacks.back().data=std::move(saved);handler.sendAndApply(capture);
    // This typed serialized marker preserves explicit BM:B0, excludes the
    // captured unit from ordinary elemental exclusivity, and adds no save field.
    Bonus marker;marker.type=BonusType::ERA_ARTIFACT_SUMMON;marker.val=1;marker.hidden=true;
    marker.duration=BonusDuration::ONE_BATTLE;marker.source=BonusSource::ARTIFACT;
    marker.sid=BonusSourceID(artifact->getTypeId());
    marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,266,0});
    SetStackEffect effect;effect.battleID=sound.battleID;
    effect.toAdd.emplace_back(id,std::vector<Bonus>{marker});handler.sendAndApply(effect);
}
inline void applyEraHorn266Spell(CGameHandler & handler,const CBattleInfoCallback & battle,BattleSide actingSide,
    const std::optional<EraHorn266Target> & primary,const std::optional<EraHorn266Target> & actor)
{
    // Source action filter is targeted HERO/MONSTER cast, not damaging-spell
    // metadata. Global/AOE casts without a captured primary do not convert.
    if(!primary || primary->side==actingSide)return;
    applyEraHorn266Target(handler,battle,actingSide,primary);
    applyEraHorn266Target(handler,battle,primary->side,actor);
}
inline void carryEraHorn266Result(CGameHandler & handler,const CBattleInfoCallback & battle,const CGHeroInstance * winner)
{
    if(!era_compat::Horn266Policy::enabled() || !winner)return;
    BattleSide side=BattleSide::NONE;
    for(const auto candidate:{BattleSide::ATTACKER,BattleSide::DEFENDER})
        if(battle.getBattle()->getSideHero(candidate)==winner)side=candidate;
    if(side==BattleSide::NONE)return;
    const CreatureID fangarm(CreatureID::decode("tum-era:eraCreature263"));int32_t count=0;
    for(const auto * stack:battle.battleGetAllStacks(false))
        if(stack->unitSide()==side && stack->sourceMassSlot()>=0 && stack->sourceMassSlot()<=20
            && stack->creatureId()==fangarm)
            count=::era_bridge::horn266GainAdd(count,stack->getCount(),stack->unitBaseAmount());
    if(count<=0)return;
    const ArtifactID artifact(ArtifactID::decode("tum-era:artifact266"));
    Bonus marker;marker.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;marker.val=count;marker.hidden=true;
    marker.duration=BonusDuration::PERMANENT;marker.source=BonusSource::ARTIFACT;marker.sid=BonusSourceID(artifact);
    marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,266,battle.getBattle()->getBattleID().getNum(),count});
    GiveBonus packet(GiveBonus::ETarget::OBJECT,winner->id,marker);handler.sendAndApply(packet);
}
inline void giveEraHorn266Result(CGameHandler & handler,const CGHeroInstance & hero,const BattleID & battleID,bool mayReceive)
{
    if(!era_compat::Horn266Policy::enabled())return;
    int count=0;bool found=false;
    for(const auto & marker:*hero.getBonusesOfType(BonusType::ERA_SOURCE_ARTIFACT_STATE))
    {
        if(!marker->parameters)continue;
        const auto & p=marker->parameters->toVector();
        if(p.size()==4 && p[0]==1 && p[1]==266 && p[2]==battleID.getNum())
        {found=true;count=std::max(count,p[3]);}
    }
    if(!found)return;
    RemoveBonus remove;remove.who=GiveBonus::ETarget::OBJECT;remove.whoID=hero.id;
    remove.source=BonusSource::ARTIFACT;remove.id=BonusSourceID(ArtifactID(ArtifactID::decode("tum-era:artifact266")));
    handler.sendAndApply(remove);
    if(!mayReceive || !hero.getOwner().isValidPlayer() || count<=0)return;
    const CreatureID fangarm(CreatureID::decode("tum-era:eraCreature263"));
    std::array<int,7> ids;ids.fill(-1);
    for(int i=0;i<7;++i)if(const auto * stack=hero.getStackPtr(SlotID(i)))ids[i]=stack->getCreatureID()==fangarm?263:0;
    const int slot=::era_bridge::horn266ArmySlot(ids);
    if(slot>=0)handler.addToSlot(StackLocation(hero.id,SlotID(slot)),fangarm.toCreature(),count);
}
