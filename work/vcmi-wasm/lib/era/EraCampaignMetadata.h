/* Exact source-header repairs; original campaign archives remain unchanged. */
#pragma once
#include "EraCampaignJson.h"
#include <functional>
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_metadata
{
inline void require(bool value,const char * text){if(!value)throw std::runtime_error(text);}
inline bool apply(JsonNode & header,const JsonNode & config)
{
 if(!config["enabled"].Bool())return false;
 require(era_campaign_json::integer(config["schemaVersion"])==1&&config["contract"].String()=="source-campaign-metadata-v1","Invalid original campaign metadata profile");
 const auto & rules=era_campaign_json::array(config["rules"]);require(rules.size()<=32,"Excessive campaign metadata rules");
 for(const auto & rule:rules)
 {
  if(header!=rule["expectedHeader"])continue;
  JsonNode changed(header);auto & scenarios=changed["scenarios"].Vector();
  require(!scenarios.empty()&&scenarios.size()<=32,"Invalid campaign scenario count");std::set<int> patched;
  for(const auto & patch:era_campaign_json::array(rule["patches"]))
  {
   const int index=era_campaign_json::integer(patch["index"]);
   require(index>=0&&index<int(scenarios.size())&&patched.insert(index).second,"Invalid campaign metadata patch index");
   auto & target=scenarios[index];require(target["map"]==patch["map"]&&target["preconditions"].Vector()==patch["originalRequires"].Vector(),"Campaign metadata patch identity changed");
   target["preconditions"].Vector()=era_campaign_json::array(patch["requires"]);
  }
  std::vector<int> visited(scenarios.size());
  std::function<void(int)> visit=[&](int index)
  {
   require(index>=0&&index<int(scenarios.size()),"Campaign dependency outside scenario table");
   require(visited[index]!=1,"Cyclic campaign dependency");if(visited[index]==2)return;visited[index]=1;std::set<int> dependencies;
   for(const auto & node:scenarios[index]["preconditions"].Vector())
   {const int dependency=era_campaign_json::integer(node);require(dependency!=index&&dependencies.insert(dependency).second,"Invalid campaign dependency");visit(dependency);}
   visited[index]=2;
  };
  for(int i=0;i<int(scenarios.size());++i)visit(i);
  header=std::move(changed);return true;
 }
 return false;
}
}
VCMI_LIB_NAMESPACE_END
