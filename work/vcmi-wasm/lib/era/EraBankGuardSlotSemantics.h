#pragma once
#include <array>
#include <stdexcept>
#include <vector>
#include <utility>
namespace era_bridge
{
// h3era.exe0x47A717..0x47A721 copies all seven guardian types/counts, retaining holes.
inline void validateBankGuardSlots(const std::vector<int> & targets, std::size_t stackCount)
{
    if(targets.empty() || targets.size()>7 || targets.size()!=stackCount)
        throw std::invalid_argument("ERA bank guardian slots disagree with configured army");
    std::array<bool,7> seen{};
    for(const int slot:targets)
    {
        if(slot<0 || slot>=7 || seen[slot])
            throw std::invalid_argument("ERA bank guardian slots must be unique0..6");
        seen[slot]=true;
    }
}
// Validate completely before detaching. Caller supplies the engine's SlotID conversion.
// The map's usual army serialization then preserves the resulting original slots.
template<class Army,class SlotFactory>
void restoreBankGuardSlots(Army & army,const std::vector<int> & targets,SlotFactory slot)
{
    validateBankGuardSlots(targets,static_cast<std::size_t>(army.stacksCount()));
    for(std::size_t i=0;i<targets.size();++i)
        if(!army.hasStackAtSlot(slot(static_cast<int>(i))))
            throw std::invalid_argument("ERA bank slot remap requires freshly initialized dense guardians");
    using OwnedStack=decltype(army.detachStack(slot(0)));
    std::vector<OwnedStack> stacks;
    stacks.reserve(targets.size());
    for(std::size_t i=0;i<targets.size();++i)
        stacks.push_back(army.detachStack(slot(static_cast<int>(i))));
    for(std::size_t i=0;i<targets.size();++i)
        army.putStack(slot(targets[i]),std::move(stacks[i]));
}
}
