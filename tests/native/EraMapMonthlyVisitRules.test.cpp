#include "../../work/vcmi-wasm/lib/era/EraMapMonthlyVisitRules.h"
#include <cassert>
#include <set>
#include <map>
#include <climits>
int main()
{
    using namespace era_bridge::map_rules;
    const std::set<int> eligible{4,23,32,41,47,51,61,100,102,107};
    // Check the complete object namespace, including unknown/custom objects.
    for(int type=-1;type<1000;++type)assert(monthlyVisitType(type)==(eligible.count(type)!=0));
    for(int day=-40;day<10000;++day)
    {
        const bool expected=day>=29&&((day-1)/7)%4==0&&(day-1)%7==0;
        assert(monthlyVisitDay(day)==expected);
    }
    assert(!monthlyVisitDay(INT_MIN));assert(!monthlyVisitDay(INT_MAX));
    std::map<int,int> types;std::set<int> visits,keep;int id=400;
    for(int type=0;type<300;++type)
    {
        // Multiple instances, arbitrary native IDs, not object type as ID.
        for(int instance=0;instance<3;++instance)
        {types[id]=type;visits.insert(id);if(!eligible.count(type))keep.insert(id);++id;}
    }
    visits.insert(-5);visits.insert(9999);keep.insert(-5);keep.insert(9999);
    clearMonthlyVisits(visits,[&](int object){const auto it=types.find(object);return it==types.end()?-1:it->second;});
    assert(visits==keep);
    clearMonthlyVisits(visits,[&](int object){const auto it=types.find(object);return it==types.end()?-1:it->second;});
    assert(visits==keep);
}
