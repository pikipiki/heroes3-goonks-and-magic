#include "../../work/vcmi-wasm/lib/era/EraDefenseReduction.h"
#include <cassert>
#include <cmath>
#include <climits>
#include <initializer_list>
int main(){using era_bridge::defenseAfterReduction95;assert(defenseAfterReduction95(20)==1);assert(defenseAfterReduction95(40)==2);assert(defenseAfterReduction95(35)==1);assert(defenseAfterReduction95(0)==0);for(int defense=-100000;defense<=100000;++defense){const float ratio=static_cast<float>(95.0L/100.0L);const long double original=static_cast<float>(defense);const int oracle=static_cast<int>(original-original*static_cast<long double>(ratio));assert(defenseAfterReduction95(defense)==oracle);}for(int defense:{INT_MIN,INT_MAX,16777215,16777217,123456789}){const long double d=static_cast<float>(defense);assert(defenseAfterReduction95(defense)==static_cast<int>(d-d*static_cast<long double>(static_cast<float>(95.0L/100.0L))));}}
