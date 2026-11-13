/* Source ChainShot4 nearest-target adapter. GPL-2.0-or-later. */
#pragma once
#include "EraStatusAttacks.h"
#include "../../lib/era/EraAdvancedArtifactRuntimeNative.h"
#include "../../lib/era/EraDungeonChainPlan.h"
#include "../../lib/era/EraDungeonSpriteGeometry.h"
#include "../../lib/filesystem/CInputStream.h"
namespace era_compat_server
{
inline int dungeonSourceSpriteTop(const CStack * target)
{
    auto path=target->creatureId().toCreature()->animDefName;
    if(path.getName().find("SPRITES/")!=0)path=path.addPrefix("SPRITES/");
    static std::map<AnimationPath,int> cache;
    const auto found=cache.find(path);if(found!=cache.end())return found->second;
    // All original and shipped Goonk creature animations are binary DEFs.
    // A foreign JSON-only animation has no original DEF crop geometry; its
    // explicitly documented neutral crop0 extends the additional-mod domain.
    int top=0;
    if(CResourceHandler::get()->existsResource(path))
    {
        const auto bytes=CResourceHandler::get()->load(path)->readAll();
        if(const auto parsed=::era_bridge::dungeonFirstDefTop(bytes.first.get(),size_t(bytes.second)))top=*parsed;
    }
    cache.emplace(path,top);return top;
}
inline ::era_bridge::DungeonChainCandidate dungeonSourceCandidate(const CStack * target)
{
    const auto hex=target->getPosition();
    const bool rightTail=target->occupiedHex().isValid()&&target->occupiedHex().getX()>hex.getX();
    return {target->unitId(),target->unitSide()==BattleSide::DEFENDER?1:0,
        ::era_bridge::dungeonSpriteCentreX(hex.getX(),hex.getY(),target->doubleWide(),rightTail),
        ::era_bridge::dungeonSpriteCentreY(hex.getY(),dungeonSourceSpriteTop(target))};
}
inline std::vector<::era_bridge::DungeonChainCandidate> dungeonSourceCandidates(const CBattleInfoCallback & battle)
{
    auto stacks=battle.battleGetAllStacks(false);
    std::stable_sort(stacks.begin(),stacks.end(),[](const CStack * a,const CStack * b)
    {return std::make_pair(static_cast<int>(a->unitSide()),a->sourceMassSlot())<std::make_pair(static_cast<int>(b->unitSide()),b->sourceMassSlot());});
    std::vector<::era_bridge::DungeonChainCandidate> result;
    for(const auto * target:stacks)
        if(target->getPosition().isValid())result.push_back(dungeonSourceCandidate(target));
    return result;
}
inline bool dungeonSourceAccuracy(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    const auto * spell=SpellID(19).toSpell();
    int accuracy=0;
    if(era_compat::sourceSpellContextAllows(battle,target,spell))
    {
        StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
        //5A6500/5A6582 queries side1 for a side0 candidate, and side0 for
        //side1. This hero query is independent of CURRENT132C0 (Catalyst
        //and ERM Lightning Rod), which remains the original action side.
        era_compat::ConfluxResistanceScope query(true,target->unitSide()==BattleSide::ATTACKER
            ?BattleSide::DEFENDER:BattleSide::ATTACKER);
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
        cast.setSpellLevel(0);cast.setEffectPower(0);cast.setEffectDuration(0);
        // Standard spell19 receptivity only, without ownership, ALIVE or
        // negative creatureNature conditions from Poison/Age selectors.
        const auto * factory=spells::TargetConditionItemFactory::getDefault();
        spells::TargetCondition condition;
        condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
        condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
        condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
        // Original ERM MR_Quit replaces natural44A1A0 immunity as well as
        // resistance, but cannot bypass earlier5A83A0 context gates.
        const auto side=era_compat::confluxActiveSide(battle);
        if(const auto forced=era_compat::sourceLightningResistance(battle,19,side,*target))accuracy=100-*forced;
        else if(condition.isReceptive(spell->battleMechanics(&cast).get(),target))accuracy=statusRawAccuracy(battle,target);
    }
    //5A6582..65A5 always draws even with accuracy0/100.
    return ::era_bridge::statusRollAccepts(accuracy,handler.getRandomGenerator().nextInt(1,100));
}
}
