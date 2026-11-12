/* TUM261 original battlefield setup hook; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/CStack.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/callback/CGameInfoCallback.h"
#include "../../lib/era/EraBridgeArtifactPolicies.h"
#include "../../lib/era/EraExchangeCloak.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/SetStackEffect.h"

inline bool equippedEraExchangeCloak(const CGHeroInstance & hero)
{
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
            if(era_compat::ArtifactPolicies::get().exchangeCloak(artifact->getType()->getJsonKey()))return true;
    return false;
}
inline void applyEraExchangeCloak(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    const auto * attacker=battle.battleGetFightingHero(BattleSide::ATTACKER);
    const auto * defender=battle.battleGetFightingHero(BattleSide::DEFENDER);
    if(!attacker || !defender)return;
    const bool real=handler.gameInfo().getPlayerState(attacker->getOwner())->isHuman()
        || handler.gameInfo().getPlayerState(defender->getOwner())->isHuman();
    const auto stats=[](const CGHeroInstance & hero)
    {
        return ::era_bridge::ExchangeHeroStats{hero.getPrimSkillLevel(PrimarySkill::ATTACK),
            hero.getPrimSkillLevel(PrimarySkill::DEFENSE),hero.mana};
    };
    const auto changes=::era_bridge::exchangeCloakChanges(real,true,
        equippedEraExchangeCloak(*attacker),equippedEraExchangeCloak(*defender),stats(*attacker),stats(*defender));
    if(!changes)return;
    // HE:I changes persistent hero mana in source. Power and Knowledge do not
    // change. Native packets synchronize both clients and save the new pools.
    handler.setManaPoints(attacker->id,(*changes)[0].mana);
    handler.setManaPoints(defender->id,(*changes)[1].mana);
    SetStackEffect effects;effects.battleID=battle.getBattle()->getBattleID();
    for(const auto * stack:battle.battleGetAllStacks(true))
    {
        const int id=stack->creatureId().getNum();
        if(!::era_bridge::exchangeCloakAffectsCreature(id))continue;
        const auto & change=(*changes)[stack->unitSide()==BattleSide::ATTACKER?0:1];
        std::vector<Bonus> bonuses;
        for(const auto & entry:std::array<std::pair<PrimarySkill,int>,2>{{
            {PrimarySkill::ATTACK,change.attackDelta},{PrimarySkill::DEFENSE,change.defenseDelta}}})
        {
            if(!entry.second)continue;
            Bonus bonus;bonus.type=BonusType::PRIMARY_SKILL;bonus.subtype=BonusSubtypeID(entry.first);
            bonus.val=entry.second;bonus.duration=BonusDuration::ONE_BATTLE;
            bonus.source=BonusSource::ARTIFACT;
            bonus.sid=BonusSourceID(ArtifactID(ArtifactID::decode("tum-era:artifact261")));
            bonuses.push_back(bonus);
        }
        if(!bonuses.empty())effects.toAdd.emplace_back(stack->unitId(),std::move(bonuses));
    }
    if(!effects.toAdd.empty())handler.sendAndApply(effects);
}
