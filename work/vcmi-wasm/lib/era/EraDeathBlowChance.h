/* Source4436CF/50C7C0/61842C. GPL-2.0-or-later. */
#pragma once
#include <stdexcept>
namespace era_bridge
{
inline bool sourceDeathBlowFromCrtOutput(int chance, int output)
{
    if(chance < 0 || chance > 100 || output < 0 || output > 32767)
        throw std::invalid_argument("Source DeathBlow requires chance0..100 and CRT output0..32767");
    return output % 100 + 1 <= chance;
}
template<class Draw>
bool rollSourceDeathBlow(int chance, Draw && draw)
{
    if(chance < 0 || chance > 100)
        throw std::invalid_argument("Source DeathBlow chance outside audited domain");
    // A zero chance does not select the source DreadKnight ability branch.
    // A100 chance still consumes the source RNG call; do not optimize it away.
    return chance != 0 && sourceDeathBlowFromCrtOutput(chance,draw());
}
}
