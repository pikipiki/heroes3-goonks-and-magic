/* Amethyst339 source constants; optional native primitive, not actor closure. */
#pragma once
#include <array>
namespace era_bridge
{
struct SulfideDragonRule
{
    static constexpr int acidProcUpper=19; //756D0F patches4411CE100->19; 1..20 succeeds.
    static constexpr bool toxicSpell(int spell){return spell==71||spell==73||spell==74||spell==80;}
    static constexpr bool paralysis(int roll){return roll>=0&&roll<3;} //3 > Randint(0,100).
    static constexpr std::array<int,11> regeneration={0,0,0,0,25,50,75,125,250,250,250};
    static constexpr int regenerationChance=50;
};
}
