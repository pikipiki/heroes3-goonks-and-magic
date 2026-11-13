/* Original14-slot dispatch shared by the admitted source XP services. */
#pragma once
#include "EraSourceCreatureSpellPower.h"
#include <array>
#include <cstdint>
#include <stdexcept>
#include <string_view>
namespace era_bridge
{
enum class SourceXpPhase { Before, After };
enum class SourceXpPermit { Off, PrivateValidation, Admitted };
struct SourceXpProvenance
{
    int sourceId;
    std::string_view nativeId;
    int sourceLine, sourceOrdinal, cacheSlot;
    char code;
    int spell;
    std::array<std::uint8_t,11> chances;
    bool existingSourceOwner=false;
};
// CURRENT is supplied by the action scope; never replace it with the retaliator.
// basePower is primary count, or the separately verified commander raw-magic rule.
enum class SourceXpKernel { Unclosed, ExistingOwner, SourceSingle16or17, SourceArea21, SourcePoison71 };
constexpr SourceXpKernel sourceXpKernel(const SourceXpProvenance & row)
{
    if(row.existingSourceOwner)return SourceXpKernel::ExistingOwner;
    if(row.sourceId==196&&row.code=='k'&&row.spell==71)return SourceXpKernel::SourcePoison71;
    if(row.code!='a')return SourceXpKernel::Unclosed;
    if((row.sourceId==167&&row.spell==16)||((row.sourceId==92||row.sourceId==93)&&row.spell==17))return SourceXpKernel::SourceSingle16or17;
    if(row.sourceId==195&&row.spell==21)return SourceXpKernel::SourceArea21;
    return SourceXpKernel::Unclosed;
}
struct SourceXpCurrent
{
    int sourceId, side;
    std::uint32_t basePower;
};
struct SourceXpPrimaryQuery
{
    const SourceXpProvenance & provenance;
    int primaryQuerySide;
};
struct SourceXpCastRequest
{
    const SourceXpProvenance & provenance;
    int mastery, power, casterKind, currentSide, primaryQuerySide;
};
constexpr bool sourceXpBefore(char code){return code=='p'||code=='J'||code=='j';}
constexpr int sourceXpMastery(char code)
{
    return code=='p'||code=='a'?3:code=='J'||code=='K'?2:code=='j'||code=='k'?1:-1;
}
// Gate each code group once, as three separate71D939 calls. Do not recheck alive
// after a prior row in the SAME code group; eligibility still sees current target.
// Sink owns source71C16D preparation/global gates and the exact source5A8950 gate and5A0140 cast implementation. This model
// deliberately does not substitute the native spell target/resistance machinery.
template<std::size_t N,typename Sink>
void runSourceXpPhase(const std::array<SourceXpProvenance,N> & rows,
    SourceXpPermit permit,SourceXpPhase phase,int sourceId,std::string_view nativeId,
    int rank,Sink & sink,bool privateReplayExistingOwners=false)
{
    if(permit==SourceXpPermit::Off)return;
    if(rank<0||rank>10)throw std::invalid_argument("Source XP rank0..10 required");
    // Validate caller-provided source provenance before any RNG/side effects.
    std::array<bool,14> occupied{};
    for(const auto & row:rows)if(row.sourceId==sourceId)
    {
        if(row.nativeId!=nativeId||row.cacheSlot<0||row.cacheSlot>=14
            ||occupied[row.cacheSlot]||sourceXpMastery(row.code)<0||row.spell<0||row.spell>=87)
            throw std::invalid_argument("Invalid original source XP row");
        occupied[row.cacheSlot]=true;
    }
    const std::array<char,3> groups=phase==SourceXpPhase::Before
        ?std::array<char,3>{'p','J','j'}:std::array<char,3>{'a','K','k'};
    for(char code:groups)
    {
        if(!sink.prepareSourceGroup(code)||!sink.casterAlive()||!sink.targetAlive())continue;
        for(int slot=0;slot<14;++slot)for(const auto & row:rows)
        {
            if(row.sourceId!=sourceId||row.code!=code||row.cacheSlot!=slot
                ||(row.existingSourceOwner&&!privateReplayExistingOwners))continue;
            const auto chance=row.chances[rank];if(chance==0)continue;
            const int roll=sink.chanceRoll();
            if(roll<1||roll>100)throw std::invalid_argument("Source XP RNG1..100 required");
            if(roll>chance)continue;
            const int querySide=sink.casterQuerySide();
            if(!sink.primaryAccepts(SourceXpPrimaryQuery{row,querySide}))continue;
            const SourceXpCurrent current=sink.currentForCast();
            const int power=SourceCreatureSpellPower::overrides(1,row.spell)
                ?SourceCreatureSpellPower::forSource(current.sourceId).apply(current.basePower):3;
            const SourceXpCastRequest request{row,sourceXpMastery(code),power,1,
                current.side,querySide};
            sink.cast(request);
        }
    }
}
}
