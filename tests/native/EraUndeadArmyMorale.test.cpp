#include "../../work/vcmi-wasm/lib/era/EraUndeadArmyMorale.h"
#include <cassert>
int main()
{
    using namespace era_bridge;
    assert(undeadMoraleRole({})==5);assert(undeadMoralePower(5)==0);
    assert(undeadMoraleRole({{100,3},{1,2},{1,0},{1,1}})==0);
    assert(undeadMoralePower(undeadMoraleRole({{100,3},{1,2}}))==1);
    assert(undeadMoralePower(undeadMoraleRole({{1,1},{1,4}}))==2);
    assert(undeadMoralePower(undeadMoraleRole({{1,4}}))==1);
    assert(undeadMoraleRole({{0,0},{-1,1},{100,-1}})==5);
    assert(undeadMoralePower(undeadMoraleRole({{1,2},{1,2},{1,2}}))==1);
    // Caller supplies original maparmy slots: battle deaths/summons/clones do not
    // enter this snapshot and therefore cannot change the selected family.
}
