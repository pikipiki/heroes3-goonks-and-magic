#include "Global.h"
#include "era/EraScriptRulesModel.h"
#include <cassert>
using namespace era_compat::script_rules;
template<class F>void rejects(F function){bool failed=false;try{function();}catch(const std::runtime_error&){failed=true;}assert(failed);}
int main()
{
 const auto disabled=disabledSnapshot();validate(disabled);assert(!disabled["rules"]["779"].Bool());
 auto configured=disabled;configured["profile"].String()="era-scripts";configured["rules"]["779"].Bool()=true;validate(configured);
 assert(initialSnapshot(JsonNode(),configured,true)==configured);
 assert(initialSnapshot(JsonNode(),configured,false)==disabled); // Old save does not acquire new rules.
 assert(initialSnapshot(disabled,configured,true)==disabled); // Frozen choice survives config changes.
 assert(initialSnapshot(configured,disabled,false)==configured);
 auto broken=configured;broken["rules"]["780"].Bool()=true;rejects([&]{validate(broken);});
 broken=configured;broken["profile"].String()="combined";rejects([&]{validate(broken);});
 broken=configured;broken["profile"].String()="none";rejects([&]{validate(broken);});
 broken=configured;broken["rules"]["779"].Integer()=1;rejects([&]{validate(broken);});
 broken=configured;broken["schemaVersion"].Float()=1.5;rejects([&]{validate(broken);});
 const auto saved=configured;assert(initialSnapshot(saved,JsonNode(),false)==saved);
}
