/* Original ResetERM persistent ranges, scoped to one native campaign. GPL-2.0-or-later. */
#pragma once
#include "EraCampaignProgram.h"
namespace era_campaign
{
inline bool persistentIndex(char space,std::int32_t index)
{
 if(space=='v')return index>=501&&index<=1000;
 if(space=='z')return index>=301&&index<=500;
 if(space=='w')return index>=51&&index<=200;
 if(space=='f')return index>=501&&index<996;
 return false;
}
inline State persistentVariables(const State & source)
{
 State target;
 for(const auto & [index,value]:source.v)if(persistentIndex('v',index))target.v[index]=value;
 for(const auto & [index,value]:source.z)if(persistentIndex('z',index))target.z[index]=value;
 for(const auto & [index,value]:source.flags)if(persistentIndex('f',index))target.flags[index]=value;
 for(const auto & [hero,values]:source.w)if(hero>=0&&hero<156)
  for(const auto & [index,value]:values)if(persistentIndex('w',index))target.w[hero][index]=value;
 // Original macro names belong to variable slots. Only constant references to
 // persistent global slots cross maps; function locals and dynamic aliases do not.
 for(const auto & [name,value]:source.macros)
  if(value.kind==Kind::Variable&&value.index&&value.index->kind==Kind::Number&&persistentIndex(value.space,value.index->number))
   target.macros[name]=value;
 return target;
}
}
