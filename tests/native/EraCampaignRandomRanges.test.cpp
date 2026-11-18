#include "Global.h"
#include "era/EraCampaignExecutor.h"
#include "era/EraCampaignJson.h"
#include <cassert>
using namespace era_campaign;
Operand num(int value){Operand o;o.kind=Kind::Number;o.number=value;return o;}
Operand var(int index){Operand o;o.kind=Kind::Variable;o.space='v';o.index=std::make_shared<Operand>(num(index));return o;}
Command command(int index,std::string code,std::vector<Operand> args)
{Command c;c.receiver="VR";c.selectors={var(index)};c.operations.push_back({std::move(code),std::move(args)});return c;}
template<class F>void rejects(F f){bool failed=false;try{f();}catch(const std::runtime_error&){failed=true;}assert(failed);}
struct RangeHost:Host
{
 std::vector<std::pair<int,int>> ranges;std::vector<bool> legacyModes;
 Step execute(const Command&,const Operation&,State&,const Context&)override{throw std::runtime_error("Unexpected host command");}
 std::int32_t random(std::int32_t maximum,bool mode)override{legacyModes.push_back(mode);return maximum;}
 std::int32_t randomRange(std::int32_t low,std::int32_t high)override{ranges.emplace_back(low,high);return ranges.size()%2?low:high;}
};
int main()
{
 RangeHost host;Context context;State state;Program p;p.sha256="era3-ranges";p.era3IntegerCalls=true;p.era3RandomRanges=true;
 p.initializers={command(1,"S",{num(100)}),command(1,"R",{num(999),num(1),num(12)}),command(2,"R",{num(-88),num(-12),num(-1)}),
 command(3,"R",{num(0),num(INT32_MIN),num(INT32_MAX)}),command(4,"R",{num(0),num(0),num(INT32_MAX)}),
 command(5,"R",{num(0),num(INT32_MAX),num(INT32_MIN)}),command(6,"R",{num(0),num(-7),num(-7)}),
 command(7,"S",{num(100)}),command(7,"R",{num(0)}),command(7,"R",{num(-12)}),command(7,"R",{num(5)})};
 Executor e(p,state,context,host);e.initialize();assert(e.run());
 assert(state.v.at(1)==1&&state.v.at(2)==-1&&state.v.at(3)==INT32_MIN&&state.v.at(4)==INT32_MAX&&state.v.at(5)==INT32_MAX&&state.v.at(6)==-7);
 assert(state.v.at(7)==100);
 assert((host.ranges==std::vector<std::pair<int,int>>{{1,12},{-12,-1},{INT32_MIN,INT32_MAX},{0,INT32_MAX},{0,5}}));
 assert(host.legacyModes.empty());
 Program old;old.sha256="old-additive-random";old.initializers={command(1,"S",{num(5)}),command(1,"R",{num(2)}),command(1,"T",{num(3)})};
 State legacy;Executor classic(old,legacy,context,host);classic.initialize();assert(classic.run());assert(legacy.v.at(1)==10);
 assert((host.legacyModes==std::vector<bool>{false,true}));
 auto invalid=command(1,"R",{num(0),num(1),num(12)});invalid.operations[0].args[1].access=Access::Write;
 rejects([&]{validateEra3RandomRange(invalid,invalid.operations[0]);});
 invalid=command(1,"R",{num(0),num(1),num(12)});invalid.selectors={num(4)};rejects([&]{validateEra3RandomRange(invalid,invalid.operations[0]);});
 Program unmarked=p;unmarked.sha256="unmarked";unmarked.era3RandomRanges=false;State missing;
 Executor unsupported(unmarked,missing,context,host);unsupported.initialize();rejects([&]{unsupported.run();});
 // The default host adapter handles signed narrow intervals without overflow.
 assert(host.Host::randomRange(-12,-1)==-1);rejects([&]{host.Host::randomRange(INT32_MIN,INT32_MAX);});
 JsonNode ast;ast["schemaVersion"].Integer()=7;ast["contract"].String()="source-campaign-erm-ast-v7";ast["sha256"].String()="ast7";ast["source"].String()="test";ast["functionArguments"].String()="era3-integers";ast["randomRanges"].String()="era3-integers";ast["initializers"].Vector();ast["blocks"].Vector();
 assert(VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast).era3RandomRanges);
 ast["stringLocals"].String()="era3-z-ascii";ast["functionMetadata"].String()="era3-integers";
 const auto combined=VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast);assert(combined.era3RandomRanges&&combined.era3StringLocals&&combined.era3FunctionMetadata);
 ast["schemaVersion"].Integer()=6;ast["contract"].String()="source-campaign-erm-ast-v6";rejects([&]{VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast);});
}
