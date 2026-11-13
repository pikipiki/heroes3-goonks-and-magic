/* Private source241 ATT_DISPEL3. No production admission or BAP hook. */
#pragma once
#include <array>
#include <vector>
#include <stdexcept>
#include <string_view>
#include <optional>
namespace era_bridge
{
inline constexpr std::string_view dragonFly241PacketPrefix="eraSource241:remove:v1:";
inline std::optional<bool> dragonFly241PacketIdentity(std::string_view requested,
    int requestedTurns,std::string_view candidate,int candidateTurns)
{
    if(requested.substr(0,dragonFly241PacketPrefix.size())!=dragonFly241PacketPrefix)return std::nullopt;
    return requestedTurns>0&&requestedTurns==candidateTurns
        &&requested.substr(dragonFly241PacketPrefix.size())==candidate;
}
// Original initialized descriptor table6854A0, stride136, field0>0.
inline constexpr std::array<int,26> source241PositiveSpells{
    27,28,29,30,31,32,33,34,36,37,38,39,40,41,43,44,46,48,49,51,53,55,56,58,63,65};
struct DragonFly241Snapshot
{
    bool privatePermit=false,sourceDurationsVerified=false;
    int sourceId=-1,originalActorSide=-1,currentSide=-1;
    bool actorHypnotized=false,targetAlive=false;
    // 5A83A0 target.GetHero(), not actor/CURRENT hero.
    bool targetHeroSphere92=false;
    std::array<int,81> durations{};
};
struct DragonFly241Result
{
    bool handled=false,queried=false,cast=false;
    int querySide=-1,currentSide=-1,primaryRolls=0;
    std::vector<int> removed;
};
// Sink.removePositiveSourceSpell must perform source444230 semantics and restore
// stats, not merely delete arbitrary SPELL_EFFECT bonuses. Its provenance is
// mandatory; original slots with duration<=0 never reach it. No EC queue here.
template<class Sink> DragonFly241Result runPrivateDragonFly241(const DragonFly241Snapshot & s,Sink & sink)
{
    DragonFly241Result result;
    if(!s.privatePermit||s.sourceId!=241)return result;
    if(!s.sourceDurationsVerified||s.originalActorSide<0||s.originalActorSide>1||s.currentSide<0||s.currentSide>1)
        throw std::invalid_argument("Source241 original duration/side provenance required");
    result.handled=true;result.currentSide=s.currentSide;
    result.querySide=s.originalActorSide^(s.actorHypnotized?1:0);
    if(!s.targetAlive)return result; //4410EA. No independent caster-alive gate.
    result.queried=true;
    bool hasPositive=false;
    for(int spell:source241PositiveSpells)if(s.durations[spell]!=0){hasPositive=true;break;}
    const int accuracy=!s.targetHeroSphere92&&hasPositive?100:0;
    ++result.primaryRolls;
    const int roll=sink.uniform(1,100); //5A8950 ALWAYS, even0/100. No chance roll.
    if(roll<1||roll>100)throw std::runtime_error("Invalid source241 primary RNG");
    if(roll>accuracy)return result;
    result.cast=true;
    sink.beginDirectCast(78,0,3,1,result.querySide,result.currentSide);
    //5A1A8E scans10..69 (not query's10..80);444230 refuses<=0.
    for(int spell:source241PositiveSpells)if(spell<70&&s.durations[spell]>0)
    {sink.removePositiveSourceSpell(spell);result.removed.push_back(spell);}
    sink.endDirectCast();
    // Caller then dispatches ordered XP a/K/k, then precomputed FireShield.
    return result;
}
}
