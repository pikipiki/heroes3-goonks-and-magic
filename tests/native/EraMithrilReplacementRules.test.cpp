#include "../../work/vcmi-wasm/lib/era/EraMithrilReplacementRules.h"
#include <cassert>
#include <climits>
#include <vector>
#include <algorithm>
using namespace era_bridge::mithril;
int main(){
 for(int resource=0;resource<=7;++resource)for(unsigned amount=0;amount<12;++amount){
  const auto actual=replacementAmount(resource,resource==6?amount*100:amount);
  if(amount<2||amount>9)assert(!actual);
  else assert(actual==(resource==0||resource==2||resource==6?amount/2+1:amount));
 }
 assert(!replacementAmount(6,550));assert(!replacementAmount(-1,5));assert(!replacementAmount(8,5));
 assert(replacementCounter(0,false,0)==-1);assert(replacementCounter(2,false,0)==1);assert(replacementCounter(INT_MIN,false,0)==INT_MAX);
 assert(replacementCounter(-10,true,0)==0&&replacementCounter(-10,true,35)==35);
 std::vector<ReplacementSitePosition> v{{0,0,1,4},{0,1,0,2},{1,1,0,3},{1,0,0,1},{0,0,0,0}};
 std::sort(v.begin(),v.end(),replacementSiteLess);for(int i=0;i<5;++i)assert(v[i].id==i);
}
