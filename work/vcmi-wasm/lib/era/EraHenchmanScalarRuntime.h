#pragma once
#include "EraHenchmanBattleBanner.h"
#include "EraHenchmanBannerSourceRows.h"
#include "EraSourceCreatureLevels.h"

namespace era_compat::henchmen
{
inline void applySourceScalarExperience(CStack & actor)
{
    if(actor.unitSlot()!=SlotID::HENCHMAN_SLOT_PLACEHOLDER)return;
    const auto * hero=actor.getMyHero();
    if(!hero||!hero->cb||!enabled(*hero->cb)||!settings(*hero->cb).stackExperience
        ||!hero->cb->getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE))return;
    const BonusSourceID marker{BonusCustomSource(0x484e4358)};
    if(actor.hasBonus(Selector::source(BonusSource::OTHER,marker)))return;
    const auto sourceId=era_bridge::sourceCreatureIdForLevel(actor.creatureId().toCreature()->getJsonKey());
    if(!sourceId)return;
    // Native XP bonuses are compiled for ordinary army stacks. Cancel only
    // their numeric scalar effects, then replay the original resolved EA rows
    // over the already-installed henchman stats (BU:S clears the source cache).
    const auto inherited=actor.getAllBonuses(Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE));
    for(const auto & bonus:*inherited)
    {
        const bool primary=bonus->type==BonusType::PRIMARY_SKILL
            &&(bonus->subtype==BonusSubtypeID(PrimarySkill::ATTACK)
                ||bonus->subtype==BonusSubtypeID(PrimarySkill::DEFENSE));
        if(!primary&&bonus->type!=BonusType::STACK_HEALTH
            &&bonus->type!=BonusType::ERA_EXPERIENCE_HEALTH_PERCENT
            &&bonus->type!=BonusType::CREATURE_DAMAGE&&bonus->type!=BonusType::STACKS_SPEED)continue;
        auto cancel=std::make_shared<Bonus>(*bonus);
        cancel->val=-bonus->val;cancel->source=BonusSource::CREATURE_ABILITY;
        cancel->duration=BonusDuration::ONE_BATTLE;cancel->stacking.clear();
        cancel->limiter.reset();cancel->updater.reset();cancel->propagator.reset();
        cancel->propagationUpdater.reset();actor.addNewBonus(cancel);
    }
    const era_bridge::henchmen::Stats original{actor.getAttack(false),actor.getDefense(false),
        actor.getMinDamage(false),actor.getMaxDamage(false),static_cast<int32_t>(actor.getMaxHealth()),
        actor.getInitiative()};
    const auto rank=actor.base?std::clamp(actor.base->getExpRank(),0,10):0;
    const auto style=battleBanner(actor);
    int defenceReduction=style==era_bridge::henchmen::BannerStyle::DEFENCE_REDUCTION?25:0;
    for(const auto & row:era_bridge::henchmen::sourceBannerRows)
        if(row.sourceId==*sourceId&&row.code=='b')
        {
            defenceReduction+=std::max(0,static_cast<int>(era_bridge::henchmen::applyExperienceModifier(
                0.0f,static_cast<char>(row.modifier),row.values[rank])));
            break; // ReduceDefence returns from the first active b row.
        }
    defenceReduction=std::min(100,defenceReduction);
    const auto nativeReduction=actor.valOfBonuses(BonusType::ERA_EXPERIENCE_DEFENSE_REDUCTION);
    if(defenceReduction!=nativeReduction)
        actor.addNewBonus(std::make_shared<Bonus>(BonusDuration::ONE_BATTLE,
            BonusType::ERA_EXPERIENCE_DEFENSE_REDUCTION,BonusSource::CREATURE_ABILITY,
            defenceReduction-nativeReduction,BonusSourceID()));
    for(const auto & row:era_bridge::henchmen::sourceBannerRows)
    {
        if(row.sourceId!=*sourceId)continue;
        BonusType type;BonusSubtypeID subtype;int before;
        switch(row.code)
        {
            case 'A':type=BonusType::PRIMARY_SKILL;subtype=BonusSubtypeID(PrimarySkill::ATTACK);before=original.attack;break;
            case 'D':type=BonusType::PRIMARY_SKILL;subtype=BonusSubtypeID(PrimarySkill::DEFENSE);before=original.defence;break;
            case 'm':type=BonusType::CREATURE_DAMAGE;subtype=BonusSubtypeID(BonusCustomSubtype::creatureDamageMin);before=original.minimumDamage;break;
            case 'M':type=BonusType::CREATURE_DAMAGE;subtype=BonusSubtypeID(BonusCustomSubtype::creatureDamageMax);before=original.maximumDamage;break;
            case 'H':type=BonusType::STACK_HEALTH;before=original.health;break;
            case 'S':type=BonusType::STACKS_SPEED;before=original.speed;break;
            default:continue;
        }
        const auto after=era_bridge::henchmen::experienceScalarRow(before,row.code,
            static_cast<char>(row.modifier),row.values[rank],style);
        if(after!=before)actor.addNewBonus(std::make_shared<Bonus>(BonusDuration::ONE_BATTLE,
            type,BonusSource::CREATURE_ABILITY,after-before,BonusSourceID(),subtype));
    }
    // Serialized with the battlefield's bonus node. Reload reattaches bonus
    // ancestors but must retain, rather than replay, the cached EA transform.
    auto applied=std::make_shared<Bonus>(BonusDuration::ONE_BATTLE,BonusType::NONE,
        BonusSource::OTHER,0,marker);
    applied->hidden=true;actor.addNewBonus(applied);
}
}
