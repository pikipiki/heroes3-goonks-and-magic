#pragma once
namespace era_bridge
{
inline bool confirmTransformerReturn(bool & inHoldingArea, bool & pending)
{
    if(!pending)return false;
    pending=false;
    const bool mustMove=!inHoldingArea;
    inHoldingArea=true;
    return mustMove;
}
inline int transformerPreviewCreature(int original, bool inHoldingArea, int registeredTarget)
{
    return !inHoldingArea && registeredTarget >= 0 ? registeredTarget : original;
}
}
