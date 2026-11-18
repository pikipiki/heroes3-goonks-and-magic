#include "../../work/vcmi-wasm/lib/era/EraCampaignExecutor.h"
#include <cassert>
#include <climits>
using namespace era_campaign;
Operand n(int value){Operand o;o.kind=Kind::Number;o.number=value;return o;}
Operand fast(char name,Access access=Access::Read){Operand o;o.kind=Kind::Fast;o.name=std::string(1,name);o.access=access;return o;}
Operand var(char space,int index){Operand o;o.kind=Kind::Variable;o.space=space;o.index=std::make_shared<Operand>(n(index));return o;}
Command set(Operand to,Operand value){Command c;c.receiver="VR";c.selectors={to};c.operations={{"S",{value}}};return c;}
struct Pause final:Host
{
 int shown=0;
 Step execute(const Command &,const Operation &,State &,const Context &)override{++shown;return Step::Suspend;}
 int32_t random(int32_t maximum,bool)override{return maximum;}
};
Program program(bool era3)
{
 Program p;p.sha256=era3?"era3-quick-scope":"classic-quick-scope";p.era3IntegerCalls=era3;
 Trigger t;t.receiver="FU";t.selectors={n(1)};
 for(char name='f';name<='t';++name)t.commands.push_back(set(fast(name),n(1000+name)));
 t.commands.push_back(set(var('x',1),n(111)));
 Command pause;pause.receiver="IF";pause.operations={{"M",{}}};t.commands.push_back(pause);
 t.commands.push_back(set(fast('q'),n(88)));p.blocks={t};
 Command call;call.receiver="FU";call.selectors={n(1)};call.operations={{"P",era3?std::vector<Operand>{fast('f',Access::Write)}:std::vector<Operand>{}}};
 p.initializers={call,set(var('v',1),fast('q'))};return p;
}
#ifndef ERA3_QUICK_VARS_NO_MAIN
int main()
{
 const auto p=program(true);Context context;State state;Pause host;
 for(char name='f';name<='t';++name)state.fast[name]=name=='f'?INT_MIN:name=='t'?INT_MAX:name;
 const auto caller=state.fast;
 Executor first(p,state,context,host);first.initialize();assert(!first.run());
 assert(host.shown==1&&state.continuations.back().restoreQuickVars);
 assert(state.continuations.back().savedQuickVars==caller);
 for(char name='f';name<='t';++name)assert(state.fast.at(name)==1000+name);
 State restored=state;Executor resumed(p,restored,context,host);assert(resumed.run());
 assert(host.shown==1&&restored.fast.at('f')==111); // copy-out AFTER restoration
 for(char name='g';name<='t';++name)assert(restored.fast.at(name)==caller.at(name));
 assert(restored.v.at(1)==caller.at('q'));
 // Old pending saves did not record the caller. Preserve their prior shared
 // behavior for that continuation, rather than inventing missing values.
 state.continuations.back().restoreQuickVars=false;state.continuations.back().savedQuickVars.clear();
 Executor legacy(p,state,context,host);assert(legacy.run());assert(state.fast.at('q')==88&&state.fast.at('f')==111);
 const auto classic=program(false);State old;old.fast=caller;Pause oldHost;
 Executor oldFirst(classic,old,context,oldHost);oldFirst.initialize();assert(!oldFirst.run());
 assert(!old.continuations.back().restoreQuickVars);assert(oldFirst.run());assert(old.fast.at('q')==88);
}
#endif
