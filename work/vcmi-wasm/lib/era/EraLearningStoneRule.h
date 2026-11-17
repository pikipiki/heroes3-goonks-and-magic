/* ERA Scripts779: source Learning Stone experience and native learning ABI.
 * GPL-2.0-or-later. Source: option779 advancedstones.erm; h3era.exe4E4AB0.
 */
#pragma once
#include <array>
#include <cmath>
#include <cstdint>
#include <limits>
#include <stdexcept>
namespace era_compat::learning_stone
{
inline float learningPower(std::int32_t level,int skill,bool specialist)
{
 if(skill<0||skill>3)throw std::runtime_error("ERA779 learning tier is not source-validated");
 constexpr std::array<float,4> values{{0.0f,0.05f,0.10f,0.15f}};
 float bonus=values[skill];
 if(skill>0&&specialist)
 {
  // Native x87 computes the factor in extended precision, stores its product
  // with the skill bonus to f32, adds1, then SN:E stores the return to e1 f32.
  const auto raw=static_cast<std::uint16_t>(level);
  const auto signedLevel=raw<0x8000u?static_cast<std::int32_t>(raw):static_cast<std::int32_t>(raw)-0x10000;
  long double factor=static_cast<long double>(signedLevel)*static_cast<long double>(0.05f)+1.0L;
  bonus=static_cast<float>(factor*static_cast<long double>(bonus));
 }
 return static_cast<float>(static_cast<long double>(bonus)+1.0L);
}
inline std::int32_t experience(std::int32_t level,float power,float base=1000.0f)
{
 // Every ERM e-variable assignment/arithmetic operation stores a single.
 // Final VR(result):Se1 truncates toward zero (Erm.pas VR_S).
 volatile float value=static_cast<float>(level);
 value=value-1.0f;value=value*100.0f;value=value+base;
 const float result=static_cast<float>(power*value);
 if(!std::isfinite(result)||static_cast<double>(result)<std::numeric_limits<std::int32_t>::min()||static_cast<double>(result)>std::numeric_limits<std::int32_t>::max())
  throw std::runtime_error("ERA779 experience outside source32 domain");
 return static_cast<std::int32_t>(result);
}
}
