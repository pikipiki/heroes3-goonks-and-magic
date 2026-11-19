#include "../../work/vcmi-wasm/lib/era/EraMapDoubleArtifactRules.h"
#include <cassert>

using namespace era_bridge::map_rules;
int main()
{
    assert(doubleArtifact(true,true,true,15,1));
    assert(doubleArtifact(true,true,true,7,1));
    assert(!doubleArtifact(true,true,true,0,1));
    assert(!doubleArtifact(true,true,true,15,2));
    assert(!doubleArtifact(true,true,true,15,3));
    assert(!doubleArtifact(false,true,true,15,1));
    assert(!doubleArtifact(true,false,true,15,1));
    assert(!doubleArtifact(true,true,false,15,1));
    assert(clearArtifactMarker(true,true,true,15));
    assert(!clearArtifactMarker(true,true,true,7));
    assert(!clearArtifactMarker(false,true,true,15));
    assert(!clearArtifactMarker(true,true,false,15));
}
