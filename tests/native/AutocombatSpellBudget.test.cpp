#include "../../work/vcmi-wasm/AI/BattleAI/SpellSearchBudget.h"
#include <cassert>
#include <memory>
#include <thread>
#include <vector>

int main()
{
 using Budget = battleai::SpellSearchBudget;
 std::vector<int> committed;
 for(int i=0;i<100;++i) { Budget::check(); committed.push_back(i); }
 assert(committed.size()==100); // Default/native calculations stay unlimited.
 int liveStates=0;
 struct State { int & live; explicit State(int & live):live(live){++live;} ~State(){--live;} };
 bool expired=false;
 try
 {
  Budget budget(Budget::Clock::now()-std::chrono::milliseconds(1));
  auto hypothetical=std::make_unique<State>(liveStates);
  Budget::check();
  committed.push_back(-1); // An incomplete simulated spell must never be committed.
 }
 catch(const battleai::SpellSearchExpired &) { expired=true; }
 assert(expired && liveStates==0 && committed.size()==100);
 Budget::check(); // Unwinding restored the caller; manual/other AI work is untouched.
 {
  Budget expiredOuter(Budget::Clock::now()-std::chrono::milliseconds(1));
  { Budget unboundedInner(std::nullopt); Budget::check(); }
  bool nestedExpired=false;
  try { Budget::check(); } catch(const battleai::SpellSearchExpired &) { nestedExpired=true; }
  assert(nestedExpired);
  std::thread other([]{ Budget::check(); }); // Deadlines cannot leak between AI threads.
  other.join();
 }
 Budget::check();
}
