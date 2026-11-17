/* Enhanced Henchmen 1.2 arithmetic, ported from Archer30's ERM source.
 * GPL-2.0-or-later. Source contracts: scripts/era-bridge/gameplay/henchmen.json.
 * This is a dormant rule library, not an admission of the gameplay system.
 */
#pragma once

#include <algorithm>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <vector>

namespace era_bridge::henchmen
{
// ERM VR operations store a Win32 integer after EACH operator.
inline std::int32_t word(std::int64_t value)
{
    const auto bits=static_cast<std::uint32_t>(static_cast<std::uint64_t>(value));
    return bits<=0x7fffffffU?static_cast<std::int32_t>(bits)
        :static_cast<std::int32_t>(static_cast<std::int64_t>(bits)-0x100000000LL);
}
inline std::int32_t add(std::int32_t a,std::int32_t b){return word(std::int64_t(a)+b);}
inline std::int32_t sub(std::int32_t a,std::int32_t b){return word(std::int64_t(a)-b);}
inline std::int32_t mul(std::int32_t a,std::int32_t b){return word(std::int64_t(a)*b);}
inline std::int32_t divide(std::int32_t a,std::int32_t b)
{
    if(b==0)throw std::invalid_argument("Henchmen: division by zero");
    return word(std::int64_t(a)/b);
}

struct Settings
{
    std::int32_t battleStatic=6,battleRandom=4,battleHeroCoefficient=5,battlePerHeroLevel=0;
    std::int32_t battleMinimum=0,battleMaximum=1000;
    std::int32_t heroLevelBonus=10,dailyBonus=1,replacementLossPercent=0,aiPercent=100;
    std::int32_t spellDamagePerPower=10,knowledgePerExtraSpell=30;
    bool stackExperience=true,banner=true,freeBanner=false,returnToArmy=true;
    bool alternativeLevelRate=true,campaignTransfer=true,moreSantaGuards=true,reviveAnywhere=false;

