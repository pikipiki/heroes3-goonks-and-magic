/* Source-bound original WoG campaign primitives; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <functional>
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>
namespace era_campaign
{
enum class Kind { Default, Number, String, Macro, Day, Variable, Fast };
enum class Access { Read, Write, Compare, Relative };
struct Operand
{
 Kind kind=Kind::Default;
 Access access=Access::Read;
 std::int32_t number=0;
 std::int32_t offset=0;
 char space=0;
 std::string name,text,comparison;
 std::shared_ptr<Operand> index;
 bool negate=false;
};
struct Predicate
{
 bool isFlag=false;
 std::int32_t flag=0;
 bool expected=true;
 Operand left,right;
 std::string comparison;
};
using Conditions=std::vector<std::vector<Predicate>>; // AND of OR groups.
struct Operation { std::string code;std::vector<Operand> args; };
struct Command
{
 std::string receiver;
 std::vector<Operand> selectors;
 Conditions conditions;
 std::vector<Operation> operations;
 std::size_t visibleBlocks=static_cast<std::size_t>(-1);
};
struct Trigger
{
 std::string receiver;
 std::vector<Operand> selectors;
 Conditions conditions;
 std::vector<Command> commands;
 bool post=false;
};
struct Program
{
 std::string sha256,source;
 std::vector<Command> initializers;
 std::vector<Trigger> blocks;
};
struct Frame
{
 std::map<std::int32_t,std::int32_t> x,y;
};
struct Continuation
{
 std::string programSha256;
 std::size_t block=0,command=0,operation=0;
 // A resumed command must not reevaluate conditions changed by earlier ops.
 bool commandConditionAccepted=false;
 std::int32_t pendingFlag=0;
 std::vector<std::size_t> blocks;
 std::size_t blockCursor=0,visibleBlocks=static_cast<std::size_t>(-1);
 bool initializer=false,loop=false;
 bool localFrame=false;
 std::int32_t loopEnd=0,loopStep=1;
 std::map<std::int32_t,std::int32_t> initialX;
 std::vector<Operand> returnTargets;
};
struct State
{
 std::string programSha256;
 bool initialized=false,initializing=false;
 std::map<std::int32_t,bool> flags;
 std::map<std::int32_t,std::int32_t> v;
 std::map<std::int32_t,std::string> z;
 std::map<std::int32_t,std::map<std::int32_t,std::int32_t>> w;
 std::map<char,std::int32_t> fast;
 std::map<std::string,Operand> macros;
 std::map<std::int32_t,bool> disabledBlocks,previousDisabledBlocks;
 std::vector<Frame> frames{Frame{}};
 std::vector<Continuation> continuations;
 std::int32_t selectedHero=-1;
};
struct Context
{
 std::int32_t day=0;
 std::int32_t currentHero=-1;
 // System flags996..1000 are supplied by the current host event.
 // The host seeds ordinary v997..v1000 for each event; ERM may then modify them.
 std::function<bool(std::int32_t)> builtinFlag;
};
inline std::int32_t signed32(std::uint32_t value)
{return value<0x80000000u?static_cast<std::int32_t>(value):static_cast<std::int32_t>(std::int64_t(value)-0x100000000LL);}
inline std::int32_t add(std::int32_t a,std::int32_t b){return signed32(std::uint32_t(a)+std::uint32_t(b));}
inline std::int32_t sub(std::int32_t a,std::int32_t b){return signed32(std::uint32_t(a)-std::uint32_t(b));}
inline std::int32_t multiply(std::int32_t a,std::int32_t b){return signed32(std::uint32_t(a)*std::uint32_t(b));}
inline std::int32_t divide(std::int32_t a,std::int32_t b)
{
 if(b==0)throw std::runtime_error("Original campaign division by zero");
 if(a==INT32_MIN&&b==-1)throw std::runtime_error("Original campaign division overflow");
 return a/b;
}
inline std::int32_t remainder(std::int32_t a,std::int32_t b)
{
 if(b==0)throw std::runtime_error("Original campaign remainder by zero");
 if(a==INT32_MIN&&b==-1)return 0;
 return a%b;
}
template<class K,class V> V lookup(const std::map<K,V>&values,const K&key)
{const auto found=values.find(key);return found==values.end()?V{}:found->second;}
inline bool compare(std::int32_t left,const std::string&op,std::int32_t right)
{
 if(op=="=")return left==right;
 if(op=="<>")return left!=right;
 if(op==">")return left>right;
 if(op=="<")return left<right;
 if(op==">=")return left>=right;
 if(op=="<=")return left<=right;
 throw std::runtime_error("Unsupported source campaign comparison");
}
inline const Operand & resolveMacro(const Operand&operand,const State&state,int depth=0)
{
 if(operand.kind!=Kind::Macro)return operand;
 if(depth>=32)throw std::runtime_error("Cyclic source campaign macro");
 const auto found=state.macros.find(operand.name);
 if(found==state.macros.end())throw std::runtime_error("Unbound source campaign macro: "+operand.name);
 return resolveMacro(found->second,state,depth+1);
}
inline std::int32_t readNumber(const Operand&input,const State&state,const Context&context,int depth=0)
{
 if(depth>=32)throw std::runtime_error("Source campaign variable indirection limit");
 const auto&operand=resolveMacro(input,state);
 std::int32_t value=0;
 switch(operand.kind)
 {
 case Kind::Default:return 0;
 case Kind::Number:value=operand.number;break;
 case Kind::Day:value=add(context.day,operand.offset);break;
 case Kind::Fast:value=lookup(state.fast,operand.name.empty()?char{}:operand.name[0]);break;
 case Kind::Variable:
 {
  if(!operand.index)throw std::runtime_error("Missing source campaign variable index");
  const auto index=readNumber(*operand.index,state,context,depth+1);
  switch(operand.space)
  {
  case 'v':value=lookup(state.v,index);break;
  // In numeric receiver parameters zN identifies a text cell by its index.
  // Its contents are accessed only by the text receiver forms.
  case 'z':value=index;break;
  case 'x':case 'y':
   if(state.frames.empty())throw std::runtime_error("Missing source campaign local frame");
   value=operand.space=='x'?lookup(state.frames.back().x,index):lookup(state.frames.back().y,index);break;
  case 'w':
  {
   if(state.selectedHero<0)throw std::runtime_error("Source campaign hero variables need a selected hero");
   const auto hero=state.w.find(state.selectedHero);value=hero==state.w.end()?0:lookup(hero->second,index);break;
  }
  default:throw std::runtime_error("Non-numeric source campaign variable");
  }
  break;
 }
 default:throw std::runtime_error("Non-numeric source campaign operand");
 }
 return operand.negate?sub(0,value):value;
}
inline bool readFlag(std::int32_t flag,const State&state,const Context&context)
{return context.builtinFlag&&flag>=996&&flag<=1000?context.builtinFlag(flag):lookup(state.flags,flag);}
inline void writeFlag(std::int32_t flag,State&state,bool value)
{if(flag<1||flag>=996)throw std::runtime_error("Cannot overwrite source system flags");state.flags[flag]=value;}
inline std::string readText(const Operand&input,const State&state,const Context&context);
inline bool textOperand(const Operand & input,const State & state)
{
 const auto & operand=resolveMacro(input,state);
 return operand.kind==Kind::String||(operand.kind==Kind::Variable&&operand.space=='z');
}
inline std::string comparisonText(std::string value)
{
 // WoG's StrCmpExt compares case-insensitive words. Runs of space, CR,
 // LF and TAB separate words; other bytes remain significant.
 std::string result;bool separator=false;
 for(auto c:value)
 {
  if(c==' '||c=='\t'||c=='\r'||c=='\n'){separator=!result.empty();continue;}
  if(separator){result+=' ';separator=false;}
  const auto byte=static_cast<unsigned char>(c);
  result+=byte>='A'&&byte<='Z'?static_cast<char>(byte-'A'+'a'):c;
 }
 return result;
}
inline bool acceptsPredicate(const Predicate & predicate,const State & state,const Context & context)
{
 if(predicate.isFlag)return readFlag(predicate.flag,state,context)==predicate.expected;
 const bool leftText=textOperand(predicate.left,state),rightText=textOperand(predicate.right,state);
 if(leftText||rightText)
 {
  if(!leftText||!rightText)throw std::runtime_error("Mixed text/numeric campaign comparison");
  if(predicate.comparison!="="&&predicate.comparison!="<>")throw std::runtime_error("Unsupported campaign text comparison");
  const bool equal=comparisonText(readText(predicate.left,state,context))==comparisonText(readText(predicate.right,state,context));
  return predicate.comparison=="="?equal:!equal;
 }
 return compare(readNumber(predicate.left,state,context),predicate.comparison,readNumber(predicate.right,state,context));
}
inline bool accepts(const Conditions&conditions,const State&state,const Context&context)
{
 for(const auto&group:conditions)
 {
  bool any=false;
  for(const auto&p:group)
   if(acceptsPredicate(p,state,context)){any=true;break;}
  if(!any)return false;
 }
 return true;
}
inline void writeNumber(const Operand&input,State&state,const Context&context,std::int32_t value)
{
 const auto&operand=resolveMacro(input,state);
 if(operand.negate)throw std::runtime_error("Cannot assign a negated campaign variable");
 if(operand.kind==Kind::Fast){if(operand.name.size()!=1)throw std::runtime_error("Invalid fast campaign variable");state.fast[operand.name[0]]=value;return;}
 if(operand.kind!=Kind::Variable||!operand.index)throw std::runtime_error("Campaign destination is not a variable");
 const auto index=readNumber(*operand.index,state,context);
 switch(operand.space)
 {
 case 'v':state.v[index]=value;return;
 case 'x':case 'y':if(state.frames.empty())throw std::runtime_error("Missing source campaign local frame");(operand.space=='x'?state.frames.back().x:state.frames.back().y)[index]=value;return;
 case 'w':if(state.selectedHero<0)throw std::runtime_error("Campaign hero variables need a selected hero");state.w[state.selectedHero][index]=value;return;
 default:throw std::runtime_error("Non-numeric campaign destination");
 }
}
inline std::string formatText(const std::string & text,const State & state,const Context & context);
inline std::string readText(const Operand&input,const State&state,const Context&context)
{
 const auto&operand=resolveMacro(input,state);
 if(operand.kind==Kind::String)return formatText(operand.text,state,context);
 if(operand.kind==Kind::Variable&&operand.space=='z'&&operand.index)return lookup(state.z,readNumber(*operand.index,state,context));
 throw std::runtime_error("Non-text campaign operand");
}
inline void writeText(const Operand&input,State&state,const Context&context,std::string value)
{
 const auto&operand=resolveMacro(input,state);
 if(operand.kind!=Kind::Variable||operand.space!='z'||!operand.index)throw std::runtime_error("Non-text campaign destination");
 state.z[readNumber(*operand.index,state,context)]=std::move(value);
}
inline std::string formatText(const std::string & text,const State & state,const Context & context)
{
 std::string result;
 const auto append=[&](const Operand & operand)
 {
  const auto & value=resolveMacro(operand,state);
  // Substituted values are data, including a literal-valued alias in an old
  // save. Never recursively interpret their percent markers as new syntax.
  if(value.kind==Kind::String)result+=value.text;
  else result+=textOperand(value,state)?readText(value,state,context):std::to_string(readNumber(value,state,context));
 };
 for(std::size_t pos=0;pos<text.size();)
 {
  if(text[pos]!='%'||pos+1==text.size()){result+=text[pos++];continue;}
  const auto start=pos++;const char code=text[pos++];
  if(code=='%'){result+='%';continue;}
  if(code=='$')
  {
   const auto end=text.find('$',pos);if(end==std::string::npos){result+=text.substr(start);break;}
   Operand macro;macro.kind=Kind::Macro;macro.name=text.substr(pos,end-pos);append(macro);pos=end+1;continue;
  }
  if(code=='V'&&pos<text.size()&&text[pos]>='f'&&text[pos]<='t')
  {Operand fast;fast.kind=Kind::Fast;fast.name=text[pos++];append(fast);continue;}
  if(code!='F'&&code!='V'&&code!='W'&&code!='X'&&code!='Y'&&code!='Z'){result+=text.substr(start,pos-start);continue;}
  bool negative=false;if(pos<text.size()&&text[pos]=='-'){negative=true;++pos;}
  std::int64_t index=0;const auto digits=pos;
  while(pos<text.size()&&text[pos]>='0'&&text[pos]<='9')
  {index=index*10+(text[pos++]-'0');if(index>INT32_MAX)throw std::runtime_error("Campaign text variable index overflow");}
  if(pos==digits){result+=text.substr(start,pos-start);continue;}
  if(negative)index=-index;
  if(code=='F'){result+=readFlag(static_cast<std::int32_t>(index),state,context)?'1':'0';continue;}
  Operand variable;variable.kind=Kind::Variable;variable.space=static_cast<char>(code-'A'+'a');variable.index=std::make_shared<Operand>();variable.index->kind=Kind::Number;variable.index->number=static_cast<std::int32_t>(index);append(variable);
 }
 return result;
}

}
