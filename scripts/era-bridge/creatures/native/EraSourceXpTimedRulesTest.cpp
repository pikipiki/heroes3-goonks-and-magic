
#include "EraXpTimed184Rule.h"
#include <cassert>
#include <climits>
using namespace era_bridge::xp184;
int main(){
 for(int spell:{42,49,50,51,52,54,60,62,70,73,74}){
  State blank;auto c=cast(blank,spell,3,1,1,-4,false);assert(c.fresh&&c.state.duration==3);
  auto refresh=cast(c.state,spell,5,3,100,100,false);assert(!refresh.fresh&&refresh.state.duration==5&&refresh.state.mastery==3&&refresh.state.magnitude==c.state.magnitude&&!refresh.counter);
  assert(round(refresh.state,true,false).state.duration==4);assert(round(refresh.state,false,false).state.duration==5);assert(round(refresh.state,true,true).state.duration==5);
  auto end=refresh.state;end.duration=1;assert(round(end,true,false).removed&&round(end,true,false).state.duration==0);
  auto zero=cast(blank,spell,0,3,1,-4,false);assert(zero.fresh&&!zero.state.active()&&!remove(zero.state).removed);
  auto negative=cast(blank,spell,-1,3,1,-4,false);assert(negative.state.active()&&!remove(negative.state).removed&&round(negative.state,true,false).state.duration==-1);
 }
 auto berserk=cast({},59,0,2,0,0,false);assert(berserk.state.duration==255&&berserk.counter==60);assert(cast(berserk.state,59,1,2,0,0,false).state.duration==255);assert(cast({},60,0,3,0,0,false).counter==59);
 assert(cast({},42,0,3,0,0,false).counter==41);assert(cast({},54,0,3,0,0,false).counter==53);assert(!cast({},54,3,3,0,0,true).counter);
 for(int spell:{49,50,51,52})assert(!cast({},spell,3,3,0,0,false).counter);
 auto slow=cast({},54,3,3,0,0,false).state;assert(speed(1,slow,false)==1&&speed(9,slow,false)==4&&speed(9,slow,true)==0);slow.duration=0;assert(!speed(9,slow,false));
 auto disease=cast({},73,0,3,1,-4,false).state;assert(disease.attackLoss()==1&&disease.defenseLoss()==-4);assert(!remove(disease).removed&&remove(disease).state.attackLoss()==1);
 auto again=cast(disease,73,0,3,0,0,false).state;assert(again.attackLoss()==1&&again.defenseLoss()==-4);
 auto positive=cast(again,73,3,3,5,5,false).state;assert(positive.attackLoss()==3&&positive.defenseLoss()==-2);auto removed=remove(positive).state;assert(removed.attackLoss()==1&&removed.defenseLoss()==-4);
 auto refresh=cast(positive,73,5,3,0,0,false).state;assert(refresh.attackLoss()==3&&refresh.activeAttackLoss==2);
 AttackFrame freshBlind{false,false,false,0};assert(normalRetaliationAllowed(freshBlind,true,1,false,false,false)&&retaliationPercent(freshBlind)==100);
 AttackFrame remembered{true,false,false,0};assert(!normalRetaliationAllowed(remembered,true,1,false,false,false));
 remembered.blindRetaliationPercent=50;assert(normalRetaliationAllowed(remembered,true,1,false,false,false)&&retaliationPercent(remembered)==50);remembered.rememberedParalyze=true;assert(retaliationPercent(remembered)==25);
 assert(!normalRetaliationAllowed(freshBlind,true,1,true,false,false));assert(!normalRetaliationAllowed(freshBlind,true,0,false,false,true));assert(!normalRetaliationAllowed(freshBlind,true,1,false,true,false));assert(normalRetaliationAllowed(freshBlind,true,1,false,true,true));
 for(int spell:{42,49,50,51,52,54})assert(mass(spell,3)&&!mass(spell,2));for(int spell:{62,70,73,74})assert(!mass(spell,3));
 assert(originalMutualCounterIgnored(49,50)&&originalMutualCounterIgnored(50,49)&&originalMutualCounterIgnored(51,52)&&originalMutualCounterIgnored(52,51)&&!originalMutualCounterIgnored(41,42));
 assert(cureOrder.size()==14&&cureOrder[0]==42&&cureOrder[1]==45&&cureOrder[12]==74&&cureOrder[13]==75);assert(positive.spell==73);assert(add(INT_MAX,1)==INT_MIN&&sub(INT_MIN,1)==INT_MAX);
 bool rejected=false;try{cast({},45,3,3,1,1,false);}catch(...){rejected=true;}assert(rejected);
}
