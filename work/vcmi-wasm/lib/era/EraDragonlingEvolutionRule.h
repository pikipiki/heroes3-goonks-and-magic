/* Original TUM ERM879–916 daily hero-stack evolution. GPL-2.0-or-later. */
#pragma once
namespace era_bridge
{
struct DragonlingEvolutionRule
{
    static constexpr int target(int source,int rank,bool rebornEnabled=false)
    {
        if(rebornEnabled || rank<10)return -1;
        switch(source)
        {
            case 341:return 26;
            case 342:return 82;
            case 343:return 134;
            case 344:return 135;
            case 345:return 132;
            default:return -1;
        }
    }
};
}
