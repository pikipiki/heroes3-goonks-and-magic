#include "../../work/vcmi-wasm/lib/era/EraCampaignSlotCurseRule.h"
#include <cassert>
int main(){
 using namespace era_campaign_slot_curse;
 for(int source=0;source<=8;++source)for(int old=-1;old<=143;++old){const int value=encode(source,old);if(value==32)continue;assert(slot(value)==source);assert(artifact(value)==old);}
 assert(add(2147483647,1)==(-2147483647-1));assert(subtract(-2147483647-1,1)==2147483647);
 assert(nativeSlot(6)==6);assert(nativeSlot(7)==8);assert(nativeSlot(8)==17);
 assert(!expired(5,99,104));assert(expired(5,99,105));
 assert(lockCount(255,1)==0);assert(lockCount(0,-1)==255);
 bool encodedRejected=false;try{nativeSlot(38);}catch(...){encodedRejected=true;}assert(encodedRejected);
 bool rejected=false;try{nativeSlot(9);}catch(...){rejected=true;}assert(rejected);
}
