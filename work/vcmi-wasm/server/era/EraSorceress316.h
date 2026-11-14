/* Original316 isSorceress pre-shot selector. GPL-2.0-or-later. */
#pragma once
#include "EraStatusAttacks.h"
#include "EraCSlowRuntime.h"
#include "EraXpTimed184Runtime.h"
#include "../../lib/era/EraWeakness45State.h"
#include "EraSourceXpAccessRuntime.h"
#include "../../lib/era/EraDwellingServices.h"
#include "../../lib/era/EraSorceress316Rule.h"
#include "../../lib/era/EraCDispelSelector.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
namespace era_compat_server
{
inline bool sorceress316Unowned193(const battle::Unit * actor)
{
    if(!actor||!era_compat::DwellingServices::get().enabled(316)
        ||actor->creatureId().toCreature()->getJsonKey()!="wake-of-gods.creatures:wogSorceress")return false;
    const auto origin=BonusSourceID(CreatureID(CreatureID::decode("tum-era:eraCreature316")));
    const auto from316=Selector::source(BonusSource::CREATURE_ABILITY,origin);
    return actor->hasBonus(from316.And(Selector::type()(BonusType::ERA_SOURCE_UNOWNED_STACK)))
        &&actor->hasBonus(from316.And(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON)));
}
inline TConstBonusListPtr sorceress193WithoutLegacyCopies(const TConstBonusListPtr & bonuses,const battle::Unit * actor)
{
    if(!sorceress316Unowned193(actor))return bonuses;
    struct Legacy{int spell,chance,mastery,mode,turns;};
    constexpr std::array<Legacy,15> legacy{{{71,15,0,2,3},{50,15,2,2,3},{80,15,0,2,0},
        {61,15,2,2,3},{54,20,2,1,3},{42,20,2,1,3},{78,20,2,1,0},{62,11,3,2,3},
        {59,11,2,2,3},{75,11,0,2,3},{60,11,3,2,3},{52,25,3,0,3},{47,25,3,0,0},
        {73,25,0,0,3},{45,25,2,0,3}}};
    const auto ownedCopy=[&](const Bonus & b)
    {
        if(b.type!=BonusType::SPELL_AFTER_ATTACK||b.source!=BonusSource::CREATURE_ABILITY
            ||b.sid!=BonusSourceID(actor->creatureId())||b.valType!=BonusValueType::ADDITIVE_VALUE
            ||b.effectRange!=BonusLimitEffect::NO_LIMIT||b.duration!=BonusDuration::PERMANENT
            ||!b.stacking.empty()||b.limiter||b.updater||!b.parameters)return false;
        const auto info=b.parameters->toJsonNode();if(!info.isVector()||info.Vector().size()!=3)return false;
        for(const auto & row:legacy)
            if(b.subtype==BonusSubtypeID(SpellID(row.spell))&&b.val==row.chance&&b.turnsRemain==row.turns
                &&info.Vector()[0].Float()==row.mastery&&info.Vector()[1].Float()==1&&info.Vector()[2].Float()==row.mode)return true;
        return false;
    };
    auto filtered=std::make_shared<BonusList>();
    for(const auto & bonus:*bonuses)if(!ownedCopy(*bonus))filtered->push_back(bonus);
    return filtered;
}
inline bool sorceress316Actor(const CStack * actor)
{return actor&&(era_compat::DwellingServices::get().actor(316,actor->unitType()->getJsonKey())
    ||sorceress316Unowned193(actor));}