    void normalize()
    {
        battleStatic=std::max(0,battleStatic);battleRandom=std::max(0,battleRandom);
        battleHeroCoefficient=std::max(0,battleHeroCoefficient);
        battlePerHeroLevel=std::max(0,battlePerHeroLevel);
        battleMinimum=std::max(0,battleMinimum);
        battleMaximum=std::max(battleMinimum,battleMaximum);
        heroLevelBonus=std::max(0,heroLevelBonus);dailyBonus=std::max(0,dailyBonus);
        replacementLossPercent=std::clamp(replacementLossPercent,0,100);
        aiPercent=std::clamp(aiPercent,0,1000);
        spellDamagePerPower=std::clamp(spellDamagePerPower,0,100);
        knowledgePerExtraSpell=std::clamp(knowledgePerExtraSpell,0,100);
        banner=banner&&stackExperience;freeBanner=freeBanner&&banner;
    }
};

struct Progress
{
    std::int32_t level=1,experience=0,bonusExperience=0,nextLevel=0;
};

// The alternative rate's ERA Pow/float conversion has not been admitted.
// Callers must supply a rate obtained from an independently validated adapter.
inline std::int32_t classicLevelRate(std::int32_t fightValue,std::int32_t aiValue)
{
    const auto value=fightValue<13?(aiValue>=13?aiValue:650):fightValue;
    return std::max(3,divide(mul(value,8),100));
}

inline Progress progress(std::int32_t storedExperience,std::int32_t heroLevel,
    std::int32_t day,std::int32_t levelRate,const Settings & settings)
{
    if(levelRate<3||heroLevel<1||day<1)throw std::invalid_argument("Henchmen: invalid progress context");
    Progress result;
    result.bonusExperience=add(mul(sub(heroLevel,1),settings.heroLevelBonus),mul(sub(day,1),settings.dailyBonus));
    result.experience=add(storedExperience,result.bonusExperience);
    result.level=add(divide(result.experience,levelRate),1);
    result.nextLevel=sub(levelRate,result.experience%levelRate);
    return result;
}

struct Stats
{
    std::int32_t attack=0,defence=0,minimumDamage=0,maximumDamage=0,health=0,speed=0;
};

inline Stats additionalStats(const Stats & base,std::int32_t experience,std::int32_t levelRate)
{
    if(levelRate<3)throw std::invalid_argument("Henchmen: invalid level rate");
    const auto adFactor=add(divide(experience,25),100),adFlat=divide(experience,250);
    const auto damageHealthFactor=add(divide(mul(experience,100),levelRate),100);
    const auto speedFactor=add(divide(experience,50),100),speedFlat=divide(experience,1000);
    return {
        sub(divide(mul(add(base.attack,adFlat),adFactor),100),base.attack),
        sub(divide(mul(add(base.defence,adFlat),adFactor),100),base.defence),
        sub(divide(mul(add(base.minimumDamage,1),damageHealthFactor),100),base.minimumDamage),
        sub(divide(mul(add(base.maximumDamage,2),damageHealthFactor),100),base.maximumDamage),
        sub(add(divide(mul(base.health,damageHealthFactor),100),50),base.health),
        sub(divide(mul(add(base.speed,speedFlat),speedFactor),100),base.speed)
    };
}

inline std::int32_t resurrectionCost(std::int32_t creatureGoldCost,std::int32_t level)
{return divide(mul(creatureGoldCost,level),5);}

inline std::int32_t experienceAfterReplacement(std::int32_t experience,const Settings & settings)
{return sub(experience,divide(mul(experience,settings.replacementLossPercent),100));}

// sqrtHeroExperience is an ERA-compatible, already-converted integer.
// The source reads i^battleExpAIPct^, NOT i^hench_battleExpAIPct^.
// Keep that runtime input explicit until the upstream global is resolved.
inline std::int32_t battleExperience(std::int32_t randomDraw,std::int32_t sqrtHeroExperience,
    std::int32_t heroLevel,bool ai,std::int32_t runtimeAiPercent,const Settings & settings)
{
    if(randomDraw<0||randomDraw>settings.battleRandom)
        throw std::invalid_argument("Henchmen: random draw outside source interval");
    auto result=add(add(settings.battleStatic,randomDraw),
        divide(mul(sqrtHeroExperience,settings.battleHeroCoefficient),100));
    result=add(result,mul(heroLevel,settings.battlePerHeroLevel));
    result=std::clamp(result,settings.battleMinimum,settings.battleMaximum);
    if(ai)result=std::max(0,divide(mul(result,runtimeAiPercent),100));
    return result;
}

struct StackExperienceTable
{
    std::int32_t rank10=0,aboveRank10=0,battleCapPercent=0,multiplier=0;
};
inline std::int32_t limitStackExperience(std::int32_t experience,const StackExperienceTable & table)
{
    const auto top=add(table.rank10,table.aboveRank10);
    return experience<0||experience>top?top:experience;
}
inline std::int32_t stackExperienceGain(std::int32_t previous,std::int32_t heroExperience,
    bool experienceBanner,const StackExperienceTable & table)
{
    auto cap=divide(mul(table.rank10,table.battleCapPercent),100);
    auto gain=divide(mul(heroExperience,table.multiplier),1000);
    if(experienceBanner){cap=divide(mul(cap,3),2);gain=divide(mul(gain,3),2);}
    gain=std::min(gain,cap);
    return limitStackExperience(add(previous,gain),table);
}
inline std::int32_t battlefieldStackExperience(std::int32_t stored,bool ai,
    std::int32_t difficulty,const StackExperienceTable & table)
{return limitStackExperience(ai?mul(stored,add(difficulty,1)):stored,table);}

struct Candidate
{
    std::int32_t creature=-1,count=0,shots=0,fightValue=0;
    bool emissary=false,valid=true;
};
inline bool eligible(const std::vector<Candidate> & army,bool allowEmptyArmy,bool returnAliveHenchman)
{
    std::int32_t total=0;bool emissary=false;
    for(const auto & stack:army)
    {
        if(stack.creature<0||stack.count<=0)continue;
        if(stack.emissary)emissary=true;else total=add(total,stack.count);
    }
    return (emissary||allowEmptyArmy)?total>0:total>1||(total==1&&returnAliveHenchman);
}
inline int aiCandidate(const std::vector<Candidate> & candidates)
{
    int choice=-1;std::int32_t shots=0,fight=0;
    for(std::size_t i=0;i<candidates.size();++i)
    {
        const auto & candidate=candidates[i];
        if(!candidate.valid)continue;
        if(candidate.shots>shots||(candidate.shots==shots&&candidate.fightValue>fight))
        {choice=static_cast<int>(i);shots=candidate.shots;fight=candidate.fightValue;}
    }
    return choice;
}

inline std::int32_t spellDamageBonus(std::int32_t power,const Settings & settings)
{return mul(sub(power,1),settings.spellDamagePerPower);}
inline std::int32_t extraSpellCasts(std::int32_t knowledge,std::int32_t originalCasts,const Settings & settings)
{
    if(originalCasts<=0||settings.knowledgePerExtraSpell<=0)return 0;
    return divide(sub(knowledge,1),settings.knowledgePerExtraSpell);
}
inline int proposedPosition(bool attacker,bool creatureBank,bool siege,bool wide)
{return attacker?(creatureBank?25:20):(siege&&wide?31:30);}
}
