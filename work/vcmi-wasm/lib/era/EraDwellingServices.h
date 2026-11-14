/* Optional source dwelling service admission. Missing/off policy is inert. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <set>
#include <string>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
class DwellingServices {
 std::set<int> admitted;
public:
 DwellingServices(){const auto path=JsonPath::builtin("config/era-dwelling-services-v1");if(CResourceHandler::get()->existsResource(path))read(JsonNode(path));}
 explicit DwellingServices(const JsonNode & node){read(node);}
 void read(const JsonNode & node){
  admitted.clear();if(!node.isStruct()||node.Struct().size()!=4||!node["schemaVersion"].isNumber()||node["schemaVersion"].Float()!=1||!node["contract"].isString()||node["contract"].String()!="source-dwelling-services-v1"||!node["enabled"].isBool()||!node["sourceIds"].isVector())throw std::runtime_error("Invalid source dwelling services contract");
  const std::set<int> allowed{200,239,262,264,270,274,276,277,279,282,284,285,288,292,296,298,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,319,322,323,325,326,327,328,333,334,335,336,360,362};
  for(const auto & id:node["sourceIds"].Vector()){
   if(!id.isNumber()||id.Float()!=id.Integer()||!allowed.count(id.Integer())||!admitted.insert(id.Integer()).second)throw std::runtime_error("Unreviewed/duplicate source dwelling service");
  }
  if(!node["enabled"].Bool())admitted.clear();
 }
 bool enabled(int source)const{return admitted.count(source)!=0;}
 bool actor(int source,const std::string & key)const{return enabled(source)&&key=="tum-era:eraCreature"+std::to_string(source);}
 static const DwellingServices &get(){static const DwellingServices value;return value;}
};
}
VCMI_LIB_NAMESPACE_END