inline bool sorceressXpImmunity(const CStack * target,int spellId)
{
    const auto xp=Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE);
    const auto * spell=SpellID(spellId).toSpell();
    if(target->hasBonus(xp.And(Selector::typeSubtype(BonusType::SPELL_IMMUNITY,BonusSubtypeID(SpellID(spellId))))))return true;
    if((spellId==50||spellId==59||spellId==60||spellId==61||spellId==62)
        &&target->hasBonus(xp.And(Selector::type()(BonusType::MIND_IMMUNITY))))return true;
    const int level=spell->getLevel();
    const auto canonical=era_bridge::sourceCreatureIdForLevel(target->unitType()->getJsonKey());
    const int sourceId=canonical?*canonical:StatusAttacks::get().id(target->unitType()->getJsonKey());
    // Five original own w rows start at1 and are emitted as rank0 intrinsic
    // JSON, so STACK_EXPERIENCE alone cannot recover their source cache row.
    // Pinned archive lines1035/1163/1494/1810/1818; no default w starts at1.
    if((sourceId==346||sourceId==347)&&level<=5)return true;
    bool rankZeroSchool=false;
    spell->forEachSchool([&](const SpellSchool & school,bool & stop)
    {if(((sourceId==212||sourceId==236)&&school==SpellSchool::AIR)
        ||(sourceId==288&&school==SpellSchool::WATER))rankZeroSchool=stop=true;});
    if(rankZeroSchool)return true;
    for(const auto type:{BonusType::ERA_NEGATIVE_SPELL_LEVEL_IMMUNITY,BonusType::LEVEL_SPELL_IMMUNITY})
    {const int threshold=target->valOfBonuses(xp.And(Selector::type()(type)));if(threshold>0&&level<=threshold)return true;}
    for(const auto type:{BonusType::NEGATIVE_EFFECTS_IMMUNITY,BonusType::SPELL_SCHOOL_IMMUNITY})
    {
        if(target->hasBonus(xp.And(Selector::typeSubtype(type,BonusSubtypeID(SpellSchool::ANY)))))return true;
        bool blocked=false;spell->forEachSchool([&](const SpellSchool & school,bool & stop)
        {if(target->hasBonus(xp.And(Selector::typeSubtype(type,BonusSubtypeID(school)))))blocked=stop=true;});
        if(blocked)return true;
    }
    return false;
}
inline int selectSorceress316(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    if(!sorceress316Actor(actor))return -1;
    era_bridge::SorceressSnapshot s;s.count=actor->getCount();s.targetPresent=target!=nullptr;
    s.orbInhibition=statusEitherArtifact(battle,126);s.cursedGround=statusCursedGround(battle);
    s.recanter=statusEitherArtifact(battle,83);s.orbVulnerability=statusEitherArtifact(battle,93);
    if(target)
    {
        const auto & key=target->unitType()->getJsonKey();
        const auto canonical=era_bridge::sourceCreatureIdForLevel(key);
        s.targetSourceId=canonical?*canonical:StatusAttacks::get().id(key);
        const auto * hero=battle.battleGetFightingHero(target->unitSide());
        s.heroResistance=statusCHeroResistance(hero);s.artifact134=statusHasArtifact(hero,134);
        const auto intrinsic=Selector::sourceTypeSel(BonusSource::CREATURE_ABILITY);
        s.undead=target->hasBonus(intrinsic.And(Selector::type()(BonusType::UNDEAD)));
        s.noMorale=target->hasBonus(intrinsic.And(Selector::type()(BonusType::NO_MORALE)));
        s.mindImmune=target->hasBonus(intrinsic.And(Selector::type()(BonusType::MIND_IMMUNITY)))||statusHasArtifact(hero,49);
        s.fireImmune=target->hasBonus(intrinsic.And(Selector::typeSubtype(BonusType::SPELL_SCHOOL_IMMUNITY,BonusSubtypeID(SpellSchool::FIRE))));
        s.shooter=target->hasBonusOfType(BonusType::SHOOTER);s.shots=target->shots.available();
        const auto mirror=target->getBonuses(Selector::type()(BonusType::MAGIC_MIRROR)
            .And(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36)))));
        s.mirrorActive=!mirror->empty();s.mirrorThreshold=mirror->totalValue();
        for(const int spellId:era_bridge::sourceCDispelBuffs)
            if(target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spellId)))))s.hasListedBuff=true;
        const auto xp=Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE);
        const int resistance=target->valOfBonuses(xp.And(Selector::type()(BonusType::MAGIC_RESISTANCE)));
        for(const auto & candidate:era_bridge::sorceressPool(s.count))
        {
            const int spellId=candidate.spell;
            s.alreadyActive[spellId]=target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spellId))));
            if(spellId==45){const auto weakness=era_compat::readSourceWeakness45(target);
                if(weakness.owned&&weakness.state.duration!=0)s.alreadyActive[spellId]=true;}
            s.xpResistance[spellId]=resistance;s.xpImmune[spellId]=sorceressXpImmunity(target,spellId);
            if(s.targetSourceId<0)
            {
                // Goonk/custom creatures keep their explicit native immunities.
                StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
                spells::BattleCast query(&battle,&caster,spells::Mode::PASSIVE,SpellID(spellId).toSpell());
                const auto * f=spells::TargetConditionItemFactory::getDefault();spells::TargetCondition condition;
                condition.absolute={f->createAbsoluteSpell(),f->createAbsoluteLevel()};
                condition.normal={f->createElemental(),f->createNormalLevel(),f->createNormalSpell()};
                condition.negation={f->createReceptiveFeature(),f->createImmunityNegation()};
                // Exclude healthValueSpecial from this immunity-only prefilter:
                // Hypnotize HP is tested at queued execution, not pool creation.
                s.foreignRejected[spellId]=!condition.isReceptive(SpellID(spellId).toSpell()->battleMechanics(&query).get(),target);
                s.xpResistance[spellId]+=target->valOfBonuses(intrinsic.And(Selector::type()(BonusType::MAGIC_RESISTANCE)));
            }
        }
        for(const auto pair:{std::pair{105,60},std::pair{101,62},std::pair{100,59},std::pair{107,61},std::pair{102,42},std::pair{92,78}})
            if(statusHasArtifact(hero,pair.first))s.pendantReject[pair.second]=true;
    }
    int rejection=0;const int selected=era_bridge::selectSorceress(s,[&](int lo,int hi){return handler.getRandomGenerator().nextInt(lo,hi);},&rejection);
    if(rejection&&target)emitSourceStatusRejection(handler,battle,target,rejection);
    return selected;
}
inline void applySorceress316Queued(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,SpellID spell,PlayerColor owner)
{
    const int power=era_compat::experienceAttackPower(battle.battleActiveUnit(),spell.num);
    if(supportsXpTimed(spell.num))
    {
        // Shared source duration/C8-CC/magnitude storage is mandatory, including
        // zero power and Berserk255. Dwelling316 participation installs it even
        // without an own p/a/K row. There is no fallback to native timed copies.
        // The per-row XP scope has already ended when queued intrinsic effects
        // flush. Install the same independently admitted lifecycle access here.
        auto access=sourceXpTimedAccess(handler,battle);
        XpTimed184AccessScope scope(access);
        requireXpTimed184Access();
        const auto current=era_compat::confluxActiveSide(battle);
        const auto querySide=battle.playerToSide(owner);
        //5A8673 uses the query-side hero's cached power/mastery and full stack
        // HP, not the eventual CURRENT creature effect-duration power.
        if(spell.num==60&&queryXpTimed(handler,battle,actor,target,60,0,current,querySide)<=0)return;
        castXpTimed(handler,battle,actor,target,spell.num,power,0,current,querySide);
        return;
    }
    applySourceStatus(handler,battle,actor,target,spell,0,owner,power);
}
}
