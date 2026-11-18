#include "Global.h"
#include "era/EraCampaignJson.h"
#include "era/EraCampaignExecutor.h"
#include "era/EraCampaignDialogs.h"
#include <cassert>
using namespace era_campaign;
Operand number(int n){Operand o;o.kind=Kind::Number;o.number=n;return o;}
Operand cell(int n){Operand o;o.kind=Kind::Variable;o.space='z';o.index=std::make_shared<Operand>(number(n));return o;}
Operand text(std::string s){Operand o;o.kind=Kind::String;o.text=std::move(s);return o;}
Command command(std::string receiver,std::vector<Operand> selectors,std::string code,std::vector<Operand> args={})
{Command c;c.receiver=std::move(receiver);c.selectors=std::move(selectors);c.operations.push_back({std::move(code),std::move(args)});return c;}
Command assign(int n,std::string s){return command("VR",{cell(n)},"S",{text(std::move(s))});}
Command message(std::string s){return command("IF",{},"M",{text(std::move(s))});}
Trigger handler(std::string receiver,int id,std::vector<Command> commands){Trigger t;t.receiver=std::move(receiver);t.selectors={number(id)};t.commands=std::move(commands);return t;}
struct Recorder:Host
{
 std::vector<std::string> messages;
 Step execute(const Command&,const Operation&o,State&s,const Context&c)override
 {auto line=readText(o.args.at(0),s,c);messages.push_back(line);return line=="CHILD child"||line=="EVENT PAUSE"?Step::Suspend:Step::Continue;}
 std::int32_t random(std::int32_t,bool)override{return 0;}
};
template<class F>void rejects(F f){bool failed=false;try{f();}catch(const std::runtime_error&){failed=true;}assert(failed);}
int main()
{
 Context context;Recorder host;Program p;p.sha256="local-z-scope";p.era3IntegerCalls=true;p.era3StringLocals=true;
 p.initializers={assign(-1,"initializer"),command("FU",{number(10)},"P"),message("INIT %Z-1 global %Z1")};
 p.blocks={handler("FU",10,{message("ENTRY [%Z-1]"),assign(-1,"parent"),assign(1,"global"),command("FU",{number(11)},"P"),message("PARENT %Z-1"),command("FU",{number(12)},"P"),message("EARLY %Z-1")}),
 handler("FU",10,{message("HANDLER %Z-1")}),
 handler("FU",11,{assign(-1,"child"),message("CHILD %Z-1"),command("FU",{number(13)},"P"),message("EMPTY %Z-1")}),
 handler("FU",12,{assign(-1,"discarded"),command("FU",{},"E"),message("unreachable")}),
 handler("OB",17,{message("EVENT [%Z-1]"),assign(-1,"event"),message("EVENT PAUSE")}),handler("OB",17,{message("EVENT HANDLER %Z-1")})};
 State state;Executor first(p,state,context,host);first.initialize();assert(!first.run());
 assert(state.frames.size()==3&&state.frames[0].z.at(-1)=="initializer"&&state.frames[1].z.at(-1)=="parent"&&state.frames[2].z.at(-1)=="child");
 const auto saved=VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::writeState(state);
 state=VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readState(saved);
 assert(VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::writeState(state)==saved);
 Executor resumed(p,state,context,host);assert(resumed.run());assert(state.initialized&&state.frames.size()==1);
 assert(state.frames[0].z.at(-1)=="initializer"&&state.z.at(1)=="global");
 assert((host.messages==std::vector<std::string>{"ENTRY []","CHILD child","EMPTY child","PARENT parent","EARLY parent","HANDLER parent","INIT initializer global global"}));
 resumed.dispatch("OB",{17});assert(!resumed.run());assert(state.frames[0].z.at(-1)=="event");
 const auto pendingEvent=VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::writeState(state);
 state=VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readState(pendingEvent);
 Executor eventResume(p,state,context,host);assert(eventResume.run());assert(state.frames[0].z.at(-1)=="initializer");
 assert(host.messages[7]=="EVENT []"&&host.messages[8]=="EVENT PAUSE"&&host.messages[9]=="EVENT HANDLER event");
 // Invalid indices and unadmitted encodings/lengths fail without touching the bank.
 assert(localString(std::string(511,'a')).size()==511);
 rejects([&]{writeText(cell(-11),state,context,"bad");});rejects([&]{readText(cell(0),state,context);});
 rejects([&]{writeText(cell(-1),state,context,std::string(512,'a'));});
 rejects([&]{writeText(cell(-1),state,context,"caf\xc3\xa9");});rejects([&]{writeText(cell(-1),state,context,std::string("a\0b",3));});
 assert(state.frames[0].z.at(-1)=="initializer");
 // Historical programs keep their original shared negative-z storage.
 Program old;old.sha256="legacy-z";old.initializers={assign(-1,"legacy")};State legacy;Executor oldExecutor(old,legacy,context,host);oldExecutor.initialize();assert(oldExecutor.run());assert(legacy.z.at(-1)=="legacy"&&!legacy.era3StringLocals);
 assert(VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::writeState(legacy)["stringLocals"].isNull());
 auto corrupt=saved;corrupt["stringLocals"].String()="unknown";rejects([&]{VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readState(corrupt);});
 corrupt=pendingEvent;corrupt["continuations"].Vector()[0].Struct().erase("savedLocalStrings");rejects([&]{VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readState(corrupt);});
 corrupt=saved;corrupt["frames"].Vector().pop_back();rejects([&]{VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readState(corrupt);});
 JsonNode ast;ast["schemaVersion"].Integer()=6;ast["contract"].String()="source-campaign-erm-ast-v6";ast["sha256"].String()="v6";ast["source"].String()="probe";ast["functionArguments"].String()="era3-integers";ast["stringLocals"].String()="era3-z-ascii";ast["initializers"].Vector();ast["blocks"].Vector();
 assert(VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast).era3StringLocals);
 ast["functionMetadata"].String()="era3-integers";assert(VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast).era3FunctionMetadata);
 ast["schemaVersion"].Integer()=5;ast["contract"].String()="source-campaign-erm-ast-v5";rejects([&]{VCMI_LIB_WRAP_NAMESPACE(era_campaign_json)::readProgram(ast);});
 // Native receivers pass integer string-cell indices as well as z operands.
 State cells;cells.era3StringLocals=true;cells.z[-1]="stale global";
 writeStringCell(cells,-1,"Title");writeStringCell(cells,-2,"First");writeStringCell(cells,-3,"Second");
 assert(readStringCell(cells,-1)=="Title"&&readText(cell(-1),cells,context)=="Title");
 assert(cells.z.at(-1)=="stale global"&&readStringCell(cells,0).empty());
 JsonNode definitions;VCMI_LIB_WRAP_NAMESPACE(era_campaign_dialogs)::Dialogs dialogs(definitions,cells,context);
 assert(dialogs.execute({"M",{number(-1)}})["text"].String()=="Title");
 const auto list=dialogs.execute({"G",{number(0),number(945),number(0),number(-1),number(-2),number(-3)}});
 assert(list["text"].String()=="Title"&&list["choices"].Vector()[0]["label"].String()=="First"&&list["choices"].Vector()[1]["label"].String()=="Second");
 dialogs.execute({"B",{number(1),number(-3),number(1)}});
 assert(dialogs.execute({"P",{number(1)}})["pictures"].Vector()[0]["file"].String()=="Second");
 cells.era3StringLocals=false;assert(readStringCell(cells,-1)=="stale global");
}
