#include "../../work/vcmi-wasm/lib/era/EraFangarmHypnotize.h"
#include <cassert>
#include <cmath>
#include <limits>
int main()
{
 using namespace era_bridge;
 assert(fangarmAstralHypnotizeThreshold(35,1,1)==37);
 assert(fangarmAstralHypnotizeThreshold(35,1,2)==35);
 assert(fangarmAstralHypnotizeThreshold(35,2,2)==37);
 assert(fangarmAstralHypnotizeThreshold(35,3,2)==37);
 assert(fangarmAstralHypnotizeThreshold(35,4,2)==38);
 assert(fangarmAstralHypnotizeThreshold(100,1,1)==103);
 assert(fangarmAstralHypnotizeThreshold(-35,1,1)==-36);
 assert(fangarmAstralHypnotizeThreshold(-100,1,1)==-103); //FSTPqword precedes CEIL
 assert(fangarmAstralHypnotizeThreshold(35,65535,1)==34);
 assert(fangarmAstralHypnotizeThreshold(35,65536,1)==35);
 assert(fangarmAstralHypnotizeThreshold(35,1,0)==35);
 // Independent binary64 CEIL oracle, edge cases and1M deterministic IMUL32
 // products, including signed16 level truncation and negative wrap results.
 uint32_t seed=0x2630040u;
 for(unsigned i=0;i<1000000;++i)
 {
  seed=seed*1664525u+1013904223u;const int32_t raw=hornSigned32(seed);
  seed=seed*1664525u+1013904223u;const uint32_t level=seed;
  const int32_t signedLevel=int32_t(level&65535u)-(level&32768u?65536:0);
  const int targetLevel=int(i%8)+1;
  const int32_t product=hornSigned32(uint32_t(signedLevel/targetLevel)*uint32_t(raw));
  const int32_t gain=int32_t(std::ceil(double(product)*0.03));
  const auto expected=hornSigned32(uint32_t(raw)+uint32_t(gain));
  assert(fangarmAstralHypnotizeThreshold(raw,level,targetLevel)==expected);
 }
 for(const int32_t raw:{std::numeric_limits<int32_t>::min(),-2147483600,-100,-1,0,1,100,2147483600,std::numeric_limits<int32_t>::max()})
  assert(fangarmAstralHypnotizeThreshold(raw,1,1)==hornSigned32(uint32_t(raw)+uint32_t(int32_t(std::ceil(double(raw)*0.03)))));
}
