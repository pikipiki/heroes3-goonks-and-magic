#include "Global.h"
#include "era/EraCampaignJson.h"
#include "era/EraCampaignRuntime.h"
#include "era/EraCampaignMetadata.h"
#include "era/EraCampaignDialogs.h"
#include "era/EraCampaignPictures.h"
#include <limits>
using namespace era_campaign;
using namespace era_campaign_json;

struct QueryHost final:Host
{
 int shown=0;
 Step execute(const Command&,const Operation&op,State&,const Context&)override
 {if(op.code!="M")throw std::runtime_error("Unexpected receiver in codec test");++shown;return Step::Suspend;}
 int32_t random(int32_t maximum,bool)override{return maximum;}
};
template<class F>void rejects(F && function)
{bool threw=false;try{function();}catch(const std::runtime_error&){threw=true;}assert(threw);}

int main()
{
 State state;state.programSha256="codec-program";state.initializing=true;state.selectedHero=106;
 state.flags[9]=true;state.v[500]=INT32_MIN;state.z[200]="Question;\n{important}";
 state.w[106][55]=10;state.fast['k']=42;
 state.disabledBlocks[0]=true;state.previousDisabledBlocks[0]=false;
 Operand alias;alias.kind=Kind::Variable;alias.space='v';alias.index=std::make_shared<Operand>();alias.index->kind=Kind::Number;alias.index->number=500;
 state.macros["counter"]=alias;state.frames[0].y[1]=99;
 Frame child;child.x[16]=3;child.y[2]=4;state.frames.push_back(child);
 Continuation call;call.programSha256=state.programSha256;call.command=2;call.operation=1;
 call.commandConditionAccepted=true;call.blocks={0,2};call.blockCursor=1;call.localFrame=true;
 call.loop=true;call.loopEnd=12;call.loopStep=2;call.initialX[1]=7;
 alias.access=Access::Write;call.returnTargets={alias};state.continuations.push_back(call);
 const auto encoded=writeState(state);
 assert(writeState(readState(encoded))==encoded);
 auto broken=encoded;broken["frames"].Vector().clear();rejects([&]{readState(broken);});
 broken=encoded;broken["v"].Vector().push_back(broken["v"].Vector().front());rejects([&]{readState(broken);});
 rejects([]{integer(JsonNode(std::numeric_limits<double>::quiet_NaN()));});
 rejects([]{integer(JsonNode(std::numeric_limits<double>::infinity()));});
 rejects([]{integer(JsonNode(2147483648.0));});
 rejects([]{integer(JsonNode(0.5));});
 rejects([]{readState(JsonNode(42));});
 rejects([]{readProgram(JsonNode("wrong shape"));});
 broken=encoded;broken["continuations"].Vector()[0]=JsonNode(1);rejects([&]{readState(broken);});
 assert(integer(JsonNode(INT32_MIN))==INT32_MIN);

 // Exercise the public production entry point and the real JsonNode codec.
 JsonNode ast;ast["schemaVersion"].Integer()=1;ast["contract"].String()="source-campaign-erm-ast-v1";
 ast["sha256"].String()="dialog-program";ast["source"].String()="codec-conformance";
 ast["initializers"].Vector();ast["blocks"].Vector();
 JsonNode trigger;trigger["receiver"].String()="LE";trigger["kind"].String()="trigger";
 trigger["selectors"].Vector();trigger["conditions"].Vector();trigger["commands"].Vector();
 JsonNode command;command["receiver"].String()="IF";command["selectors"].Vector();command["conditions"].Vector();
 JsonNode operation;operation["code"].String()="M";operation["args"].Vector();
 Operand text;text.kind=Kind::String;text.text="Do not show twice";operation["args"].Vector().push_back(writeOperand(text));
 command["operations"].Vector().push_back(operation);trigger["commands"].Vector().push_back(command);ast["blocks"].Vector().push_back(trigger);
 QueryHost host;Context context;era_campaign_runtime::Invocation invocation;
 auto result=era_campaign_runtime::execute(ast,JsonNode(),context,host,invocation);assert(result.complete&&host.shown==0);
 invocation.kind=era_campaign_runtime::InvocationKind::Dispatch;invocation.receiver="LE";
 result=era_campaign_runtime::execute(ast,result.state,context,host,invocation);assert(!result.complete&&host.shown==1);
 const auto saved=result.state;
 invocation.kind=era_campaign_runtime::InvocationKind::Resume;
 result=era_campaign_runtime::execute(ast,saved,context,host,invocation);assert(result.complete&&host.shown==1);
 assert(readState(result.state).continuations.empty());
 rejects([&]{era_campaign_runtime::execute(ast,result.state,context,host,invocation);});
 broken=saved;broken["programSha256"].String()="different-map";
 rejects([&]{era_campaign_runtime::execute(ast,broken,context,host,invocation);});
 invocation.kind=era_campaign_runtime::InvocationKind::Dispatch;
 rejects([&]{era_campaign_runtime::execute(ast,JsonNode(),context,host,invocation);});
 // The actual engine JsonNode holds extended dialog definitions and replies.
 State dialogue;Context dc;JsonNode definitions;era_campaign_dialogs::Dialogs dialogs(definitions,dialogue,dc);
 const auto n=[](int value){Operand result;result.kind=Kind::Number;result.number=value;return result;};
 dialogue.z[243]="Name the secret";dialogue.z[244]="Your answer";
 Operation define;define.code="D";define.args.resize(16);define.args[0]=n(14);define.args[1]=n(243);define.args[2]=n(244);
 assert(dialogs.execute(define).isNull());auto prompt=dialogs.execute({"E",{n(500),n(14)}});
 assert(prompt["text"].String()=="Name the secret"&&prompt["inputLabel"].String()=="Your answer");
 // A save/reload keeps the whole prompt, independently of a live UI widget.
 const JsonNode promptCopy(prompt);dialogs.reply(promptCopy,0,"Wake of Gods");assert(dialogue.z[1]=="Wake of Gods"&&dialogue.v[500]==0);
 rejects([&]{dialogs.reply(promptCopy,1,"Wrong default");});
 dialogs.reply(promptCopy,-1,"ignored");assert(dialogue.v[500]==-1);
 dialogue.z[245]="Answer %V500";define.args[12]=n(245);dialogs.execute(define);
 dialogs.execute({"F",{n(14),n(0),n(0),n(0),n(0),n(0)}});assert(!dialogs.execute({"E",{n(500),n(14)}})["canCancel"].Bool());
 dialogs.execute(define);auto redefined=dialogs.execute({"E",{n(500),n(14)}});
 assert(redefined["canCancel"].Bool()&&redefined["choices"].Vector()[0]["hint"].String()=="Answer -1");
 dialogue.z[121]="Choose a skill";dialogue.z[122]="Attack";dialogue.z[123]="Defense";dialogue.z[124]="Power";
 auto radio=dialogs.execute({"G",{n(1),n(122),n(0),n(121),n(122),n(123),n(124)}});
 dialogs.reply(radio,4,"");assert(dialogue.v[122]==4);rejects([&]{dialogs.reply(radio,3,"");});rejects([&]{dialogs.reply(radio,8,"");});
 auto checklist=dialogs.execute({"G",{n(0),n(265),n(0),n(121),n(122),n(123),n(124)}});
 dialogs.reply(checklist,5,"");assert(dialogue.v[265]==5);rejects([&]{dialogs.reply(checklist,16,"");});
 Operand question;question.kind=Kind::String;question.text="Take %V265?";
 auto pictures=dialogs.execute({"Q",{n(2),n(6),n(2000),n(21),n(95),n(7),question}});
 assert(pictures["pictures"].Vector().size()==2&&pictures["text"].String()=="Take 5?");
 dialogs.reply(pictures,0,"");assert(!dialogue.flags[2]);dialogs.reply(pictures,1,"");assert(dialogue.flags[2]);
 rejects([&]{dialogs.reply(pictures,2,"");});

 const auto creatureId=[](int source){return CreatureID(source+1000);};
 const auto packed=era_campaign_pictures::component(21,5*65536+6,creatureId);assert(packed->subType.as<CreatureID>().getNum()==1006&&packed->value==5);
 const auto skill=era_campaign_pictures::component(20,15,creatureId);assert(skill->subType.as<SecondarySkill>().getNum()==4&&skill->value==1);
 const auto daily=era_campaign_pictures::component(6,-200,creatureId);assert(daily->type==ComponentType::RESOURCE_PER_DAY&&daily->value==200);
 const auto loss=era_campaign_pictures::component(36,-100200,creatureId);assert(loss->type==ComponentType::RESOURCE&&loss->value==-200);
 assert(!era_campaign_pictures::component(-1,-1,creatureId));
 JsonNode header;header["name"].String()="Exact source header";
 for(int i=0;i<3;++i){JsonNode s;s["map"].String()="map"+std::to_string(i);if(i!=1)s["preconditions"].Vector()={JsonNode(i==0?3:2)};header["scenarios"].Vector().push_back(s);}
 const JsonNode original(header);JsonNode config;config["schemaVersion"].Integer()=1;config["contract"].String()="source-campaign-metadata-v1";config["enabled"].Bool()=true;
 JsonNode rule;rule["expectedHeader"]=original;
 for(int i:{0,2}){JsonNode patch;patch["index"].Integer()=i;patch["map"]=original["scenarios"].Vector()[i]["map"];patch["originalRequires"]=original["scenarios"].Vector()[i]["preconditions"];patch["requires"].Vector()={JsonNode(i==0?2:1)};rule["patches"].Vector().push_back(patch);}
 config["rules"].Vector().push_back(rule);
 assert(era_campaign_metadata::apply(header,config));assert(header["scenarios"].Vector()[0]["preconditions"].Vector()[0].Integer()==2);assert(header["scenarios"].Vector()[2]["preconditions"].Vector()[0].Integer()==1);
 assert(!era_campaign_metadata::apply(header,config));JsonNode custom(original);custom["name"].String()="Another campaign";const JsonNode customCopy(custom);assert(!era_campaign_metadata::apply(custom,config)&&custom==customCopy);
 JsonNode bad(config),unchanged(original);bad["rules"].Vector()[0]["patches"].Vector()[1]["requires"].Vector()={JsonNode(2)};
 rejects([&]{era_campaign_metadata::apply(unchanged,bad);});assert(unchanged==original);
 bad=config;bad["rules"].Vector()[0]["patches"].Vector()[1]["requires"].Vector()={JsonNode(1.5)};
 rejects([&]{era_campaign_metadata::apply(unchanged,bad);});assert(unchanged==original);
 bad=config;bad["enabled"].Bool()=false;assert(!era_campaign_metadata::apply(unchanged,bad)&&unchanged==original);

}
