#pragma once
#include <array>
#include <stdexcept>
namespace era_bridge {
//5A7F90: accumulate hits before applying them. The eligibility count excludes
// fully allocated health, but ordinal selection scans original positive health.
// Retain that asymmetry, including possible overshoot of one selected part.
template<class Roll>
std::array<int,8> sourceXpEarthquakeHits(const std::array<int,8>&health,int shots,Roll&&roll){
 if(shots<0||shots>32)throw std::invalid_argument("Source earthquake shot domain");
 std::array<int,8> hits{};
 for(int n=0;n<shots;++n){int available=0;for(int i=0;i<8;++i)available+=health[i]>hits[i];if(!available)break;
  int ordinal=roll(1,available);if(ordinal<1||ordinal>available)throw std::runtime_error("Source earthquake RNG domain");
  for(int i=0;i<8;++i)if(health[i]>0&&!--ordinal){++hits[i];break;}
 }return hits;
}
}
