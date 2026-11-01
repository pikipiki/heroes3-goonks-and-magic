#include "../../work/vcmi-wasm/lib/era/EraBridgeRuntime.h"
#include <cassert>
#include <iostream>
#include <limits>
#include <vector>

using namespace era_bridge;

template<class Exception, class Callback>
void expectThrow(Callback callback)
{
    bool caught = false;
    try { callback(); }
    catch (const Exception &) { caught = true; }
    assert(caught);
}

int main()
{
    // Exact probability threshold: 49 succeeds and 50 fails for chance 50.
    assert(regeneration(20, 100, 50, 50, 49) == 50);
    assert(regeneration(20, 100, 50, 50, 50) == 0);
    assert(regeneration(20, 100, 50, 0, 0) == 0);
    assert(regeneration(20, 100, 50, 100, 99) == 50);
    assert(regeneration(80, 100, 50, 100, 0) == 20);
    assert(regeneration(100, 100, 50, 100, 0) == 0);
    assert(regeneration(0, 100, 50, 100, 0) == 0);
    assert(regeneration(20, 100, 0, 100, 0) == 0);
    expectThrow<std::invalid_argument>([] { regeneration(101,100,50,100,0); });
    expectThrow<std::invalid_argument>([] { regeneration(-1,100,50,100,0); });
    expectThrow<std::invalid_argument>([] { regeneration(1,0,50,100,0); });
    expectThrow<std::invalid_argument>([] { regeneration(1,100,-1,100,0); });
    expectThrow<std::invalid_argument>([] { regeneration(1,100,50,101,0); });
    expectThrow<std::invalid_argument>([] { regeneration(1,100,50,50,100); });
    expectThrow<std::invalid_argument>([] { regeneration(1,100,50,50,-1); });

    // Rebirth exposes HP directly, with no invented whole-creature rounding.
    assert(rawRebirthHealth(10,100,0.5f,0.3f,0.2f,4999) == 500);
    assert(rawRebirthHealth(10,100,0.5f,0.3f,0.2f,5000) == 200);
    assert(rawRebirthHealth(10,100,0.0f,0.3f,0.2f,0) == 200);
    assert(rawRebirthHealth(10,100,1.0f,0.3f,0.2f,9999) == 500);
    assert(rawRebirthHealth(3,101,1.0f,0.3f,0.2f,0) == 151);
    const auto one = rebirth(1,100,1.0f,0.3f,0.2f,0,1,false);
    assert(one.health == 100 && one.consumesCharge && one.marksUsed);
    const auto none = rebirth(0,100,1.0f,0.3f,0.2f,0,1,false);
    assert(none.health == 0 && !none.consumesCharge && !none.marksUsed);
    assert(rebirth(10,100,1.0f,0.3f,0.2f,0,0,false).health == 0);
    assert(rebirth(10,100,1.0f,0.3f,0.2f,0,1,true).health == 0);
    assert(rebirth(10,100,0.0f,0.3f,0.0f,0,1,false).health == 0);
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(-1,100,.5f,.3f,.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,0,.5f,.3f,.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,1.1f,.3f,.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,.5f,-.3f,.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,.5f,.3f,-.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,.5f,.3f,.2f,10000); });
    expectThrow<std::invalid_argument>([] { rebirth(1,100,.5f,.3f,.2f,0,-1,false); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,std::numeric_limits<float>::quiet_NaN(),.3f,.2f,0); });
    expectThrow<std::invalid_argument>([] { rawRebirthHealth(1,100,.5f,std::numeric_limits<float>::infinity(),.2f,0); });
    expectThrow<std::overflow_error>([] { rawRebirthHealth(std::numeric_limits<Health>::max(),2,1.f,.3f,.2f,0); });
    expectThrow<std::overflow_error>([] { rawRebirthHealth(1,std::numeric_limits<Health>::max(),1.f,2.f,0.f,0); });

    const auto transfer = beforeMeleeStatTransfer(ActionKind::MeleeAttack,10,1);
    assert(transfer.applied && transfer.attackDelta == 3 && transfer.defenseDelta == -1);
    assert(!beforeMeleeStatTransfer(ActionKind::MeleeAttack,10,0).applied);
    assert(!beforeMeleeStatTransfer(ActionKind::MeleeAttack,10,-1).applied);
    assert(!beforeMeleeStatTransfer(ActionKind::MeleeAttack,10,1,true).applied);
    for (const auto action : {ActionKind::RangedAttack,ActionKind::CastSpell,ActionKind::Retaliation,ActionKind::Other})
        assert(!beforeMeleeStatTransfer(action,10,10).applied);
    expectThrow<std::overflow_error>([] { beforeMeleeStatTransfer(ActionKind::MeleeAttack,std::numeric_limits<Health>::max(),1); });

    // Explicit RNG input makes replays independent of any process/global RNG.
    const auto replay = [] {
        std::vector<Health> results;
        for (int i = 0; i < 10000; ++i) {
            results.push_back(regeneration(20,100,50,50,i%100));
            results.push_back(rawRebirthHealth(3,101,.5f,.3f,.2f,i));
        }
        return results;
    };
    assert(replay() == replay());
    std::cout << "EraBridgeRuntime: regeneration, raw rebirth HP, event stat transfer, validation and replay checks passed\n";
}
