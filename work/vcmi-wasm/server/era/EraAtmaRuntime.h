/* Source264/265 AE/CM2 stored adjustments. GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/bonuses/BonusParameters.h"
#include "../../lib/callback/CGameInfoCallback.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/era/EraAtmaState.h"
#include "../../lib/era/EraAtmaStateNative.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include <array>
#include <set>
#include <optional>

struct EraAtmaInventoryState
{
    ObjectInstanceID hero;
    std::array<std::optional<ArtifactInstanceID>,2> equipped{};
};
inline std::vector<EraAtmaInventoryState> captureEraAtmaInventory(const CPackForClient & pack,const IGameInfoCallback & info)
{
    if(era_compat::StatefulArtifactPolicies::get().empty())return {};
    std::set<ObjectInstanceID> owners;
    if(const auto * p=dynamic_cast<const NewArtifact *>(&pack))owners.insert(p->artHolder);
    else if(const auto * p=dynamic_cast<const PutArtifact *>(&pack)){if(!p->al.creature)owners.insert(p->al.artHolder);}
    else if(const auto * p=dynamic_cast<const BulkEraseArtifacts *>(&pack)){if(!p->creature)owners.insert(p->artHolder);}
    else if(const auto * p=dynamic_cast<const BulkMoveArtifacts *>(&pack))
    {if(!p->srcCreature)owners.insert(p->srcArtHolder);if(!p->dstCreature)owners.insert(p->dstArtHolder);}
    else if(const auto * p=dynamic_cast<const AssembledArtifact *>(&pack))owners.insert(p->al.artHolder);
    else if(const auto * p=dynamic_cast<const DisassembledArtifact *>(&pack))owners.insert(p->al.artHolder);
    std::vector<EraAtmaInventoryState> result;
    for(const auto owner:owners)if(const auto * hero=info.getHero(owner))
    {
        EraAtmaInventoryState captured;captured.hero=owner;const auto current=era_compat::equippedAtmaArtifacts(*hero);
        for(int i=0;i<2;++i)if(current[i])captured.equipped[i]=current[i]->getId();
        result.push_back(captured);
    }
    return result;
}
inline void removeEraAtmaAdjustment(CGameHandler & handler,const CGHeroInstance & hero,int source)
{
    const ArtifactID artifact(ArtifactID::decode("tum-era:artifact"+std::to_string(source)));
    const auto state=hero.getBonus(Selector::type()(BonusType::ERA_SOURCE_ARTIFACT_STATE)
        .And(Selector::source(BonusSource::ARTIFACT,BonusSourceID(artifact))));
    if(!state)return; // Source SN:W default is zero, including initially worn map artifacts.
    if(!state->parameters)throw std::runtime_error("Missing source artifact state payload");
    const auto delta=::era_bridge::decodeAtmaState(state->parameters->toVector(),source);
    for(int skill=0;skill<4;++skill)if(delta[skill])
        handler.changePrimSkill(&hero,PrimarySkill(skill),-int64_t(delta[skill]),ChangeValueMode::RELATIVE);
    RemoveBonus removed;removed.who=GiveBonus::ETarget::OBJECT;removed.whoID=hero.id;
    removed.source=BonusSource::ARTIFACT;removed.id=BonusSourceID(artifact);handler.sendAndApply(removed);
}
inline void applyEraAtmaAdjustment(CGameHandler & handler,const CGHeroInstance & hero,int source)
{
    const auto current=era_compat::equippedAtmaArtifacts(hero);
    if((source!=264 && source!=265) || !current[source-264])return;
    const ::era_bridge::AtmaSkills skills{hero.getPrimSkillLevel(PrimarySkill::ATTACK),hero.getPrimSkillLevel(PrimarySkill::DEFENSE),
        hero.getPrimSkillLevel(PrimarySkill::SPELL_POWER),hero.getPrimSkillLevel(PrimarySkill::KNOWLEDGE)};
    const auto delta=::era_bridge::atmaEquipAdjustment(source,skills);
    for(int skill=0;skill<4;++skill)if(delta[skill])
        handler.changePrimSkill(&hero,PrimarySkill(skill),delta[skill],ChangeValueMode::RELATIVE);
    Bonus state;state.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;state.duration=BonusDuration::PERMANENT;
    state.source=BonusSource::ARTIFACT;state.sid=BonusSourceID(current[source-264]->getTypeId());state.val=1;state.hidden=true;
    state.parameters=std::make_shared<BonusParameters>(::era_bridge::encodeAtmaState(source,delta));
    GiveBonus packet(GiveBonus::ETarget::OBJECT,hero.id,state);handler.sendAndApply(packet);
}
inline void reconcileEraAtmaInventory(CGameHandler & handler,const std::vector<EraAtmaInventoryState> & previous)
{
    for(const auto & old:previous)if(const auto * hero=handler.gameInfo().getHero(old.hero))
    {
        const auto current=era_compat::equippedAtmaArtifacts(*hero);
        // Each source has one legal body slot. Moving a copy to backpack is an
        // unequip; transferring copies preserves independent per-hero state.
        for(const int source:{265,264})if(old.equipped[source-264]!=(current[source-264]
            ?std::optional<ArtifactInstanceID>(current[source-264]->getId()):std::nullopt))
        {removeEraAtmaAdjustment(handler,*hero,source);applyEraAtmaAdjustment(handler,*hero,source);}
    }
}
inline void refreshEraAtma(CGameHandler & handler,const CGHeroInstance & hero)
{
    // Original CM2 refreshes Armor first, then Sword, and only equipped copies.
    const auto current=era_compat::equippedAtmaArtifacts(hero);
    for(const int source:{265,264})if(current[source-264])
    {removeEraAtmaAdjustment(handler,hero,source);applyEraAtmaAdjustment(handler,hero,source);}
}
