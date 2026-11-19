/* Source UN:J6 mutable artifact pool; GPL-2.0-or-later. */
#pragma once
#include <cstddef>
#include <optional>
#include <stdexcept>
#include <vector>
namespace era_bridge::source_artifact_pool
{
struct Entry
{
    int id;
    int classes;
    bool allowed;
    bool disabled;
};
inline bool initiallyDisabled(int sourceId)
{return sourceId==141||sourceId==142||sourceId==143;}
// Entries retain source table order. The caller owns the shared persistent
// used set; original and other native consumers can share that same state.
template<class Used,class NextOrdinal>
std::optional<int> pick(const std::vector<Entry> & entries,Used & used,int classes,NextOrdinal next)
{
    for(int pass=0;pass<2;++pass)
    {
        const auto available=[&]()
        {
            std::vector<int> result;
            for(const auto & entry:entries)
                if((entry.classes&classes)&&entry.allowed&&!entry.disabled&&!used.count(entry.id))result.push_back(entry.id);
            return result;
        };
        auto candidates=available();
        if(candidates.empty())
        {
            for(const auto & entry:entries)if(entry.classes&classes)
            {
                if(entry.allowed)used.erase(entry.id);
                else used.insert(entry.id);
            }
            candidates=available();
        }
        if(!candidates.empty())
        {
            const auto ordinal=next(candidates.size());
            if(ordinal<0||static_cast<std::size_t>(ordinal)>=candidates.size())throw std::runtime_error("Invalid source artifact ordinal");
            const int selected=candidates[ordinal];used.insert(selected);return selected;
        }
        if(classes==30)break;
        classes=30;
    }
    // Original loops indefinitely if every ordinary artifact is unavailable.
    // Return failure so the native host can report that unsupported state.
    return std::nullopt;
}
}
