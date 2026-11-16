/* Apply native loader normalization to runtime-created original DEF events. */
#pragma once
#include "../mapObjects/ObjectTemplate.h"
#include "../json/JsonNode.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline std::shared_ptr<const ObjectTemplate> sourceEventTemplate(const ObjectTemplate & original)
{
 auto result=std::make_shared<ObjectTemplate>(original);
 JsonNode definition;result->writeJson(definition,false);result->id=Obj::EVENT;
 // readJson applies the native event fixup and recomputes cached offsets.
 result->readJson(definition,false);
 return result;
}
}
VCMI_LIB_NAMESPACE_END
