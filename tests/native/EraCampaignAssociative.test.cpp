#include "../../work/vcmi-wasm/lib/era/EraCampaignExecutor.h"
#include <cassert>
using namespace era_campaign;
Operand named(char space,std::string name,Access access=Access::Read)
{Operand p;p.kind=Kind::Named;p.space=space;p.name=std::move(name);p.access=access;return p;}
Operand number(int value){Operand p;p.kind=Kind::Number;p.number=value;return p;}
Operand literal(std::string value){Operand p;p.kind=Kind::String;p.text=std::move(value);return p;}
Operand modified(Operand p,std::string modifier){p.access=Access::Relative;p.modifier=std::move(modifier);return p;}
Command command(std::string receiver,std::vector<Operand> selectors,std::string code,std::vector<Operand> args)
{Command c;c.receiver=std::move(receiver);c.selectors=std::move(selectors);c.operations={{std::move(code),std::move(args)}};return c;}
struct RejectHost final:Host
{
 int calls=0;
 Step execute(const Command&,const Operation&,State&,const Context&)override{++calls;throw std::runtime_error("Unbound native hook");}
 std::int32_t random(std::int32_t maximum,bool)override{return maximum;}
};
template<class F>void rejects(F function){bool failed=false;try{function();}catch(const std::runtime_error&){failed=true;}assert(failed);}
int main()
{
 Context context;State state;
 assert(readNumber(named('i',"absent"),state,context)==0&&readText(named('s',"absent"),state,context).empty());
 assert(state.associative.empty()); // Reads do not create cells.
 rejects([&]{writeNumber(named('i',"\xc3\xa9"),state,context,1);});
 writeNumber(named('i',"Same"),state,context,35);
 writeText(named('s',"Same"),state,context,"35% literal");
 writeNumber(named('i',"same"),state,context,58);
 assert(readNumber(named('i',"Same"),state,context)==58&&readNumber(named('i',"same"),state,context)==58);
 assert(readText(named('s',"Same"),state,context)=="35% literal");
 assert(state.associative.size()==1&&state.associative.begin()->first=="Same");
 assert(formatText("%I(Same)/%S(Same)/%i(same)",state,context)=="58/35% literal/58");
 state.associative["literal"].text="%I(Same)";assert(formatText("%S(literal)",state,context)=="%I(Same)");
 state.v[1]=7;writeNumber(named('i',"hero_%V1"),state,context,99);
 assert(readNumber(named('i',"hero_7"),state,context)==99);
 auto negative=named('i',"Same");negative.negate=true;
 assert(readNumber(negative,state,context)==-58);rejects([&]{writeNumber(negative,state,context,1);});
 // Source numeric arrays have no alias to the associative store.
 state.v[35]=1000;assert(readNumber(named('i',"Same"),state,context)==58);
 // The same source cell can carry a numeric and a string value simultaneously.
 RejectHost host;Program program;program.sha256="source-associative";
 program.initializers={
  command("SN",{},"W",{literal("Adept_Level_Global_Value"),number(10)}),
  command("VR",{named('i',"Adept_Level_Global_Value")},"+",{number(5)}),
  command("VR",{named('s',"Adept_Level_Global_Value")},"S",{literal("Adept")}),
  command("SN",{},"W",{literal("Adept_Level_Global_Value"),named('i',"copied",Access::Write)}),
  command("SN",{},"W",{literal("Adept_Level_Global_Value"),named('s',"copied",Access::Write)}),
  command("SN",{},"W",{literal("Adept_Level_Global_Value"),modified(number(2),"*")}),
  command("SN",{},"W",{literal("Adept_Level_Global_Value"),modified(literal(" class"),"&")})
 };
 Executor vm(program,state,context,host);vm.initialize();assert(vm.run()&&host.calls==0);
 assert(state.associative.at("Adept_Level_Global_Value").integer==30&&state.associative.at("Adept_Level_Global_Value").text=="Adept class");
 assert(state.associative.at("copied").integer==15&&state.associative.at("copied").text=="Adept");
 // Missing query returns defaults without creating the requested source name.
 associative(command("SN",{},"W",{}),{"W",{literal("missing"),named('i',"out",Access::Write)}},state,context);
 assert(state.associative.at("out").integer==0&&!state.associative.count("missing"));
 const auto apply=[&](Operand arg){associative(command("SN",{},"W",{}),{"W",{literal("numeric"),std::move(arg)}},state,context);};
 apply(number(0x7fffffff));apply(modified(number(1),"+"));assert(state.associative.at("numeric").integer==INT32_MIN);
 apply(modified(number(1),"-"));assert(state.associative.at("numeric").integer==INT32_MAX);
 apply(number(23));apply(modified(number(3),":"));assert(state.associative.at("numeric").integer==7);
 apply(modified(number(4),"%"));assert(state.associative.at("numeric").integer==3);
 apply(modified(number(2),"|"));assert(state.associative.at("numeric").integer==2); // Actual native AND.
 apply(modified(number(2),"~"));assert(state.associative.at("numeric").integer==0);
 apply(number(-1));apply(modified(number(1),">>"));assert(state.associative.at("numeric").integer==INT32_MAX);
 apply(number(1));apply(modified(number(1000),"<<"));assert(state.associative.at("numeric").integer==16); // Clamp100, x86 mask31.
 rejects([&]{apply(modified(number(0),":"));});
 rejects([&]{apply(modified(number(1),"&"));});
 rejects([&]{apply(modified(literal("bad"),"+"));});
 associative(command("SN",{},"W",{}),{"W",{literal("copied")}},state,context);assert(!state.associative.count("copied"));
 // Numeric variable names stringify just as SysUtils.IntToStr in AdvErm.
 associative(command("SN",{},"W",{}),{"W",{number(-123),number(7)}},state,context);assert(state.associative.at("-123").integer==7);
 rejects([&]{associative(command("SN",{},"W",{}),{"E",{}},state,context);});
 Program hook;hook.sha256="unsupported-hook";hook.initializers={command("SN",{},"E",{number(4621680)})};State hs;Executor guarded(hook,hs,context,host);guarded.initialize();rejects([&]{guarded.run();});assert(host.calls==1);
 associative(command("SN",{},"W",{}),{"W",{}},state,context);assert(state.associative.empty()&&state.v[35]==1000);
}
