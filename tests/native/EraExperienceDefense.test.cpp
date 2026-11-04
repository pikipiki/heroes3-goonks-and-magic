#include "../../work/vcmi-wasm/lib/era/EraDefenseReduction.h"
#include <cassert>
#include <cstdint>
#include <limits>
#include <initializer_list>
int main(){using era_bridge::defenseAfterExperienceReduction;
 assert(defenseAfterExperienceReduction(20,40)==12);assert(defenseAfterExperienceReduction(20,30)==14);assert(defenseAfterExperienceReduction(7,40)==4);assert(defenseAfterExperienceReduction(-7,40)==-4);
 for(int d=-3000;d<=3000;d++)for(int p=0;p<=100;p++)assert(defenseAfterExperienceReduction(d,p)==int(static_cast<long double>(d)*(100-p)/100));
 for(int d:{std::numeric_limits<int>::min(),std::numeric_limits<int>::max()})for(int p=0;p<=100;p++)assert(defenseAfterExperienceReduction(d,p)==int(static_cast<long double>(d)*(100-p)/100));
 assert(defenseAfterExperienceReduction(20,101)==0);assert(defenseAfterExperienceReduction(20,-1)==20);
}
