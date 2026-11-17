/* ERA named variables and SN:W associative memory. GPL-2.0-or-later.
 * Reference: era-kernel AdvErm.pas TAssocVar / SN W / SaveAssocMem;
 * Erm.pas GetErmParamValue/SetErmParamValue i/s forms.
 */
#pragma once
#include "EraCampaignProgram.h"
namespace era_campaign
{
inline void associative(const Command & command,const Operation & operation,State & state,const Context & context)
{
 if(!command.selectors.empty()||operation.code!="W"||operation.args.size()>2)
  throw std::runtime_error("Unsupported ERA associative memory operation");
 const auto & args=operation.args;
 if(args.empty()){state.associative.clear();return;}
 if(args[0].access!=Access::Read)throw std::runtime_error("Associative variable name must be a value");
 const auto name=associativeName(textOperand(args[0],state)?readText(args[0],state,context):std::to_string(readNumber(args[0],state,context)));
 if(args.size()==1){state.associative.erase(name);return;}
 const auto & value=args[1];
 const bool text=textOperand(value,state);
 if(value.access==Access::Write)
 {
  const auto previous=lookup(state.associative,name);
  if(text)writeText(value,state,context,previous.text);
  else writeNumber(value,state,context,previous.integer);
  return;
 }
 if(value.access==Access::Compare)throw std::runtime_error("Associative comparison is not yet source-validated");
 if(text)
 {
  if(value.access==Access::Relative&&value.modifier!="&")throw std::runtime_error("Unsupported associative string modifier");
  const auto assigned=readText(value,state,context);
  auto & destination=state.associative[name].text;
  destination=value.access==Access::Relative?destination+assigned:assigned;
 }
 else
 {
  const auto assigned=readNumber(value,state,context);
  auto & destination=state.associative[name].integer;
  if(value.access==Access::Read){destination=assigned;return;}
  const auto & modifier=value.modifier;
  if(modifier.empty()||modifier=="+")destination=add(destination,assigned);
  else if(modifier=="-")destination=sub(destination,assigned);
  else if(modifier=="*")destination=multiply(destination,assigned);
  else if(modifier==":")destination=divide(destination,assigned);
  else if(modifier=="%")destination=remainder(destination,assigned);
  // Upstream MODIFIER_OR is named misleadingly: ApplyIntParam uses AND.
  else if(modifier=="|")destination=signed32(std::uint32_t(destination)&std::uint32_t(assigned));
  else if(modifier=="~")destination=signed32(std::uint32_t(destination)&~std::uint32_t(assigned));
  else if(modifier=="<<"||modifier==">>")
  {
   const auto clamped=assigned<0?0:assigned>100?100:assigned;
   const auto shift=static_cast<unsigned>(clamped)&31u;
   destination=signed32(modifier=="<<"?std::uint32_t(destination)<<shift:std::uint32_t(destination)>>shift);
  }
  else throw std::runtime_error("Unsupported associative numeric modifier");
 }
}
}
