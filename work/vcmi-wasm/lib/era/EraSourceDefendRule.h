/* Optional source479036..479207 stored4DC, not dynamic native20%. */
#pragma once
#include <cstdint>
#include <algorithm>
#include <optional>
#include <string_view>
namespace era_bridge
{
inline std::int32_t sourceDefendSigned(std::uint32_t value)
{return value<0x80000000u?static_cast<std::int32_t>(value):static_cast<std::int32_t>(std::int64_t(value)-0x100000000LL);}
inline std::int32_t sourceDefendAdd(std::int32_t a,std::int32_t b)
{return sourceDefendSigned(std::uint32_t(a)+std::uint32_t(b));}

struct SourceDefendSnapshot{std::int32_t storedDefense=0;bool tactics=false,siege=false,alreadyDefending=false;};
struct SourceDefendChange{std::int32_t delta=0;bool write=false,setDefending=false;};
inline bool sourceDefendActivationClears(int createdRound,int selectedRound)
{return selectedRound>createdRound;}
inline SourceDefendChange sourceDefend(SourceDefendSnapshot s)
{
 if(s.alreadyDefending)return{}; //47903C bit27/26 skips new4DC.
 if(s.tactics||s.siege)return{0,true,false}; //4788B3 EDI=0 ->4791F3.
 // LEA/SHL wraps the20*x operand before signed magic division by100.
 const auto product=sourceDefendSigned(std::uint32_t(s.storedDefense)*20u);
 return{std::max<std::int32_t>(1,product/100),true,true};
}
}
