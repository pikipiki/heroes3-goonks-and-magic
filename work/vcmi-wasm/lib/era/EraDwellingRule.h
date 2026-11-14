/* Original Ghost325 and H+309/310 arithmetic; source-safe undefined-index fallback. */
#pragma once
#include <algorithm>
#include <array>
#include <cstdint>
#include <limits>
namespace era_bridge {
inline constexpr int dwellingDragonFlatDamage(bool slayer,bool resistant,bool actorDragon,bool targetDragon)
{return (slayer&&targetDragon?100:0)-(resistant&&actorDragon?50:0);}
inline constexpr std::array<int,11> dwellingFlatHealth{0,1,2,4,5,7,8,10,11,13,14};
inline int sourceDwellingFlatHealth(int prior,int addition)
{
 const float stored=static_cast<float>(static_cast<double>(static_cast<float>(prior))+addition);
 return stored>=static_cast<float>(std::numeric_limits<int>::max())?std::numeric_limits<int>::max():std::max(1,static_cast<int>(stored));
}
inline int sourceGhostTargetPercent(int sourceTarget)
{
 const auto originalByte=static_cast<unsigned>(sourceTarget)&255u;
 // ZGhost.TXT default100. Original table has197 entries; out-of-range bytes
 // are undefined adjacent-memory reads. Use documented source default100 there.
 return (originalByte>=145&&originalByte<=149)||(originalByte>=159&&originalByte<=163)?0:100;
}
inline int64_t sourceGhost325Healing(int32_t rawDamage,int64_t targetPreHitHP,int sourceTarget,
 int64_t killed,int64_t actorHP,int64_t actorCount,int32_t actorMaxHP)
{
 if(rawDamage<=0||targetPreHitHP<=0||killed<0||actorCount<=0||actorMaxHP<=0)return 0;
 const auto product=static_cast<int32_t>(static_cast<uint32_t>(rawDamage)*static_cast<uint32_t>(sourceGhostTargetPercent(sourceTarget)));
 // Shipped Amethyst1001B9B6..C9 uses CVTSI2SS/MULSS/CVTTSS2SI:
 // signed32 input, REAL4 intermediate, truncation, then original IDIV100.
 const float scaled=static_cast<float>(product)*0.005f;
 const int64_t requested=static_cast<int32_t>(scaled)/100;
 if(requested<=0)return 0;
 const auto capacity=std::max<int64_t>(0,(actorCount+killed)*actorMaxHP-actorHP);
 return std::min({requested,targetPreHitHP,capacity});
}
}
