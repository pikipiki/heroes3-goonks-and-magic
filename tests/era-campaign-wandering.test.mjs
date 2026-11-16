import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('native wandering steps preserve original weighted routes, ties, line fallback and radius bytes',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-wandering-'));
 try {
  const cpp=path.join(dir,'probe.cpp'),binary=path.join(dir,'probe');
  fs.writeFileSync(cpp,`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraCampaignWanderingRule.h'))}
#include <cassert>
#include <algorithm>
using namespace era_campaign_wandering;
constexpr int size=9;
// Independent original FindWay relaxation and MakeWay scans. The production
// implementation uses a priority queue; compare every source/target pair.
Step original(Point source,Point target,const std::array<bool,size*size>& free){
 int way[size+2][size+2];std::fill(&way[0][0],&way[0][0]+(size+2)*(size+2),-1);
 for(int x=0;x<size;++x)for(int y=0;y<size;++y)if(free[y*size+x])way[x+1][y+1]=0;
 way[source.x+1][source.y+1]=0;way[target.x+1][target.y+1]=1;
 if(source==target)return {3,source};
 bool change;do{change=false;for(int x=1;x<=size;++x)for(int y=1;y<=size;++y)if(way[x][y]>0)
  for(int dx=-1;dx<=1;++dx)for(int dy=-1;dy<=1;++dy){if((!dx&&!dy)||way[x+dx][y+dy]==-1)continue;int value=way[x][y]+(dx&&dy?3:2);if(way[x+dx][y+dy]==0||value<way[x+dx][y+dy]){way[x+dx][y+dy]=value;change=true;}}
 }while(change);
 if(way[source.x+1][source.y+1]<=0)return {};
 int steps[size+2][size+2]{};int x=source.x+1,y=source.y+1,count=1;
 do{int value=way[x][y],nx=x,ny=y;for(int dx=-1;dx<=1;++dx)for(int dy=-1;dy<=1;++dy){if((!dx&&!dy)||way[x+dx][y+dy]<=0)continue;if(way[x+dx][y+dy]<value){value=way[x+dx][y+dy];nx=x+dx;ny=y+dy;}}assert(nx!=x||ny!=y);x=nx;y=ny;steps[x][y]=count++;}while(x!=target.x+1||y!=target.y+1);
 const int code=steps[target.x+1][target.y+1]==1?2:1;
 for(auto [dx,dy]:std::array<std::pair<int,int>,8>{{{1,0},{1,-1},{1,1},{0,-1},{0,1},{-1,0},{-1,-1},{-1,1}}})if(steps[source.x+1+dx][source.y+1+dy])return {code,{source.x+dx,source.y+dy,source.z}};
 assert(false);return {};
}
int main(){
 assert(byte(-1)==255&&byte(256)==0&&byte(266)==10);
 assert((line({4,2,0},{0,0,0})==std::vector<Point>{{0,0,0},{1,0,0},{2,1,0},{3,1,0},{4,2,0}}));
 assert((line({0,0,0},{2,4,0})==std::vector<Point>{{2,4,0},{2,3,0},{1,2,0},{1,1,0},{0,0,0}}));
 std::uint32_t seed=358;for(int sample=0;sample<6;++sample){
  std::array<bool,size*size> free;for(auto &&cell:free){seed=seed*1664525u+1013904223u;cell=(seed>>29)!=0;}
  const auto available=[&](Point p){return free[p.y*size+p.x];};
  for(int s=0;s<size*size;++s)for(int d=0;d<size*size;++d){Point source{s%size,s/size,0},target{d%size,d/size,0};const auto expected=original(source,target,free),actual=findStep(size,size,source,target,available);
   if(expected.code){assert(actual.code==expected.code);assert(actual.next==expected.next);}
   else {assert(actual.code==0||actual.code>=4);}
  }
 }
 std::array<bool,size*size> blocked{};auto unavailable=[&](Point p){return blocked[p.y*size+p.x];};
 // FindWay forces its target usable, even for the line fallback. Movement
 // itself must reject this occupied proposed destination, as WoMoMove does.
 const auto enclosed=findStep(size,size,{4,4,0},{8,8,0},unavailable);assert(enclosed.code==5&&enclosed.next==Point({5,5,0}));
 const auto otherLevel=findStep(size,size,{4,4,0},{4,4,1},unavailable);assert(otherLevel.code==0);
}`);
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined',cpp,'-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 assert(true);
});
