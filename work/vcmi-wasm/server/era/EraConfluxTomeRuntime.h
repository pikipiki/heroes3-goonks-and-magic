/* Emerald MonGiveSpell available-spell cache, source356/Tome88 only.
 * This is not permanent spell learning. GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/callback/IGameInfoCallback.h"
#include "../../lib/era/EraConfluxPolicies.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/spells/CSpellHandler.h"
#include <array>
#include <set>

inline bool eraConfluxTomeCarrier(const CGHeroInstance & hero)
{
    if(!era_compat::ConfluxPolicies::get().enabled())return false;
    for(const auto & slot:hero.Slots())
        if(slot.second->getCount()>0
            && era_compat::ConfluxPolicies::get().is356(slot.second->getCreatureID().toCreature()->getJsonKey()))return true;
    return false;
}
inline BonusSourceID eraConfluxTomeSource()
{return BonusSourceID(CreatureID(CreatureID::decode("tum-era:eraCreature356")));}
inline void appendEraConfluxTome(CGameHandler & handler,const CGHeroInstance & hero)
{
    if(!eraConfluxTomeCarrier(hero))return;
    const auto source=eraConfluxTomeSource();
    if(hero.hasBonus(Selector::type()(BonusType::ERA_SOURCE_TOME_CACHE)
        .And(Selector::source(BonusSource::CREATURE_ABILITY,source))))return;
    Bonus bonus;bonus.type=BonusType::ERA_SOURCE_TOME_CACHE;bonus.val=88;
    bonus.duration=BonusDuration::PERMANENT;bonus.source=BonusSource::CREATURE_ABILITY;
    bonus.sid=source;bonus.hidden=true;
    GiveBonus packet(GiveBonus::ETarget::OBJECT,hero.id,bonus);handler.sendAndApply(packet);
}
struct EraConfluxInventoryState
{
    ObjectInstanceID hero;
    std::array<ArtifactInstanceID,19> worn;
    std::array<bool,19> spellArtifacts;
};
inline std::array<ArtifactInstanceID,19> eraConfluxWorn(const CGHeroInstance & hero)
{
    std::array<ArtifactInstanceID,19> result;
    result.fill(ArtifactInstanceID(-1));
    for(int i=0;i<19;++i)if(const auto * artifact=hero.getArt(ArtifactPosition(i)))result[i]=artifact->getId();
    return result;
}
inline std::array<bool,19> eraConfluxSpellArtifacts(const CGHeroInstance & hero)
{
    std::array<bool,19> result{};
    for(int i=0;i<19;++i)if(const auto * artifact=hero.getArt(ArtifactPosition(i)))
        result[i]=era_compat::ConfluxPolicies::get().resetsTome(artifact->getType()->getJsonKey());
    return result;
}
inline std::vector<EraConfluxInventoryState> captureEraConfluxInventory(const CPackForClient & pack,const IGameInfoCallback & info)
{
    if(!era_compat::ConfluxPolicies::get().enabled())return {};
    std::set<ObjectInstanceID> owners;
    if(const auto * p=dynamic_cast<const NewArtifact *>(&pack))owners.insert(p->artHolder);
    else if(const auto * p=dynamic_cast<const PutArtifact *>(&pack)){if(!p->al.creature)owners.insert(p->al.artHolder);}
    else if(const auto * p=dynamic_cast<const BulkEraseArtifacts *>(&pack)){if(!p->creature)owners.insert(p->artHolder);}
    else if(const auto * p=dynamic_cast<const BulkMoveArtifacts *>(&pack))
    {if(!p->srcCreature)owners.insert(p->srcArtHolder);if(!p->dstCreature)owners.insert(p->dstArtHolder);}
    else if(const auto * p=dynamic_cast<const AssembledArtifact *>(&pack))owners.insert(p->al.artHolder);
    else if(const auto * p=dynamic_cast<const DisassembledArtifact *>(&pack))owners.insert(p->al.artHolder);
    else if(const auto * p=dynamic_cast<const BattleResultsApplied *>(&pack))
        for(const auto & move:p->movingArtifacts)
        {if(!move.srcCreature)owners.insert(move.srcArtHolder);if(!move.dstCreature)owners.insert(move.dstArtHolder);}
    std::vector<EraConfluxInventoryState> result;
    for(const auto id:owners)if(const auto * hero=info.getHero(id))result.push_back({id,eraConfluxWorn(*hero),eraConfluxSpellArtifacts(*hero)});
    return result;
}
inline void reconcileEraConfluxInventory(CGameHandler & handler,const std::vector<EraConfluxInventoryState> & previous)
{
    for(const auto & old:previous)if(const auto * hero=handler.gameInfo().getHero(old.hero))
    {
        const auto worn=eraConfluxWorn(*hero);
        const auto flags=eraConfluxSpellArtifacts(*hero);
        bool rebuild=false;
        for(int i=0;i<19;++i)
            if(old.worn[i]!=worn[i] && (old.spellArtifacts[i] || flags[i]))rebuild=true;
        if(rebuild && hero->hasBonus(Selector::source(BonusSource::CREATURE_ABILITY,eraConfluxTomeSource())))
        {
            //4E2E27/4E2FA6 call4D9840 only for source spellflag items (or
            //assembled combo spellflags). Ordinary weapons and bag sorting
            //must retain an otherwise orphaned available-spell cache.
            // Only our cache bonuses are removed. Learned/native/item grants stay.
            RemoveBonus packet;packet.who=GiveBonus::ETarget::OBJECT;packet.whoID=hero->id;
            packet.source=BonusSource::CREATURE_ABILITY;packet.id=eraConfluxTomeSource();
            handler.sendAndApply(packet);
        }
    }
}
