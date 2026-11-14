/* Resumable interpreter for the pinned original campaign programs. GPL-2.0-or-later. */
#pragma once
#include "EraCampaignProgram.h"
#include <algorithm>
#include <cctype>
#include <limits>

namespace era_campaign
{
enum class Step { Continue, Suspend };
struct Host
{
 virtual ~Host()=default;
 virtual Step execute(const Command&,const Operation&,State&,const Context&)=0;
 virtual std::int32_t random(std::int32_t maximum,bool timeBased)=0;
};
class Executor
{
 const Program & program;
 State & state;
 const Context & context;
 Host & host;
 static constexpr auto allBlocks=static_cast<std::size_t>(-1);
 static void arity(const Operation&op,std::size_t count)
 {if(op.args.size()!=count)throw std::runtime_error("Invalid campaign "+op.code+" argument count");}
 std::vector<std::size_t> matching(const std::string&receiver,const std::vector<std::int32_t>&selectors,bool post,std::size_t visible)const
 {
  std::vector<std::size_t> found;
  for(std::size_t i=0;i<std::min(visible,program.blocks.size());++i)
  {
   const auto & b=program.blocks[i];
   if(b.receiver!=receiver||b.post!=post||b.selectors.size()!=selectors.size())continue;
   bool same=true;for(std::size_t n=0;n<selectors.size();++n)if(readNumber(b.selectors[n],state,context)!=selectors[n]){same=false;break;}
   if(same)found.push_back(i);
  }
  return found;
 }
 void finishFrame(bool allowLoop=true)
 {
  auto & call=state.continuations.back();
  if(call.loop&&allowLoop)
  {
   auto & frame=state.frames.back();const auto current=lookup(frame.x,16);
   const auto wide=std::int64_t(current)+call.loopStep;
   if(wide>=INT32_MIN&&wide<=INT32_MAX&&((call.loopStep>0&&wide<=call.loopEnd)||(call.loopStep<0&&wide>=call.loopEnd)))
   {
    for(std::size_t i=0;i<call.returnTargets.size();++i)
     if(call.returnTargets[i].access==Access::Compare&&call.returnTargets[i].comparison=="=")
      call.initialX[static_cast<std::int32_t>(i+1)]=lookup(frame.x,static_cast<std::int32_t>(i+1));
    frame.x=call.initialX;frame.x[16]=static_cast<std::int32_t>(wide);frame.y.clear();
    call.blockCursor=0;call.command=0;call.operation=0;call.commandConditionAccepted=false;return;
   }
  }
  const auto outputs=call.returnTargets;
  const auto returned=state.frames.back().x;
  const bool initializer=call.initializer,local=call.localFrame;
  state.continuations.pop_back();
  if(local){if(state.frames.size()<2)throw std::runtime_error("Campaign call frame underflow");state.frames.pop_back();}
  for(std::size_t i=0;i<outputs.size();++i)if(outputs[i].access==Access::Write)
   writeNumber(outputs[i],state,context,lookup(returned,static_cast<std::int32_t>(i+1)));
  if(initializer){state.initializing=false;state.initialized=true;}
 }
 void callFunction(std::int32_t function,const std::vector<Operand>&arguments,std::size_t visible,bool loop=false,std::int32_t start=0,std::int32_t end=0,std::int32_t step=1)
 {
  if(arguments.size()>(loop?15u:16u))throw std::runtime_error("Too many campaign function parameters");
  if(loop&&(step==0||(step>0&&start>end)||(step<0&&start<end)))
  {if(step==0)throw std::runtime_error("Zero campaign loop step");return;}
  auto blocks=matching("FU",{function},false,visible);
  if(blocks.empty())return; // Original instruction calls cannot see later declarations.
  if(state.frames.size()>=128)throw std::runtime_error("Campaign call nesting limit");
  Frame frame;frame.x=state.frames.back().x;
  for(std::size_t i=0;i<arguments.size();++i)
  {
   const auto & argument=resolveMacro(arguments[i],state);
   // Original ?vN passes the destination index as x#, then copies back on return.
   if(argument.access==Access::Write)
   {
    if(argument.kind!=Kind::Variable||!argument.index)throw std::runtime_error("Invalid campaign function output");
    frame.x[static_cast<std::int32_t>(i+1)]=readNumber(*argument.index,state,context);
   }
   else frame.x[static_cast<std::int32_t>(i+1)]=readNumber(argument,state,context);
  }
  Continuation call;call.programSha256=program.sha256;call.blocks=std::move(blocks);call.visibleBlocks=visible;
  call.localFrame=true;call.loop=loop;call.loopEnd=end;call.loopStep=step;call.initialX=frame.x;call.returnTargets=arguments;
  if(loop)frame.x[16]=start;
  state.frames.push_back(std::move(frame));state.continuations.push_back(std::move(call));
 }
 void variable(const Command&command,const Operation&op)
 {
  if(command.selectors.size()!=1)throw std::runtime_error("Campaign VR needs one variable");
  auto destination=resolveMacro(command.selectors[0],state);
  const bool text=destination.kind==Kind::Variable&&destination.space=='z';
  if(op.code=="C")
  {
   if(!destination.index||text||op.args.size()>16)throw std::runtime_error("Invalid campaign VR:C");
   auto index=readNumber(*destination.index,state,context);
   for(const auto & argument:op.args)
   {
    destination.index=std::make_shared<Operand>();destination.index->kind=Kind::Number;destination.index->number=index;index=add(index,1);
    if(argument.access==Access::Write)writeNumber(argument,state,context,readNumber(destination,state,context));
    else writeNumber(destination,state,context,readNumber(argument,state,context));
   }
   return;
  }
  if(text)
  {
   if(op.code=="S"||op.code=="+")
   {
    arity(op,1);auto source=resolveMacro(op.args[0],state);
    if(source.kind==Kind::Number){Operand index=source;source.kind=Kind::Variable;source.space='z';source.index=std::make_shared<Operand>(index);}
    auto value=readText(source,state,context);if(op.code=="+")value=readText(destination,state,context)+value;
    writeText(destination,state,context,std::move(value));return;
   }
   if(op.code=="H")
   {
    arity(op,1);const auto value=readText(destination,state,context);
    writeFlag(readNumber(op.args[0],state,context),state,std::any_of(value.begin(),value.end(),[](unsigned char c){return !std::isspace(c);}));return;
   }
   throw std::runtime_error("Unimplemented campaign text operation "+op.code);
  }
  arity(op,1);auto value=readNumber(destination,state,context),right=readNumber(op.args[0],state,context);
  if(op.code=="S")value=right;
  else if(op.code=="+")value=add(value,right);
  else if(op.code=="-")value=sub(value,right);
  else if(op.code=="*")value=multiply(value,right);
  else if(op.code==":")value=divide(value,right);
  else if(op.code=="%")value=remainder(value,right);
  else if(op.code=="&")value=signed32(std::uint32_t(value)&std::uint32_t(right));
  else if(op.code=="|")value=signed32(std::uint32_t(value)|std::uint32_t(right));
  else if(op.code=="X")value=signed32(std::uint32_t(value)^std::uint32_t(right));
  else if(op.code=="R"||op.code=="T")
  {if(right<0)throw std::runtime_error("Negative campaign random bound");const auto draw=host.random(right,op.code=="T");if(draw<0||draw>right)throw std::runtime_error("Campaign random generator out of range");value=add(value,draw);}
  else throw std::runtime_error("Unimplemented campaign numeric operation "+op.code);
  writeNumber(destination,state,context,value);
 }
public:
 Executor(const Program&p,State&s,const Context&c,Host&h):program(p),state(s),context(c),host(h)
 {
  if(state.programSha256.empty())state.programSha256=program.sha256;
  if(state.programSha256!=program.sha256)throw std::runtime_error("Campaign state/program mismatch");
  if(state.frames.empty())throw std::runtime_error("Missing campaign execution frame");
  for(const auto & call:state.continuations)
   if(call.programSha256!=program.sha256)throw std::runtime_error("Campaign continuation/program mismatch");
 }
 void initialize()
 {
  if(state.initialized||state.initializing)return;
  if(!state.continuations.empty())throw std::runtime_error("Campaign initialization during an event");
  state.initializing=true;Continuation call;call.programSha256=program.sha256;call.initializer=true;state.continuations.push_back(std::move(call));
 }
 void dispatch(const std::string&receiver,const std::vector<std::int32_t>&selectors={},bool post=false)
 {
  if(!state.continuations.empty())throw std::runtime_error("Campaign event entered while a dialog is suspended");
  Continuation call;call.programSha256=program.sha256;call.blocks=matching(receiver,selectors,post,allBlocks);state.continuations.push_back(std::move(call));
 }
 bool dispatchAny(const std::string & receiver,const std::vector<std::vector<std::int32_t>> & selectors,bool post=false)
 {
  if(!state.continuations.empty())throw std::runtime_error("Campaign event entered while a dialog is suspended");
  std::vector<std::size_t> blocks;
  for(const auto & candidate:selectors){const auto found=matching(receiver,candidate,post,allBlocks);blocks.insert(blocks.end(),found.begin(),found.end());}
  std::sort(blocks.begin(),blocks.end());blocks.erase(std::unique(blocks.begin(),blocks.end()),blocks.end());
  if(blocks.empty())return false;
  Continuation call;call.programSha256=program.sha256;call.blocks=std::move(blocks);state.continuations.push_back(std::move(call));return true;
 }
 bool run(std::size_t budget=1000000)
 {
  while(!state.continuations.empty())
  {
   if(!budget--)throw std::runtime_error("Campaign instruction budget exceeded");
   auto & call=state.continuations.back();
   if(!call.initializer&&call.blockCursor>=call.blocks.size()){finishFrame();continue;}
   if(!call.initializer&&call.blocks[call.blockCursor]>=program.blocks.size())throw std::runtime_error("Invalid saved campaign block");
   const auto * block=call.initializer?nullptr:&program.blocks[call.blocks[call.blockCursor]];
   if(block&&call.command==0&&call.operation==0&&!call.commandConditionAccepted&&
      (lookup(state.disabledBlocks,static_cast<std::int32_t>(call.blocks[call.blockCursor]))||!accepts(block->conditions,state,context)))
   {call.blockCursor++;continue;}
   const auto & commands=call.initializer?program.initializers:block->commands;
   if(call.command>=commands.size())
   {
    if(call.initializer){finishFrame();continue;}
    call.blockCursor++;call.command=0;call.operation=0;call.commandConditionAccepted=false;continue;
   }
   const auto & command=commands[call.command];
   if(!call.commandConditionAccepted)
   {
    if(!accepts(command.conditions,state,context)){call.command++;call.operation=0;continue;}
    call.commandConditionAccepted=true;
   }
   if(call.operation>=command.operations.size()){call.command++;call.operation=0;call.commandConditionAccepted=false;continue;}
   const auto & op=command.operations[call.operation++];
   const auto visible=call.initializer?command.visibleBlocks:call.visibleBlocks;
   if(op.code=="Z"&&command.receiver=="LE")
   {
    // h3era.exe 0x740BF2: Z4/5 enable/disable every matching trigger;
    // Z6 toggles and Z7 restores the previously stored disabled state.
    arity(op,1);const auto mode=readNumber(op.args[0],state,context);
    if(mode<4||mode>7)throw std::runtime_error("Unsupported campaign trigger Z mode");
    std::vector<std::int32_t> selectors;for(const auto & value:command.selectors)selectors.push_back(readNumber(value,state,context));
    for(const auto index:matching(command.receiver,selectors,false,allBlocks))
    {
     const auto key=static_cast<std::int32_t>(index);const bool old=lookup(state.disabledBlocks,key);
     const bool previous=lookup(state.previousDisabledBlocks,key);
     state.previousDisabledBlocks[key]=old;
     state.disabledBlocks[key]=mode==4?false:mode==5?true:mode==6?!old:previous;
    }
    continue;
   }
   if(command.receiver=="VR"){variable(command,op);continue;}
   if(command.receiver=="MC")
   {
    if(op.code!="S"||command.selectors.size()!=1)throw std::runtime_error("Unimplemented campaign macro operation");
    for(const auto & arg:op.args){if(arg.kind!=Kind::Macro)throw std::runtime_error("Invalid campaign macro name");state.macros[arg.name]=command.selectors[0];}continue;
   }
   if(command.receiver=="FU"||command.receiver=="DO")
   {
    if(op.code=="E"&&command.receiver=="FU"){arity(op,0);finishFrame();continue;}
    if(op.code!="P")throw std::runtime_error("Unimplemented campaign function operation "+op.code);
    const auto count=command.receiver=="DO"?4u:1u;if(command.selectors.size()!=count)throw std::runtime_error("Invalid campaign function selector");
    const auto function=readNumber(command.selectors[0],state,context);
    if(count==1)callFunction(function,op.args,visible);
    else callFunction(function,op.args,visible,true,readNumber(command.selectors[1],state,context),readNumber(command.selectors[2],state,context),readNumber(command.selectors[3],state,context));
    continue;
   }
   if(command.receiver=="IF"&&(op.code=="V"||op.code=="A"||op.code=="R"||op.code=="S"||op.code=="W"))
   {
    arity(op,op.code=="V"?2:1);const auto first=readNumber(op.args[0],state,context);
    if(op.code=="V")writeFlag(first,state,readNumber(op.args[1],state,context)!=0);
    else if(op.code=="W")state.selectedHero=first==-1?context.currentHero:first;
    else
    {
     // These are ten decimal mask digits, not a flag number or a bitmask.
     // The leftmost digit controls flag1; R/S leave zero digits unchanged.
     if(first<0)throw std::runtime_error("Invalid campaign flag mask");
     auto digits=std::to_string(first);
     if(digits.size()>10)throw std::runtime_error("Invalid campaign flag mask");
     digits=std::string(10-digits.size(),'0')+digits;
     for(const auto digit:digits)if(digit!='0'&&digit!='1')throw std::runtime_error("Invalid campaign flag mask digit");
     for(std::size_t i=0;i<digits.size();++i)
      if(op.code=="A"||digits[i]=='1')writeFlag(static_cast<std::int32_t>(i+1),state,op.code=="A"?digits[i]=='1':op.code=="S");
    }
    continue;
   }
   if(host.execute(command,op,state,context)==Step::Suspend)return false;
  }
  return true;
 }
};
}
