/* Admission shared by source campaign adventure services. */
#pragma once
#include "../json/JsonNode.h"
#include "../filesystem/Filesystem.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_admission
{
inline bool programAdmitted(const std::string & id,const std::string & sha)
{
 if(id.empty()||sha.empty())return false;
 const auto path=JsonPath::builtin("config/era-campaigns/registry");if(!CResourceHandler::get()->existsResource(path))return false;
 static const JsonNode registry(path);
 for(const auto & entry:registry["programs"].Vector())if(entry["enabled"].Bool()&&entry["id"].String()==id&&entry["programSha256"].String()==sha)return true;
 return false;
}
inline bool admitted(const JsonNode & state)
{
 return state.isStruct()&&state["contract"].String()=="source-campaign-state-v1"&&state["vm"]["initialized"].Bool()&&programAdmitted(state["programId"].String(),state["vm"]["programSha256"].String());
}
}
VCMI_LIB_NAMESPACE_END
