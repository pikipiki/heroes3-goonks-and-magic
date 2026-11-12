/* Shipped Amethyst100151D0 hook5A0145; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
namespace era_bridge
{
struct SourceCreatureSpellPower
{
    std::uint32_t multiplier=1,divider=1,adder=0;
    static constexpr SourceCreatureSpellPower forSource(int id)
    {
        switch(id)
        {
            case 134:return {5,1,0};
            case 218:case 235:case 246:case 247:case 249:case 250:
            case 262:case 264:case 288:return {0,1,6};
            case 242:case 340:case 343:return {1,1,1};
            case 258:return {10,1,1};
            case 346:return {5,1,60};
            case 347:return {10,1,90};
            case 352:return {0,1,0};
            default:return {};
        }
    }
    static constexpr bool overrides(int casterKind,int spell)
    {
        // Kinds>2 normalize to CREATURE then return immediately in100151E9;
        // kind2 artifacts do not enter10015353. No TUM CFG sets OverrideSpecialSpells.
        return (casterKind==1 || casterKind==-1) && spell!=62 && (spell<70 || spell>80);
    }
    constexpr int apply(std::uint32_t currentPower) const
    {
        const std::uint32_t value=(currentPower*multiplier)/divider+adder;
        return value<0x80000000u?static_cast<int>(value):static_cast<int>(std::int64_t(value)-0x100000000LL);
    }
    static constexpr int commander(int rawMagic,bool soulEater)
    {
        return soulEater?rawMagic:(rawMagic>0?(rawMagic/4+(rawMagic%4!=0)):1);
    }
};
}
