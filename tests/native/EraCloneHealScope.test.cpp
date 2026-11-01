#include "../../work/vcmi-wasm/lib/era/EraCloneHealScope.h"
#include <cassert>
#include <stdexcept>
int main()
{
    bool clone = true;
    { era_bridge::CloneHealScope guard(clone); assert(!clone); }
    assert(clone);
    try { era_bridge::CloneHealScope guard(clone); assert(!clone); throw std::runtime_error("heal failure"); }
    catch(const std::runtime_error &) {}
    assert(clone);
    bool ordinary = false;
    { era_bridge::CloneHealScope guard(ordinary); assert(!ordinary); }
    assert(!ordinary);
}
