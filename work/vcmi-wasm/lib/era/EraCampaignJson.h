/* Pinned source campaign AST/state codec; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignProgram.h"
#include "../json/JsonNode.h"
#include <limits>
#include <cmath>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_json
{
inline std::int32_t integer(const JsonNode&node)
{if(!node.isNumber())throw std::runtime_error("Invalid campaign integer");const auto value=node.Float();if(!std::isfinite(value)||value<INT32_MIN||value>INT32_MAX||std::trunc(value)!=value)throw std::runtime_error("Invalid campaign integer");return static_cast<std::int32_t>(value);}
inline std::string string(const JsonNode&node)
{if(!node.isString())throw std::runtime_error("Invalid campaign string");return node.String();}
inline const JsonVector & array(const JsonNode&node)
{if(!node.isVector())throw std::runtime_error("Invalid campaign array");return node.Vector();}
inline bool boolean(const JsonNode&node)
{if(!node.isBool())throw std::runtime_error("Invalid campaign boolean");return node.Bool();}
inline const JsonNode & object(const JsonNode&node)
{if(!node.isStruct())throw std::runtime_error("Invalid campaign object");return node;}
inline era_campaign::Operand readOperand(const JsonNode&node,int depth=0)
{
 using namespace era_campaign;if(depth>=32||!node.isStruct())throw std::runtime_error("Invalid campaign operand");Operand value;
 const auto kind=string(node["kind"]),access=string(node["access"]);
 if(kind=="default")value.kind=Kind::Default;else if(kind=="number")value.kind=Kind::Number;else if(kind=="string")value.kind=Kind::String;else if(kind=="macro")value.kind=Kind::Macro;else if(kind=="day")value.kind=Kind::Day;else if(kind=="variable")value.kind=Kind::Variable;else if(kind=="fast")value.kind=Kind::Fast;else if(kind=="named")value.kind=Kind::Named;else throw std::runtime_error("Unknown campaign operand kind");
 if(access=="read")value.access=Access::Read;else if(access=="write")value.access=Access::Write;else if(access=="compare")value.access=Access::Compare;else if(access=="relative")value.access=Access::Relative;else throw std::runtime_error("Unknown campaign operand access");
 if(!node["comparison"].isNull())value.comparison=string(node["comparison"]);
 if(!node["modifier"].isNull())value.modifier=string(node["modifier"]);
 if(value.kind==Kind::Number)value.number=integer(node["number"]);
 if(value.kind==Kind::String)value.text=string(node["text"]);
 if(value.kind==Kind::Macro||value.kind==Kind::Fast||value.kind==Kind::Named)value.name=string(node["name"]);
 if(value.kind==Kind::Named){const auto space=string(node["space"]);if(space!="i"&&space!="s")throw std::runtime_error("Invalid associative variable space");value.space=space[0];}
 if(value.kind==Kind::Day)value.offset=integer(node["offset"]);
 if(value.kind==Kind::Variable){const auto space=string(node["space"]);if(space.size()!=1)throw std::runtime_error("Invalid campaign variable space");value.space=space[0];value.index=std::make_shared<Operand>(readOperand(node["index"],depth+1));}
 if(!node["negate"].isNull())value.negate=boolean(node["negate"]);
 return value;
}
inline JsonNode writeOperand(const era_campaign::Operand&value)
{
 using namespace era_campaign;JsonNode node;
 const char *kind="default",*access="read";
 switch(value.kind){case Kind::Default:break;case Kind::Number:kind="number";break;case Kind::String:kind="string";break;case Kind::Macro:kind="macro";break;case Kind::Day:kind="day";break;case Kind::Variable:kind="variable";break;case Kind::Fast:kind="fast";break;case Kind::Named:kind="named";break;}
 switch(value.access){case Access::Read:break;case Access::Write:access="write";break;case Access::Compare:access="compare";break;case Access::Relative:access="relative";break;}
 node["kind"].String()=kind;node["access"].String()=access;
 if(!value.comparison.empty())node["comparison"].String()=value.comparison;
 if(!value.modifier.empty())node["modifier"].String()=value.modifier;
 if(value.kind==Kind::Number)node["number"].Integer()=value.number;
 if(value.kind==Kind::String)node["text"].String()=value.text;
 if(value.kind==Kind::Macro||value.kind==Kind::Fast||value.kind==Kind::Named)node["name"].String()=value.name;
 if(value.kind==Kind::Named)node["space"].String()=std::string(1,value.space);
 if(value.kind==Kind::Day)node["offset"].Integer()=value.offset;
 if(value.kind==Kind::Variable){if(!value.index)throw std::runtime_error("Missing campaign index");node["space"].String()=std::string(1,value.space);node["index"]=writeOperand(*value.index);}
 if(value.negate)node["negate"].Bool()=true;
 return node;
}
inline std::vector<era_campaign::Operand> readOperands(const JsonNode&node)
{std::vector<era_campaign::Operand> values;for(const auto&item:array(node))values.push_back(readOperand(item));return values;}
inline era_campaign::Conditions readConditions(const JsonNode&node)
{
 era_campaign::Conditions result;
 for(const auto&group:array(node)){std::vector<era_campaign::Predicate> predicates;for(const auto&item:array(object(group)["any"])){object(item);era_campaign::Predicate predicate;if(!item["flag"].isNull()){predicate.isFlag=true;predicate.flag=integer(item["flag"]);predicate.expected=boolean(item["expected"]);}else{predicate.left=readOperand(item["left"]);predicate.right=readOperand(item["right"]);predicate.comparison=string(item["comparison"]);}predicates.push_back(std::move(predicate));}result.push_back(std::move(predicates));}
 return result;
}
inline era_campaign::Command readCommand(const JsonNode&node)
{
 object(node);era_campaign::Command command;command.receiver=string(node["receiver"]);command.selectors=readOperands(node["selectors"]);command.conditions=readConditions(node["conditions"]);if(!node["visibleBlocks"].isNull()){const auto visible=integer(node["visibleBlocks"]);if(visible<0)throw std::runtime_error("Invalid campaign function visibility");command.visibleBlocks=static_cast<std::size_t>(visible);}
 for(const auto&item:array(node["operations"])){object(item);era_campaign::Operation operation;operation.code=string(item["code"]);operation.args=readOperands(item["args"]);command.operations.push_back(std::move(operation));}
 return command;
}
inline era_campaign::Program readProgram(const JsonNode&node)
{
 object(node);const auto version=integer(node["schemaVersion"]);
 if((version<1||version>5)||string(node["contract"])!="source-campaign-erm-ast-v"+std::to_string(version))throw std::runtime_error("Unknown source campaign AST contract");
 era_campaign::Program program;program.sha256=string(node["sha256"]);program.source=string(node["source"]);
 if(version>=4){if(string(node["functionArguments"])!="era3-integers")throw std::runtime_error("Unknown ERA3 function argument contract");program.era3IntegerCalls=true;}
 else if(!node["functionArguments"].isNull())throw std::runtime_error("ERA3 function arguments require source AST v4");
 if(version==5){if(string(node["functionMetadata"])!="era3-integers")throw std::runtime_error("Unknown ERA3 function metadata contract");program.era3FunctionMetadata=true;}
 else if(!node["functionMetadata"].isNull())throw std::runtime_error("ERA3 function metadata requires source AST v5");
 for(const auto&item:array(node["initializers"]))program.initializers.push_back(readCommand(item));
 for(const auto&item:array(node["blocks"])){object(item);era_campaign::Trigger trigger;trigger.receiver=string(item["receiver"]);const auto kind=string(item["kind"]);if(kind!="trigger"&&kind!="post-trigger")throw std::runtime_error("Unknown campaign trigger kind");trigger.post=kind=="post-trigger";trigger.selectors=readOperands(item["selectors"]);trigger.conditions=readConditions(item["conditions"]);for(const auto&command:array(item["commands"]))trigger.commands.push_back(readCommand(command));program.blocks.push_back(std::move(trigger));}
 const auto supported=[version,&program](const auto & commands)
 {
  for(const auto & command:commands)
  {
   if(program.era3IntegerCalls)
   {
    if(command.receiver=="DO")throw std::runtime_error("ERA3 DO calls are not admitted");
    if(command.receiver=="FU")for(const auto & operation:command.operations)if(operation.code=="P")
     for(const auto & argument:operation.args)if(!era_campaign::era3IntegerArgument(argument))
      throw std::runtime_error("ERA3 FU:P requires admitted integer arguments");
    if(command.receiver=="FU")for(const auto & operation:command.operations)if(operation.code=="A"||operation.code=="S")
    {
     if(!program.era3FunctionMetadata)throw std::runtime_error("ERA3 function metadata requires source AST v5");
     era_campaign::validateEra3FunctionMetadata(command,operation);
    }
   }
   if(version<2&&command.receiver=="__flow")throw std::runtime_error("Structured control requires source AST v2");
   if(version<3&&command.receiver=="VR")for(const auto & operation:command.operations)
    if(operation.code=="F")throw std::runtime_error("Integer bounds require source AST v3");
  }
 };
 supported(program.initializers);for(const auto & block:program.blocks)supported(block.commands);
 return program;
}
template<class V,class Write> JsonNode writeMap(const std::map<std::int32_t,V>&values,Write write)
{JsonNode node;node.Vector();for(const auto&entry:values){JsonNode item;item.Vector();JsonNode key;key.Integer()=entry.first;item.Vector().push_back(key);item.Vector().push_back(write(entry.second));node.Vector().push_back(item);}return node;}
template<class V,class Read> std::map<std::int32_t,V> readMap(const JsonNode&node,Read read)
{std::map<std::int32_t,V> result;for(const auto&item:array(node)){const auto&pair=array(item);if(pair.size()!=2||!result.emplace(integer(pair[0]),read(pair[1])).second)throw std::runtime_error("Invalid/duplicate campaign map entry");}return result;}
inline JsonNode writeInteger(std::int32_t value){JsonNode node;node.Integer()=value;return node;}
inline JsonNode writeString(const std::string&value){JsonNode node;node.String()=value;return node;}
inline JsonNode writeBool(bool value){JsonNode node;node.Bool()=value;return node;}
inline JsonNode writeQuickVars(const std::map<char,std::int32_t> & values)
{
 JsonNode node;node.Vector();for(const auto & entry:values){JsonNode item;item["name"].String()=std::string(1,entry.first);item["value"].Integer()=entry.second;node.Vector().push_back(std::move(item));}return node;
}
inline std::map<char,std::int32_t> readQuickVars(const JsonNode & node)
{
 std::map<char,std::int32_t> values;for(const auto & item:array(node)){object(item);const auto name=string(item["name"]);if(name.size()!=1||!values.emplace(name[0],integer(item["value"])).second)throw std::runtime_error("Invalid campaign fast variable");}return values;
}
inline JsonNode writeState(const era_campaign::State&state)
{
 JsonNode node;node["schemaVersion"].Integer()=1;node["programSha256"].String()=state.programSha256;node["initialized"].Bool()=state.initialized;node["initializing"].Bool()=state.initializing;node["selectedHero"].Integer()=state.selectedHero;
 node["flags"]=writeMap<bool>(state.flags,writeBool);node["v"]=writeMap<std::int32_t>(state.v,writeInteger);node["z"]=writeMap<std::string>(state.z,writeString);
 node["disabledBlocks"]=writeMap<bool>(state.disabledBlocks,writeBool);node["previousDisabledBlocks"]=writeMap<bool>(state.previousDisabledBlocks,writeBool);
 node["w"]=writeMap<std::map<std::int32_t,std::int32_t>>(state.w,[](const auto&values){return writeMap<std::int32_t>(values,writeInteger);});
 node["fast"]=writeQuickVars(state.fast);
 node["macros"].Vector();for(const auto&entry:state.macros){JsonNode item;item["name"].String()=entry.first;item["operand"]=writeOperand(entry.second);node["macros"].Vector().push_back(item);}
 node["associative"].Vector();for(const auto & entry:state.associative){JsonNode item;item["name"].String()=entry.first;item["integer"].Integer()=entry.second.integer;item["text"].String()=entry.second.text;node["associative"].Vector().push_back(item);}
 node["frames"].Vector();for(const auto&frame:state.frames){JsonNode item;item["x"]=writeMap<std::int32_t>(frame.x,writeInteger);item["y"]=writeMap<std::int32_t>(frame.y,writeInteger);node["frames"].Vector().push_back(item);}
 node["continuations"].Vector();for(const auto&continuation:state.continuations){JsonNode item;item["programSha256"].String()=continuation.programSha256;item["block"].Integer()=static_cast<std::int64_t>(continuation.block);item["command"].Integer()=static_cast<std::int64_t>(continuation.command);item["operation"].Integer()=static_cast<std::int64_t>(continuation.operation);item["commandConditionAccepted"].Bool()=continuation.commandConditionAccepted;item["pendingFlag"].Integer()=continuation.pendingFlag;item["blocks"].Vector();for(const auto block:continuation.blocks)item["blocks"].Vector().push_back(writeInteger(static_cast<std::int32_t>(block)));item["blockCursor"].Integer()=static_cast<std::int64_t>(continuation.blockCursor);item["visibleBlocks"].Integer()=continuation.visibleBlocks==static_cast<std::size_t>(-1)?-1:static_cast<std::int64_t>(continuation.visibleBlocks);item["initializer"].Bool()=continuation.initializer;item["loop"].Bool()=continuation.loop;item["localFrame"].Bool()=continuation.localFrame;item["returnTargets"].Vector();for(const auto&target:continuation.returnTargets)item["returnTargets"].Vector().push_back(writeOperand(target));item["loopEnd"].Integer()=continuation.loopEnd;item["loopStep"].Integer()=continuation.loopStep;item["initialX"]=writeMap<std::int32_t>(continuation.initialX,writeInteger);if(continuation.restoreQuickVars)item["savedQuickVars"]=writeQuickVars(continuation.savedQuickVars);node["continuations"].Vector().push_back(item);}
 return node;
}
inline era_campaign::State readState(const JsonNode&node)
{
 era_campaign::State state;if(node.isNull())return state;object(node);if(integer(node["schemaVersion"])!=1)throw std::runtime_error("Unknown campaign state contract");state.programSha256=string(node["programSha256"]);state.initialized=boolean(node["initialized"]);state.initializing=boolean(node["initializing"]);state.selectedHero=integer(node["selectedHero"]);
 state.flags=readMap<bool>(node["flags"],boolean);state.v=readMap<std::int32_t>(node["v"],integer);state.z=readMap<std::string>(node["z"],string);state.w=readMap<std::map<std::int32_t,std::int32_t>>(node["w"],[](const JsonNode&values){return readMap<std::int32_t>(values,integer);});
 if(!node["disabledBlocks"].isNull())state.disabledBlocks=readMap<bool>(node["disabledBlocks"],boolean);
 if(!node["previousDisabledBlocks"].isNull())state.previousDisabledBlocks=readMap<bool>(node["previousDisabledBlocks"],boolean);
 state.fast=readQuickVars(node["fast"]);
 for(const auto&item:array(node["macros"]))if(!state.macros.emplace(string(object(item)["name"]),readOperand(object(item)["operand"])).second)throw std::runtime_error("Duplicate campaign macro");
 if(!node["associative"].isNull())
 {
  std::map<std::string,bool,era_campaign::AssociativeCompare> names;
  for(const auto & item:array(node["associative"]))
  {
   object(item);const auto name=era_campaign::associativeName(string(item["name"]));
   if(!names.emplace(name,true).second)throw std::runtime_error("Duplicate associative campaign variable");
   era_campaign::AssociativeValue value;value.integer=integer(item["integer"]);value.text=string(item["text"]);
   // Original AdvErm.LoadAssocMem discards zero/empty cells after loading.
   if(value.integer!=0||!value.text.empty())state.associative.emplace(name,std::move(value));
  }
 }
 state.frames.clear();for(const auto&item:array(node["frames"])){object(item);era_campaign::Frame frame;frame.x=readMap<std::int32_t>(item["x"],integer);frame.y=readMap<std::int32_t>(item["y"],integer);state.frames.push_back(std::move(frame));}if(state.frames.empty())throw std::runtime_error("Missing campaign execution frame");
 for(const auto&item:array(node["continuations"])){object(item);era_campaign::Continuation continuation;continuation.programSha256=string(item["programSha256"]);const auto block=integer(item["block"]),command=integer(item["command"]),operation=integer(item["operation"]);if(block<0||command<0||operation<0)throw std::runtime_error("Negative campaign program counter");continuation.block=static_cast<std::size_t>(block);continuation.command=static_cast<std::size_t>(command);continuation.operation=static_cast<std::size_t>(operation);continuation.commandConditionAccepted=boolean(item["commandConditionAccepted"]);continuation.pendingFlag=integer(item["pendingFlag"]);for(const auto&index:array(item["blocks"])){const auto value=integer(index);if(value<0)throw std::runtime_error("Invalid campaign block index");continuation.blocks.push_back(static_cast<std::size_t>(value));}const auto cursor=integer(item["blockCursor"]),visible=integer(item["visibleBlocks"]);if(cursor<0||visible< -1)throw std::runtime_error("Invalid campaign continuation cursor");continuation.blockCursor=static_cast<std::size_t>(cursor);continuation.visibleBlocks=visible<0?static_cast<std::size_t>(-1):static_cast<std::size_t>(visible);continuation.initializer=boolean(item["initializer"]);continuation.loop=boolean(item["loop"]);continuation.localFrame=boolean(item["localFrame"]);for(const auto&target:array(item["returnTargets"]))continuation.returnTargets.push_back(readOperand(target));continuation.loopEnd=integer(item["loopEnd"]);continuation.loopStep=integer(item["loopStep"]);continuation.initialX=readMap<std::int32_t>(item["initialX"],integer);if(!item["savedQuickVars"].isNull()){if(!continuation.localFrame||continuation.loop)throw std::runtime_error("Invalid ERA3 quick-register scope");continuation.restoreQuickVars=true;continuation.savedQuickVars=readQuickVars(item["savedQuickVars"]);}state.continuations.push_back(std::move(continuation));}
 return state;
}
}
VCMI_LIB_NAMESPACE_END
