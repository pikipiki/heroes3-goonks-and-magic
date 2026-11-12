/* Native camera-aware source352 chain presentation, GPL-2.0-or-later. */
#pragma once
#include "BattleAnimationClasses.h"
#include "../../lib/CStack.h"
#include "BattleInterface.h"
#include "BattleProjectileController.h"
#include "BattleStacksController.h"
class EraDungeonChainAnimation final:public BattleAnimation
{
    const CStack * previous;
    const CStack * target;
    bool init()override
    {
        owner.projectilesController->createSourceDungeonChainArc(previous,target);
        return true;
    }
public:
    EraDungeonChainAnimation(BattleInterface & owner,const CStack * previous,const CStack * target)
        :BattleAnimation(owner),previous(previous),target(target){}
    void tick(uint32_t)override
    {
        if(!owner.projectilesController->hasActiveProjectile(previous,false))delete this;
    }
};
