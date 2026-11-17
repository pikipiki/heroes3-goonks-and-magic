#include "../../work/vcmi-wasm/lib/gameState/ArmyBulkTransfer.h"
#include <cassert>
#include <map>
using namespace army_bulk_transfer;
std::map<int,std::int64_t> total(const Army & a,const Army & b){std::map<int,std::int64_t> out;for(const auto & army:{a,b})for(const auto & s:army)if(s.count)out[s.creature]+=s.count;return out;}
void apply(Army & a,Army & b,bool last){auto before=total(a,b);auto moves=plan(a,b,last,0);for(const auto & m:moves){auto & from=m.withinDestination?b[m.from]:a[m.from];auto & to=b[m.to];assert(from.count>=m.count);assert(to.count==0||to.creature==from.creature);to.creature=from.creature;to.count+=m.count;from.count-=m.count;}assert(total(a,b)==before);if(last){std::int64_t n=0;for(auto s:a)n+=s.count;assert(n>=1);}}
int main(){
 Army a{},b{};a[0]={1,10};a[1]={1,5};b[0]={1,3};apply(a,b,true);assert(a[0].count==1&&a[1].count==0&&b[0].count==17);
 a={};b={};a[0]={8,4};a[1]={1,5};for(int i=0;i<7;++i)b[i]={i+1,2};apply(a,b,true);assert(a[0].count==4&&a[1].count==0&&b[0].count==7);
 a={};b={};a[0]={8,4};a[1]={8,3};for(int i=0;i<7;++i)b[i]={i==1?1:i+1,2};apply(a,b,false);int families=0;for(auto s:b)if(s.count){++families;if(s.creature==8)assert(s.count==7);}assert(families==7);
 a={};b={};a[0]={8,1};assert(plan(a,b,true,0).empty());apply(a,b,true);
 // Exercise full/partial armies, duplicates and both retention policies.
 for(int mask=0;mask<128;++mask)for(int offset=0;offset<8;++offset)for(bool last:{false,true}){a={};b={};for(int i=0;i<7;++i){if(mask&(1<<i))a[i]={(i+offset)%5,i+1};if((mask^85)&(1<<i))b[i]={(i+offset)%6,i+2};}if(a[0].count==0)a[0]={offset,1};apply(a,b,last);}
}
