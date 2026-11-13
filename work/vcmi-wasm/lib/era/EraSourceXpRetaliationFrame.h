#pragma once
#include <optional>
#include <cstdint>
namespace era_bridge
{
// Remember the incoming-hit status independently of later XP reapplications.
// Scope covers precisely the resulting retaliation, including detached states.
struct SourceXpRetaliationValue {std::uint32_t actor;int percentage;};
inline thread_local std::optional<SourceXpRetaliationValue> sourceXpRetaliationValue;
class SourceXpRetaliationScope
{
 std::optional<SourceXpRetaliationValue> previous;
public:
 SourceXpRetaliationScope(std::uint32_t actor,int percentage):previous(sourceXpRetaliationValue)
 {sourceXpRetaliationValue=SourceXpRetaliationValue{actor,percentage};}
 ~SourceXpRetaliationScope(){sourceXpRetaliationValue=previous;}
 SourceXpRetaliationScope(const SourceXpRetaliationScope&)=delete;
};
}
