#include "../../work/vcmi-wasm/lib/era/EraTileNumberRules.h"
#include <cassert>
#include <climits>

using namespace era_bridge::tile_properties;
int main()
{
    assert(number(0)==0&&number(15)==15&&number(16)==0&&number(31)==15);
    assert(number(-1)==15&&number(-16)==0&&number(INT_MIN)==0&&number(INT_MAX)==15);
    assert((coordinates(7,9,0)==std::array<int,3>{7,9,0}));
    assert((coordinates(7,9,-1)==std::array<int,3>{7,9,1}));
    assert((coordinates(65536,0,0)==std::array<int,3>{0,1,0}));
    assert((coordinates(0,1024,0)==std::array<int,3>{0,0,1}));
    assert((coordinates(0x04000000,0,0)==std::array<int,3>{0,0,1}));
    assert((coordinates(INT_MIN,0,0)==std::array<int,3>{0,0,1}));
    assert((coordinates(0,-1024,1)==std::array<int,3>{0,0,0}));
}
