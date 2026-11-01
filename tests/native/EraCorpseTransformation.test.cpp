#include "../../work/vcmi-wasm/lib/era/EraCorpseTransformation.h"
#include <cassert>
int main()
{
 using era_bridge::raisedCorpseCount;
 // Three living casters give150HP, not120; target50HP gives3, not2.
 assert(raisedCorpseCount(3*50, 1000, 20, 50)==3);
 assert(raisedCorpseCount(3*40, 1000, 20, 50)==2);
 // Count and corpse HP caps apply independently.
 assert(raisedCorpseCount(100000, 100, 2, 1)==2);
 assert(raisedCorpseCount(100000, 100, 10, 50)==2);
 // Dynamic output HP: the same source corpse need not produce the same species/count.
 assert(raisedCorpseCount(150, 1000, 20, 100)==1);
 assert(raisedCorpseCount(150, 1000, 20, 10)==15);
 // Current corpse maxHP changes (Aging) change available corpse-health budget.
 assert(raisedCorpseCount(1000, 20*100, 20, 100)==10);
 assert(raisedCorpseCount(1000, 20*25, 20, 100)==5);
 for(auto health:{0,-1})assert(raisedCorpseCount(150,1000,20,health)==0);
 assert(raisedCorpseCount(0,1000,20,50)==0);
 assert(raisedCorpseCount(1000,0,20,50)==0);
 assert(raisedCorpseCount(1000,1000,0,50)==0);
 assert(raisedCorpseCount(1000000000000LL,1000000000000LL,2000000000,1)==2000000000);
}
