/* Third Upgrade Mod.erm1992..2028 OnSetupBattlefield. GPL-2.0-or-later. */
#pragma once
#include <array>
#include "../CGameHandler.h"
#include "../../lib/era/EraInterference.h"
#include "../../lib/era/EraInterferenceState.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/networkPacks/PacksForClient.h"
inline void applyEraInterference(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    const auto * left=battle.getBattle()->getSideHero(BattleSide::ATTACKER);
    const auto * right=battle.getBattle()->getSideHero(BattleSide::DEFENDER);
    if(!left || !right)return; // Original explicitly requires two heroes.
    for(const auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})
    {
        const auto * carrier=battle.getBattle()->getSideHero(side);
        std::array<bool,3> equipped{};const CArtifactInstance * origin=nullptr;
        for(int slot=0;slot<19;++slot)if(const auto * artifact=carrier->getArt(ArtifactPosition(slot)))
        {
            const int source=era_compat::InterferencePolicies::get().sourceIdentity(artifact->getType()->getJsonKey());
            if(source){equipped[source-269]=true;if(!origin)origin=artifact;}
        }
        if(!origin)continue;
        const auto targetSide=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
        const auto * target=battle.getBattle()->getSideHero(targetSide);
        const int original=target->getPrimSkillLevel(PrimarySkill::SPELL_POWER);
        const int effective=::era_bridge::interferencePower(original,equipped[0],equipped[1],equipped[2]);
        const int source=era_compat::InterferencePolicies::get().sourceIdentity(origin->getType()->getJsonKey());
        Bonus marker;marker.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;marker.source=BonusSource::ARTIFACT;
        marker.sid=BonusSourceID(origin->getTypeId());marker.duration=BonusDuration::ONE_BATTLE;marker.hidden=true;marker.val=1;
        marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,source,int(targetSide),effective,original});
        GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),marker);handler.sendAndApply(packet);
    }
}
