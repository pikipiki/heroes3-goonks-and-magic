#pragma once

namespace era_bridge::map_rules
{
inline bool doubleArtifact(bool enabled,bool validOwner,bool ordinaryArtifact,int marker,int directCount)
{
    return enabled&&validOwner&&ordinaryArtifact&&marker!=0&&directCount<2;
}
inline bool clearArtifactMarker(bool enabled,bool validOwner,bool ordinaryArtifact,int marker)
{
    return enabled&&validOwner&&ordinaryArtifact&&marker==15;
}
}
