#include "../../work/vcmi-wasm/lib/era/EraHenchmanRules.h"
#include <cassert>
#include <climits>
#include <iostream>

using namespace era_bridge::henchmen;

int main()
{
    Settings settings;
    assert(settings.stackExperience&&settings.banner&&!settings.freeBanner);
    assert(settings.returnToArmy&&settings.alternativeLevelRate&&settings.campaignTransfer);
    assert(settings.moreSantaGuards&&!settings.reviveAnywhere);
    assert(settings.battleStatic==6&&settings.battleRandom==4&&settings.battleHeroCoefficient==5);
    assert(settings.replacementLossPercent==0&&settings.aiPercent==100);

    Settings clamped;
    clamped.stackExperience=false;clamped.freeBanner=true;
    clamped.battleMinimum=400;clamped.battleMaximum=-2;
    clamped.aiPercent=2000;clamped.replacementLossPercent=-9;
    clamped.spellDamagePerPower=102;clamped.knowledgePerExtraSpell=-1;
    clamped.normalize();
    assert(!clamped.banner&&!clamped.freeBanner);
    assert(clamped.battleMaximum==400&&clamped.aiPercent==1000);
    assert(clamped.replacementLossPercent==0&&clamped.spellDamagePerPower==100&&clamped.knowledgePerExtraSpell==0);

    // Low fight-value creatures use the AI value or the source fallback650.
    assert(classicLevelRate(12,100)==8);
    assert(classicLevelRate(12,12)==52);
    assert(classicLevelRate(13,999)==3);
    assert(classicLevelRate(500,1)==40);
    assert(alternativeLevelRate(12,12)==140);
    assert(alternativeLevelRate(12,100)==40);
    assert(alternativeLevelRate(13,999)==10);
    assert(alternativeLevelRate(500,1)==120);
    assert(alternativeLevelRate(1000,1)==180);
    assert(levelRate(500,1,settings)==120);
    settings.alternativeLevelRate=false;
    assert(levelRate(500,1,settings)==40);
    settings.alternativeLevelRate=true;
    assert(heroExperienceRoot(0)==0&&heroExperienceRoot(9999)==99&&heroExperienceRoot(10000)==100);
    assert(heroExperienceRoot(INT_MAX)==46340);
    // Prove Single input rounding, rather than replacing it with integer sqrt:
    assert(heroExperienceRoot(16777215)==4095);
    assert(heroExperienceRoot(16777216)==4096);
    assert(heroExperienceRoot(16785408)==4097); //not the mathematical integer square root4096
    const auto start=progress(0,1,1,100,settings);
    assert(start.experience==0&&start.level==1&&start.nextLevel==100);
    const auto later=progress(80,3,5,100,settings);
    assert(later.bonusExperience==24&&later.experience==104&&later.level==2&&later.nextLevel==96);
    assert(progress(100,1,1,100,settings).nextLevel==100);

    // Source gives extra damage and50 HP even before any experience is earned.
    const Stats base{1,1,1,1,1,3};
    const auto zero=additionalStats(base,0,100);
    assert(zero.attack==0&&zero.defence==0&&zero.minimumDamage==1&&zero.maximumDamage==2&&zero.health==50&&zero.speed==0);
    const auto grown=additionalStats(base,250,100);
    assert(grown.attack==1&&grown.defence==1&&grown.minimumDamage==6&&grown.maximumDamage==9&&grown.health==52&&grown.speed==0);
    assert(resurrectionCost(1250,3)==750);
    assert(experienceAfterReplacement(199,settings)==199);
    settings.replacementLossPercent=25;
    assert(experienceAfterReplacement(199,settings)==150);
    settings.replacementLossPercent=100;
    assert(experienceAfterReplacement(199,settings)==0);

    settings=Settings{};
    assert(battleExperience(0,0,1,false,0,settings)==6);
    assert(battleExperience(4,100,1,false,0,settings)==15);
    assert(battleExperience(4,100,1,true,150,settings)==22);
    // Explicitly passing the source's unresolved global is essential.
    assert(battleExperience(4,100,1,true,0,settings)==0);
    assert(battleExperience(4,100000,1,false,0,settings)==1000);
    bool rejected=false;
    try{battleExperience(5,0,1,false,0,settings);}catch(const std::invalid_argument &){rejected=true;}
    assert(rejected);

    const StackExperienceTable xp{10000,2000,20,1000};
    assert(stackExperienceGain(0,1000,false,xp)==1000);
    assert(stackExperienceGain(0,5000,false,xp)==2000);
    assert(stackExperienceGain(0,5000,true,xp)==3000);
    assert(stackExperienceGain(11000,5000,true,xp)==12000);
    assert(battlefieldStackExperience(3000,true,3,xp)==12000);
    assert(battlefieldStackExperience(3000,false,3,xp)==3000);
    assert(limitStackExperience(-1,xp)==12000);

    assert(!eligible({{1,1}},false,false));
    assert(eligible({{1,2}},false,false));
    assert(eligible({{1,1}},true,false));
    assert(eligible({{1,1}},false,true));
    assert(eligible({{1,1},{132,1,0,0,true}},false,false));
    assert(!eligible({{132,1,0,0,true}},true,true));
    const std::vector<Candidate> candidates{{1,10,0,200},{2,5,8,10},{3,5,8,100},{4,1,20,1000,false,false},{5,1,8,100}};
    assert(aiCandidate(candidates)==2); //shots first, fight value second, first tie wins
    assert(aiCandidate({})==-1);

    assert(spellDamageBonus(1,settings)==0&&spellDamageBonus(7,settings)==60);
    assert(extraSpellCasts(30,1,settings)==0&&extraSpellCasts(31,1,settings)==1);
    assert(extraSpellCasts(61,1,settings)==2&&extraSpellCasts(61,0,settings)==0);
    settings.knowledgePerExtraSpell=0;
    assert(extraSpellCasts(61,1,settings)==0);
    assert(proposedPosition(true,false,false,false)==20);
    assert(proposedPosition(true,true,false,true)==25);
    assert(proposedPosition(false,false,false,true)==30);
    assert(proposedPosition(false,false,true,true)==31);
    assert(proposedPosition(false,false,true,false)==30);

    assert(add(INT_MAX,1)==INT_MIN&&sub(INT_MIN,1)==INT_MAX);
    assert(mul(INT_MAX,2)==-2&&divide(INT_MIN,-1)==INT_MIN);
    assert(divide(-5,2)==-2);
    std::cout<<"henchmen source arithmetic and selection rules passed\n";
}
