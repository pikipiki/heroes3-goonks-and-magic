#include "Global.h"
#define ERA3_QUICK_VARS_NO_MAIN
#include "Era3QuickVars.test.cpp"
#include "era/EraCampaignJson.h"

template<class F>void rejects(F function)
{bool threw=false;try{function();}catch(const std::runtime_error &){threw=true;}assert(threw);}
int main()
{
 using namespace era_campaign_json;
 const auto p=program(true);Context context;State state;Pause host;
 for(char name='f';name<='t';++name)state.fast[name]=name=='f'?INT_MIN:name=='t'?INT_MAX:name;
 const auto caller=state.fast;
 Executor first(p,state,context,host);first.initialize();assert(!first.run());
 const auto encoded=writeState(state);auto restored=readState(encoded);
 assert(writeState(restored)==encoded&&restored.continuations.back().savedQuickVars==caller);
 Executor resumed(p,restored,context,host);assert(resumed.run());
 assert(host.shown==1&&restored.fast.at('f')==111&&restored.fast.at('q')==caller.at('q'));
 auto empty=state;empty.continuations.back().savedQuickVars.clear();
 const auto emptyJson=writeState(empty);assert(readState(emptyJson).continuations.back().restoreQuickVars);
 auto old=encoded;old["continuations"].Vector().back().Struct().erase("savedQuickVars");
 auto legacy=readState(old);assert(!legacy.continuations.back().restoreQuickVars);
 assert(writeState(legacy)==old);Executor oldResume(p,legacy,context,host);assert(oldResume.run());assert(legacy.fast.at('q')==88);
 auto broken=encoded;broken["continuations"].Vector().back()["loop"].Bool()=true;rejects([&]{readState(broken);});
 broken=encoded;broken["continuations"].Vector().back()["localFrame"].Bool()=false;rejects([&]{readState(broken);});
 broken=encoded;auto & vars=broken["continuations"].Vector().back()["savedQuickVars"].Vector();vars.push_back(vars.front());
 rejects([&]{readState(broken);});
 broken=encoded;broken["continuations"].Vector().back()["savedQuickVars"]=JsonNode(1);rejects([&]{readState(broken);});
 broken=encoded;broken["continuations"].Vector().back()["savedQuickVars"].Vector()[0]["name"].String()="ff";rejects([&]{readState(broken);});
}
