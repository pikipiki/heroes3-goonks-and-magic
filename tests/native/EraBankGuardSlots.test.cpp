#include "../../work/vcmi-wasm/lib/era/EraBankGuardSlotSemantics.h"
#include <cassert>
#include <map>
#include <memory>
struct Stack {int type;int amount;};
struct Army {std::map<int,std::unique_ptr<Stack>> slots;int stacksCount()const{return slots.size();}bool hasStackAtSlot(int s)const{return slots.count(s);}std::unique_ptr<Stack> detachStack(int s){auto p=std::move(slots.at(s));slots.erase(s);return p;}void putStack(int s,std::unique_ptr<Stack> p){assert(!slots.count(s));slots[s]=std::move(p);}};
Army fixture(){Army a;for(int i=0;i<4;++i)a.putStack(i,std::make_unique<Stack>(Stack{242,8+i}));return a;}
int main(){const auto slot=[](int x){return x;};auto a=fixture();auto original=a.slots.at(0).get();era_bridge::restoreBankGuardSlots(a,{3,4,5,6},slot);assert(a.stacksCount()==4&&!a.hasStackAtSlot(0)&&a.slots.at(3).get()==original);for(int i=0;i<4;++i)assert(a.slots.at(i+3)->amount==8+i);auto reset=fixture();era_bridge::restoreBankGuardSlots(reset,{3,4,5,6},slot);assert(reset.slots.at(6)->amount==11);for(auto invalid:std::vector<std::vector<int>>{{3,3,5,6},{3,4,5,7},{-1,4,5,6},{3,4,5},{}}){auto b=fixture();bool rejected=false;try{era_bridge::restoreBankGuardSlots(b,invalid,slot);}catch(const std::invalid_argument&){rejected=true;}assert(rejected&&b.hasStackAtSlot(0)&&b.slots.at(0)->amount==8);}bool rejected=false;try{era_bridge::restoreBankGuardSlots(a,{3,4,5,6},slot);}catch(const std::invalid_argument&){rejected=true;}assert(rejected&&a.hasStackAtSlot(3));}
