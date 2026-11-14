#include "../../work/vcmi-wasm/lib/era/EraCampaignExecutor.h"
#include "../../work/vcmi-wasm/lib/era/EraCampaignObjectAccess.h"
#include <cassert>
#include <climits>
#include <vector>
using namespace era_campaign;
Operand num(int n){Operand p;p.kind=Kind::Number;p.number=n;return p;}
Operand var(char space,int index,Access access=Access::Read){Operand p;p.kind=Kind::Variable;p.space=space;p.index=std::make_shared<Operand>(num(index));p.access=access;return p;}
Command cmd(std::string receiver,std::vector<Operand> selectors,std::string operation,std::vector<Operand> args={})
{Command c;c.receiver=std::move(receiver);c.selectors=std::move(selectors);c.operations.push_back({std::move(operation),std::move(args)});return c;}
Trigger block(std::string receiver,std::vector<Operand> selectors,std::vector<Command> commands)
{Trigger t;t.receiver=std::move(receiver);t.selectors=std::move(selectors);t.commands=std::move(commands);return t;}
struct Recorder:Host
{
 int prompts=0,replies=0;
 Step execute(const Command&,const Operation&o,State&s,const Context&)override
 {
  if(o.code=="Prompt"){++prompts;s.flags[1]=false;return Step::Suspend;}
  if(o.code=="Reply"){++replies;++s.v[2];return Step::Continue;}
  throw std::runtime_error("Unexpected test host operation");
 }
 int32_t random(int32_t maximum,bool)override{return maximum;}
};
int main()
{
 Context context;Recorder host;
 // Original VCMI ERM_FU regression: output parameters and immediate FU:E.
 Program p;p.sha256="functions";
 p.blocks={block("LE",{num(1)},{cmd("VR",{var('v',1)},"S",{num(30)}),cmd("FU",{num(7)},"P",{num(33),var('v',1,Access::Write)})}),
  block("FU",{num(7)},{cmd("VR",{var('v',2)},"S",{var('x',2)}),cmd("VR",{var('x',2)},"S",{var('x',1)}),cmd("VR",{var('x',2)},"+",{num(10)}),cmd("FU",{},"E"),cmd("VR",{var('x',2)},"+",{num(1)})})};
 State s;Executor e(p,s,context,host);e.dispatch("LE",{1});assert(e.run());assert(s.v[1]==43&&s.v[2]==1);assert(s.frames.size()==1);
 // Initializers may call only functions declared before that instruction.
 Program init;init.sha256="initializers";auto early=cmd("FU",{num(1)},"P");early.visibleBlocks=0;auto late=early;late.visibleBlocks=1;
 init.initializers={early,late};init.blocks={block("FU",{num(1)},{cmd("VR",{var('v',1)},"+",{num(1)})})};
 State is;Executor ie(init,is,context,host);ie.initialize();assert(ie.run());assert(is.initialized&&!is.initializing&&is.v[1]==1);ie.initialize();assert(ie.run()&&is.v[1]==1);
 // FU:E returns from the current loop iteration, not the entire DO controller.
 Program loop;loop.sha256="loops";auto skip=cmd("FU",{},"E");Predicate q;q.left=var('x',16);q.comparison="=";q.right=num(1);skip.conditions={{q}};
 loop.blocks={block("LE",{}, {cmd("DO",{num(2),num(0),num(3),num(1)},"P",{num(99)})}),
  block("FU",{num(2)},{skip,cmd("VR",{var('v',1)},"+",{var('x',16)}),cmd("VR",{var('x',1)},"+",{num(1)}),cmd("VR",{var('v',2)},"+",{var('x',1)})})};
 State ls;Executor le(loop,ls,context,host);le.dispatch("LE");assert(le.run());assert(ls.v[1]==5&&ls.v[2]==300&&ls.frames.size()==1);
 // A suspended command keeps its already-accepted condition and exact PC.
 Program dialog;dialog.sha256="dialog";Command sequence;sequence.receiver="IF";sequence.operations={{"Prompt",{}},{"Reply",{}}};Predicate flag;flag.isFlag=true;flag.flag=1;sequence.conditions={{flag}};
 dialog.blocks={block("LE",{}, {sequence})};State ds;ds.flags[1]=true;Executor de(dialog,ds,context,host);de.dispatch("LE");assert(!de.run());assert(host.prompts==1&&host.replies==0&&!ds.flags[1]);
 State restored=ds;Executor resumed(dialog,restored,context,host);assert(resumed.run());assert(host.prompts==1&&host.replies==1&&restored.v[2]==1&&restored.continuations.empty());
 // Signed Win32 arithmetic and source random addition are not C++ UB.
 Program math;math.sha256="math";math.blocks={block("LE",{}, {cmd("VR",{var('v',1)},"S",{num(INT_MAX)}),cmd("VR",{var('v',1)},"+",{num(1)}),cmd("VR",{var('v',2)},"S",{num(1)}),cmd("VR",{var('v',2)},"T",{num(35)})})};
 State ms;Executor me(math,ms,context,host);me.dispatch("LE");assert(me.run()&&ms.v[1]==INT_MIN&&ms.v[2]==36);
 // Cave of Gerfrex IF:R1111111101 clears all first-ten flags except9.
 Program flags;flags.sha256="flags";flags.blocks={block("LE",{}, {cmd("IF",{},"R",{num(1111111101)})})};
 State fs;for(int n=1;n<=11;++n)fs.flags[n]=true;Executor fe(flags,fs,context,host);fe.dispatch("LE");assert(fe.run());
 for(int n=1;n<=11;++n)assert(fs.flags[n]==(n==9||n==11));
 // Source function calls pass a z-cell index, not the contents of its text.
 Program text;text.sha256="text";text.blocks={block("LE",{}, {cmd("FU",{num(7)},"P",{var('z',200)})}),
  block("FU",{num(7)},{cmd("VR",{var('v',1)},"S",{var('x',1)})})};
 State ts;ts.z[200]="Quest text";Executor te(text,ts,context,host);te.dispatch("LE");assert(te.run()&&ts.v[1]==200&&ts.z[200]=="Quest text");
 // Campaign password conditions compare contents, never z-cell numbers.
 State answers;answers.z[313]="\tDiplomacy\n";answers.z[314]="DIPLOMACY";
 Predicate answer;answer.left=var('z',313);answer.right=var('z',314);answer.comparison="=";
 assert(accepts({{answer}},answers,context));answers.z[314]="Wisdom";assert(!accepts({{answer}},answers,context));
 answer.comparison="<>";assert(accepts({{answer}},answers,context));
 Operand alias;alias.kind=Kind::Macro;alias.name="skname";answers.macros["skname"]=var('z',313);answer.left=alias;
 answers.z[314]="diplomacy";assert(!accepts({{answer}},answers,context));
 answer.comparison="=";assert(accepts({{answer}},answers,context));
 answers.z[313]="Strong Hold";answers.z[314]="StrongHold";assert(!accepts({{answer}},answers,context));
 answers.z[313]=" Rust  Dragons\r\nnot\tCrust Dragons ";answers.z[314]="rust dragons not crust dragons";assert(accepts({{answer}},answers,context));
 answers.z[313]="Rust\fDragons";answers.z[314]="Rust Dragons";assert(!accepts({{answer}},answers,context));
 // Literal text expands at execution, including original MC aliases. The
 // contents copied from a z-cell are not recursively treated as new code.
 State messages;messages.v[25]=247;messages.z[100]="Clancy";messages.z[2]="literal %V25";
 messages.fast['j']=750;messages.frames[0].x[2]=8;messages.frames[0].y[3]=9;messages.selectedHero=106;messages.w[106][10]=12;
 messages.macros["hname"]=var('z',100);messages.macros["price"]=var('v',25);messages.flags[4]=true;
 assert(formatText("%$hname$ %V25 %Vj %W10 %X2 %Y3 %F4 %%",messages,context)=="Clancy 247 750 12 8 9 1 %");
 assert(formatText("%Z2!",messages,context)=="literal %V25!");
 Operand savedLiteral;savedLiteral.kind=Kind::String;savedLiteral.text="%$literal$";messages.macros["literal"]=savedLiteral;assert(formatText("%$literal$",messages,context)=="%$literal$");
 assert(formatText("%Z100? 100% of %unknown",messages,context)=="Clancy? 100% of %unknown");
 Program interpolation;interpolation.sha256="literal-text-snapshot";Operand literal;literal.kind=Kind::String;literal.text="%V25";
 interpolation.blocks={block("LE",{}, {cmd("VR",{var('z',3)},"S",{literal}),cmd("VR",{var('v',25)},"S",{num(999)}),cmd("VR",{var('z',4)},"S",{var('z',3)})})};
 Executor literalVm(interpolation,messages,context,host);literalVm.dispatch("LE");assert(literalVm.run()&&messages.z[3]=="247"&&messages.z[4]=="247");
 // IF:W-1 selects the source hero of the event for persistent w variables.
 Program hero;hero.sha256="hero-vars";hero.blocks={block("LE",{}, {cmd("IF",{},"W",{num(-1)}),cmd("VR",{var('w',55)},"S",{num(10)})})};
 State hs;Context hc;hc.currentHero=106;Executor he(hero,hs,hc,host);he.dispatch("LE");assert(he.run()&&hs.w[106][55]==10);
 // Legacy Cave Z5 disables the matching LE trigger, without removing its
 // native object/reward. Z4 re-enables it. Subsequent commands still execute.
 Program toggle;toggle.sha256="trigger-enable";
 toggle.initializers={cmd("LE",{num(1),num(2),num(0)},"Z",{num(5)})};
 toggle.blocks={block("LE",{num(1),num(2),num(0)},{cmd("VR",{var('v',1)},"+",{num(1)})}),
  block("LE",{num(3),num(4),num(0)},{cmd("LE",{num(1),num(2),num(0)},"Z",{num(4)})})};
 State bs;Executor be(toggle,bs,context,host);be.initialize();assert(be.run());
 be.dispatch("LE",{1,2,0});assert(be.run()&&bs.v[1]==0);
 be.dispatch("LE",{3,4,0});assert(be.run());
 be.dispatch("LE",{1,2,0});assert(be.run()&&bs.v[1]==1);
 bool rejected=false;auto corrupt=restored;corrupt.programSha256="another-map";try{Executor bad(dialog,corrupt,context,host);}catch(const std::runtime_error&){rejected=true;}assert(rejected);
 Program zero=loop;zero.sha256="zero-loop";zero.blocks[0].commands[0].selectors[3]=num(0);State zs;Executor ze(zero,zs,context,host);ze.dispatch("LE");rejected=false;try{ze.run();}catch(const std::runtime_error&){rejected=true;}assert(rejected);
 // Coordinate, type/subtype and type triggers share source order and execute once.
 Program visits;visits.sha256="object-visits";
 visits.blocks={block("OB",{num(63)},{cmd("VR",{var('v',9)},"*",{num(10)}),cmd("VR",{var('v',9)},"+",{num(1)})}),
  block("OB",{num(7),num(8),num(0)},{cmd("VR",{var('v',9)},"*",{num(10)}),cmd("VR",{var('v',9)},"+",{num(2)}),cmd("IF",{},"Prompt")}),
  block("OB",{num(63),num(4)},{cmd("VR",{var('v',9)},"*",{num(10)}),cmd("VR",{var('v',9)},"+",{num(3)})})};
 State vs;Executor ve(visits,vs,context,host);assert(!ve.dispatchAny("OB",{{1,2,0},{52,4},{52}})&&vs.continuations.empty());
 assert(ve.dispatchAny("OB",{{7,8,0},{63,4},{63},{7,8,0}}));assert(!ve.run()&&vs.v[9]==12);
 auto visitResume=vs;Executor vr(visits,visitResume,context,host);assert(vr.run()&&visitResume.v[9]==123);
 using namespace era_campaign_object_access;
 auto mask=change(255,'S');for(int player=0;player<8;++player)assert(!allows(mask,player));
 mask=change(mask,'E',3);for(int player=0;player<8;++player)assert(allows(mask,player)==(player==3));
 mask=change(mask,'R');for(int player=0;player<8;++player)assert(allows(mask,player));
 mask=change(mask,'D',3);assert(!allows(mask,3)&&allows(mask,2));assert(!allows(mask,-1)&&!allows(mask,8));
 rejected=false;try{change(mask,'D',8);}catch(const std::runtime_error &){rejected=true;}assert(rejected);

}
