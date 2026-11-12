#pragma once
#include <vector>
#include <algorithm>
#include <cstdlib>
namespace era_bridge
{
// Source5A4740 axial scan followed by REVERSE iteration at5A4B93.
// Advanced K#59 is the only admitted Berserk contract (radius1).
inline std::vector<int> sourceAreaHexesReverse(int center,int radius,bool includeCenter)
{
    std::vector<int> result;
    if(center<0 || center>=187 || radius<0 || radius>2)return result;
    const int row=center/17,col=center%17;
    const int u=col-(row+1)/2,v=col+row/2;
    for(int a=u-radius;a<=u+radius;++a)
        for(int b=v-radius;b<=v+radius;++b)
        {
            const int du=u-a,dv=v-b;
            const int distance=(du<0)==(dv<0)?std::max(std::abs(du),std::abs(dv)):std::abs(du)+std::abs(dv);
            if(distance>radius || (!includeCenter && distance==0))continue;
            const int x=(a+b+1)/2,y=b-a;
            if(x>0 && x<16 && y>=0 && y<11)result.push_back(17*y+x);
        }
    std::reverse(result.begin(),result.end());
    return result;
}
inline std::vector<int> sourceAdvancedBerserkHexes(int center)
{return sourceAreaHexesReverse(center,1,true);}
}
