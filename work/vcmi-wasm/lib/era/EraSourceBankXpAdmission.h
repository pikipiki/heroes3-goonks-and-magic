#pragma once
#include "EraSourceBankXpRows.h"
#include "../json/JsonNode.h"
#include "../filesystem/Filesystem.h"
#include <set>
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
inline constexpr int32_t sourceBankXpSignature=0x58504236;
inline std::string sourceBankXpTag(){return std::string("eraSourceXpBanks:v1:")+std::string(era_bridge::sourceBankXpCohort);}
class SourceBankXpPolicy
{
 bool active=false;
 static void fields(const JsonNode&n,std::initializer_list<const char*> keys)
 {if(!n.isStruct()||n.Struct().size()!=keys.size())throw std::runtime_error("Bank XP exact object required");for(const auto*k:keys)if(!n.Struct().count(k))throw std::runtime_error("Bank XP field missing");}
 static void text(const JsonNode&n,std::string_view s){if(!n.isString()||n.String()!=s)throw std::runtime_error("Bank XP source text changed");}
 static void integer(const JsonNode&n,int v){if(!n.isNumber()||n.Float()!=v)throw std::runtime_error("Bank XP source number changed");}
 static bool flag(const JsonNode&n){if(!n.isBool())throw std::runtime_error("Bank XP bool required");return n.Bool();}
 static void hash(const JsonNode&n){if(!n.isString()||n.String().size()!=64||n.String().find_first_not_of("0123456789abcdef")!=std::string::npos)throw std::runtime_error("Bank XP proof hash required");}
public:
 SourceBankXpPolicy(){const auto p=JsonPath::builtin("config/era-bridge-bank-xp-admission-v1");if(CResourceHandler::get()->existsResource(p))read(JsonNode(p));}
 explicit SourceBankXpPolicy(const JsonNode&n){read(n);}
 void read(const JsonNode&root)
 {
  active=false;fields(root,{"schemaVersion","contract","archiveSha256","cohortSha256","enabled","mode","nativeValidated","rows","validation"});
  integer(root["schemaVersion"],1);text(root["contract"],"source-bank-xp6-v1");
  text(root["archiveSha256"],"452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c");text(root["cohortSha256"],era_bridge::sourceBankXpCohort);
  const auto&rows=root["rows"];if(!rows.isVector()||rows.Vector().size()!=6)throw std::runtime_error("Exactly6 bank XP rows required");
  for(size_t i=0;i<6;++i)
  {
   const auto&n=rows.Vector()[i];const auto&r=era_bridge::sourceBankXpRows[i];
   fields(n,{"sourceId","nativeId","sourceLine","sourceOrdinal","cacheSlot","code","spell","chances"});
   integer(n["sourceId"],r.sourceId);text(n["nativeId"],r.nativeId);integer(n["sourceLine"],r.sourceLine);integer(n["sourceOrdinal"],r.sourceOrdinal);integer(n["cacheSlot"],r.cacheSlot);text(n["code"],std::string(1,r.code));integer(n["spell"],r.spell);
   if(!n["chances"].isVector()||n["chances"].Vector().size()!=11)throw std::runtime_error("Bank XP11 ranks required");
   for(size_t rank=0;rank<11;++rank)integer(n["chances"].Vector()[rank],r.chances[rank]);
  }
  const bool enabled=flag(root["enabled"]),validated=flag(root["nativeValidated"]);
  const auto&mode=root["mode"];if(!mode.isString())throw std::runtime_error("Bank XP mode required");
  if(mode.String()=="off"){if(enabled||validated)throw std::runtime_error("Invalid bank XP off gate");return;}
  if(mode.String()=="private-validation"){if(!enabled||validated)throw std::runtime_error("Invalid bank XP validation gate");active=true;return;}
  if(mode.String()!="validated-all6"||!enabled||!validated)throw std::runtime_error("Validated bank XP gate required");
  const auto&proof=root["validation"];fields(proof,{"contractsSha256","migrationSha256","wholeActors"});hash(proof["contractsSha256"]);hash(proof["migrationSha256"]);
  const std::set<int> expected{253,272,281,289,290,301,302,330,340,358};std::set<int>seen;
  if(!proof["wholeActors"].isVector())throw std::runtime_error("Bank actor proofs required");
  for(const auto&p:proof["wholeActors"].Vector())
  {fields(p,{"sourceId","nativeValidated","proofSha256"});if(!p["sourceId"].isNumber())throw std::runtime_error("Bank actor ID required");const int id=p["sourceId"].Integer();integer(p["sourceId"],id);if(!expected.count(id)||!seen.insert(id).second||!flag(p["nativeValidated"]))throw std::runtime_error("Invalid bank actor proof");hash(p["proofSha256"]);}
  if(seen!=expected)throw std::runtime_error("All10 whole bank actor proofs required");active=true;
 }
 bool enabled()const{return active;}
 bool owns(const era_bridge::SourceXpProvenance&r)const
 {if(!active||r.existingSourceOwner)return false;for(const auto&e:era_bridge::sourceBankXpRows)if(e.sourceId==r.sourceId&&e.nativeId==r.nativeId&&e.sourceLine==r.sourceLine&&e.sourceOrdinal==r.sourceOrdinal&&e.cacheSlot==r.cacheSlot&&e.code==r.code&&e.spell==r.spell&&e.chances==r.chances)return true;return false;}
 bool ownsActor(std::string_view key)const
 {if(!active)return false;for(const auto&r:era_bridge::sourceBankXpRows)if(r.nativeId==key)return true;return false;}
 bool participates(std::string_view key)const
 {if(!active)return false;for(int id:{253,272,281,289,290,301,302,330,340,358})if(key=="tum-era:eraCreature"+std::to_string(id))return true;return false;}
 static const SourceBankXpPolicy&get(){static const SourceBankXpPolicy value;return value;}
};
}
VCMI_LIB_NAMESPACE_END
