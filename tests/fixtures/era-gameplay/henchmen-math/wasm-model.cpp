#include "EraHenchmanRules.h"
#include <emscripten/emscripten.h>
#include <cstdint>
#include <cstring>
#include <cmath>
static float single(std::uint32_t bits){float value;std::memcpy(&value,&bits,4);return value;}
static std::uint32_t bits(float value){std::uint32_t result;std::memcpy(&result,&value,4);return result;}
extern "C" {
EMSCRIPTEN_KEEPALIVE std::int32_t hero_root(std::int32_t gain){return era_bridge::henchmen::heroExperienceRoot(gain);}
EMSCRIPTEN_KEEPALIVE std::int32_t level_rate(std::int32_t fight,std::int32_t ai){return era_bridge::henchmen::alternativeLevelRate(fight,ai);}
EMSCRIPTEN_KEEPALIVE std::uint32_t sqrt_bits(std::uint32_t base){return bits(std::sqrt(single(base)));}
EMSCRIPTEN_KEEPALIVE std::uint32_t powf_bits(std::uint32_t base,std::uint32_t exponent){return bits(::powf(single(base),single(exponent)));}
EMSCRIPTEN_KEEPALIVE std::uint32_t model_pow_bits(std::uint32_t base,std::uint32_t exponent){return bits(static_cast<float>(std::pow(static_cast<double>(single(base)),static_cast<double>(single(exponent)))));}
EMSCRIPTEN_KEEPALIVE std::uint32_t model_pow_three_fifths_bits(std::uint32_t base){const float input=single(base);const float exponent=3.0f/5.0f;return bits(static_cast<float>(std::pow(static_cast<double>(input),static_cast<double>(exponent))));}
}
