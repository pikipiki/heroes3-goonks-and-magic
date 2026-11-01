/* Internal clone resurrection guard; GPL-2.0-or-later. */
#pragma once
namespace era_bridge
{
class CloneHealScope
{
    bool & cloned;
    const bool previous;
public:
    explicit CloneHealScope(bool & flag) : cloned(flag), previous(flag) { cloned = false; }
    ~CloneHealScope() { cloned = previous; }
    CloneHealScope(const CloneHealScope &) = delete;
    CloneHealScope & operator=(const CloneHealScope &) = delete;
};
}
