#include "../../work/vcmi-wasm/lib/era/EraBridgeArtifactRuntime.h"
#include "../../work/vcmi-wasm/lib/era/EraExchangeCloak.h"
#include "../../work/vcmi-wasm/lib/era/EraArtifactMassSpells.h"
#include "../../work/vcmi-wasm/lib/era/EraGooseReflection.h"
#include <cassert>
int main()
{
    using namespace era_bridge;
    std::array<int,7> army{{2,2,10,-1,3,198,99}};
    EquippedDailyConversions worn{};
    worn[3] = {{2,198},{3,198},{10,318}};
    auto plan = planDailyConversions(army,worn);
    assert(plan.size()==4);
    // Pair then army-slot order, not army-slot then pair.
    assert(plan[0].armySlot==0 && plan[1].armySlot==1);
    assert(plan[2].armySlot==4 && plan[3].armySlot==2);
    // Already-target stack remains unchanged, no merging and no count changes.
    assert(plan[0].from==2 && plan[0].to==198);
    worn[3] = {{2,3},{3,4}};
    worn[18] = {{4,5}};
    plan = planDailyConversions({{2,-1,-1,-1,-1,-1,-1}},worn);
    assert(plan.size()==3 && plan[0].to==3 && plan[1].to==4 && plan[2].to==5);
    // A preceding equipment slot is never revisited after later conversion.
    worn = {}; worn[0]={{3,4}}; worn[18]={{2,3}};
    plan = planDailyConversions({{2,-1,-1,-1,-1,-1,-1}},worn);
    assert(plan.size()==1 && plan[0].to==3);
    // No equipped artifact, no implicit backpack scanning.
    worn = {}; assert(planDailyConversions(army,worn).empty());
    // All seven slots and repeated artifact instances each execute once in order.
    worn[0]={{2,3}};worn[18]={{3,2}};
    plan=planDailyConversions({{2,2,2,2,2,2,2}},worn);assert(plan.size()==14);
    for(std::size_t i=0;i<7;++i){assert(plan[i].armySlot==i);assert(plan[i+7].armySlot==i);}
    // Source permits identity pairs; they must not send redundant packets.
    worn={};worn[3]={{2,2}};assert(planDailyConversions(army,worn).empty());
    // Source defaults, small negative fractions and exact truncation boundaries.
    assert(artifactSummonCount(0,0)==1);
    assert(artifactSummonCount(0,9)==9);
    assert(artifactSummonCount(7,99)==7);
    assert(artifactSummonCount(-500,1)==1);
    assert(artifactSummonCount(-500,6)==3);
    assert(artifactSummonCount(-2300,9)==20);
    assert(artifactSummonCount(-1300,255)==331);
    bool overflow=false;
    try{artifactSummonCount(std::numeric_limits<int>::min(),std::numeric_limits<int>::max());}
    catch(const std::overflow_error &){overflow=true;}
    assert(overflow);
    const ExchangeHeroStats attacker{10,5,37},defender{3,9,200};
    const auto exchange=exchangeCloakChanges(true,true,true,false,attacker,defender);
    assert(exchange && (*exchange)[0].attackDelta==-7 && (*exchange)[0].defenseDelta==4);
    assert((*exchange)[1].attackDelta==7 && (*exchange)[1].defenseDelta==-4);
    assert((*exchange)[0].mana==200 && (*exchange)[1].mana==37);
    assert(!exchangeCloakChanges(false,true,true,false,attacker,defender));
    assert(!exchangeCloakChanges(true,false,true,false,attacker,defender));
    assert(!exchangeCloakChanges(true,true,false,false,attacker,defender));
    assert(!exchangeCloakChanges(true,true,true,true,attacker,defender));
    const auto defenderCloak=exchangeCloakChanges(true,true,false,true,attacker,defender);
    assert(defenderCloak && (*defenderCloak)[0].mana==200);
    for(int id=145;id<=149;++id)assert(!exchangeCloakAffectsCreature(id));
    assert(exchangeCloakAffectsCreature(144) && exchangeCloakAffectsCreature(150));
    assert(artifactMassSpellPower(0)==1 && artifactMassSpellPower(1)==1);
    assert(artifactMassSpellPower(9)==2 && artifactMassSpellPower(10)==3);
    assert(artifactMassSpellPower(850)==255 && artifactMassSpellPower(1000)==255);
    assert(artifactMassSpellTarget(true,true,false,true,false,20));
    assert(artifactMassSpellTarget(false,false,false,true,false,0));
    assert(!artifactMassSpellTarget(true,false,false,true,false,0));
    assert(!artifactMassSpellTarget(true,true,true,true,false,0));
    assert(!artifactMassSpellTarget(true,true,false,false,false,0));
    assert(!artifactMassSpellTarget(true,true,false,true,true,0));
    assert(!artifactMassSpellTarget(true,true,false,true,false,21));
    assert(goldenGooseRawIncome(0,0,false)==0);
    assert(goldenGooseRawIncome(3,1,false)==7000);
    assert(goldenGooseRawIncome(3,1,true)==21000);
    bool invalidCopies=false;
    try{goldenGooseRawIncome(0,1,false);}catch(const std::invalid_argument &){invalidCopies=true;}
    assert(invalidCopies);
    assert(reflectionResistanceAfterAura(52,true)==72);
    assert(reflectionResistanceAfterAura(95,true)==100);
    assert(reflectionResistanceAfterAura(52,false)==52);
}
