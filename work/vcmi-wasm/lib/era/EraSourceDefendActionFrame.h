/* Capture before native StartAction sets its current DEFEND flag. */
#pragma once
#include <optional>
namespace era_bridge
{
struct SourceDefendActionEntry
{
    const void * actor = nullptr;
    bool alreadyDefending = false;
};
inline thread_local std::optional<SourceDefendActionEntry> sourceDefendActionEntry;
class SourceDefendActionScope
{
    std::optional<SourceDefendActionEntry> previous;
public:
    SourceDefendActionScope(const void * actor, bool alreadyDefending)
        : previous(sourceDefendActionEntry)
    {
        if(actor) sourceDefendActionEntry = SourceDefendActionEntry{actor, alreadyDefending};
        else sourceDefendActionEntry.reset();
    }
    ~SourceDefendActionScope() { sourceDefendActionEntry = previous; }
    SourceDefendActionScope(const SourceDefendActionScope &) = delete;
    SourceDefendActionScope & operator=(const SourceDefendActionScope &) = delete;
};
inline std::optional<bool> sourceDefendBeforeAction(const void * actor)
{
    if(!sourceDefendActionEntry || sourceDefendActionEntry->actor != actor) return std::nullopt;
    return sourceDefendActionEntry->alreadyDefending;
}
}
