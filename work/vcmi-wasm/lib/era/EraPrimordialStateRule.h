#pragma once
#include <vector>
namespace era_bridge
{
// Typed, value-neutral DEFENSIVE_STANCE marker: schema/sourceID/sourcebit/state.
inline int primordialInitialDefendingState(const std::vector<int> & parameters)
{
    if(parameters.size()!=4||parameters[0]!=1||parameters[1]!=347||parameters[2]!=27
        ||(parameters[3]!=0&&parameters[3]!=1))return -1;
    return parameters[3];
}
inline bool primordialDefended(bool nativeDefending,int turn,int markerState)
{return turn==0&&(nativeDefending||markerState==1);}
}
