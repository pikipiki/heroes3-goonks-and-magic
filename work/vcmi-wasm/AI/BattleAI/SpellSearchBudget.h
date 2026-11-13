#pragma once

#include <chrono>
#include <optional>

namespace battleai
{
struct SpellSearchExpired {};

// Only speculative allied spell searches install a deadline. Native AI and
// ordinary action selection keep their original unlimited calculations.
class SpellSearchBudget
{
public:
 using Clock = std::chrono::steady_clock;
 using Deadline = std::optional<Clock::time_point>;
 explicit SpellSearchBudget(Deadline deadline) : previous(current) { current = deadline; }
 ~SpellSearchBudget() { current = previous; }
 SpellSearchBudget(const SpellSearchBudget &) = delete;
 SpellSearchBudget & operator=(const SpellSearchBudget &) = delete;
 static void check()
 {
  if(current && Clock::now() >= *current)
   throw SpellSearchExpired{};
 }
private:
 Deadline previous;
 inline static thread_local Deadline current;
};
}
