/* Independent XP43 permission. Production DEFEND tags cannot enable these hooks. */
#pragma once
#include "EraSourceXpAdmissionRows.h"
#include "../json/JsonNode.h"
#include "../filesystem/Filesystem.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusSelector.h"
#include "../CStack.h"
#include "../battle/CBattleInfoCallback.h"
#include <set>
#include <string>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
inline constexpr int32_t sourceXpAdmissionSignature=0x58503433;
inline std::string sourceXpAdmissionTag(){return std::string("eraSourceXpAdmission:v1:")+std::string(era_bridge::sourceXpAdmissionCohort);}
inline std::string sourceXpAdmissionKey(const era_bridge::SourceXpProvenance & r){return std::to_string(r.sourceId)+":"+r.code+":"+std::to_string(r.spell);}
class SourceXpAdmissionPolicy {
 bool active=false;std::set<std::string> permitted;
 static void fields(const JsonNode & n,std::initializer_list<const char*> keys){if(!n.isStruct()||n.Struct().size()!=keys.size())throw std::runtime_error("XP admission exact object required");for(const auto*k:keys)if(n.Struct().find(k)==n.Struct().end())throw std::runtime_error("XP admission missing field");}
 static void text(const JsonNode&n,std::string_view s){if(!n.isString()||n.String()!=s)throw std::runtime_error("XP admission source text mismatch");}
 static void integer(const JsonNode&n,int v){if(!n.isNumber()||n.Float()!=v)throw std::runtime_error("XP admission source number mismatch");}
 static bool flag(const JsonNode&n){if(!n.isBool())throw std::runtime_error("XP admission bool required");return n.Bool();}
 static void hash(const JsonNode&n){if(!n.isString()||n.String().size()!=64||n.String().find_first_not_of("0123456789abcdef")!=std::string::npos)throw std::runtime_error("XP admission proof hash required");}
public:
 SourceXpAdmissionPolicy(){const auto p=JsonPath::builtin("config/era-bridge-source-xp-admission-v1");if(CResourceHandler::get()->existsResource(p))read(JsonNode(p));}
 explicit SourceXpAdmissionPolicy(const JsonNode&root){read(root);}
 void read(const JsonNode&root){active=false;permitted.clear();fields(root,{"schemaVersion","contract","archiveSha256","executableSha256","pluginSha256","cohortSha256","enabled","mode","nativeValidated","rows","admittedRows","validation"});integer(root["schemaVersion"],1);text(root["contract"],"source-xp-admission43-v1");text(root["archiveSha256"],"452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c");text(root["executableSha256"],"451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181");text(root["pluginSha256"],"82bd8174c92aa18c13b865d0a179865aa667c0d40e075760dfccb2984fe19180");text(root["cohortSha256"],era_bridge::sourceXpAdmissionCohort);
  const auto &rows=root["rows"];if(!rows.isVector()||rows.Vector().size()!=43)throw std::runtime_error("Exactly43 source rows required");
  for(size_t i=0;i<43;++i){const auto&n=rows.Vector()[i];const auto&r=era_bridge::sourceXpAdmissionRows[i];fields(n,{"sourceId","nativeId","sourceLine","sourceOrdinal","cacheSlot","code","spell","chances","executionOwner"});integer(n["sourceId"],r.sourceId);text(n["nativeId"],r.nativeId);integer(n["sourceLine"],r.sourceLine);integer(n["sourceOrdinal"],r.sourceOrdinal);integer(n["cacheSlot"],r.cacheSlot);text(n["code"],std::string(1,r.code));integer(n["spell"],r.spell);text(n["executionOwner"],r.existingSourceOwner?"existingSourceService":"candidateLedger");if(!n["chances"].isVector()||n["chances"].Vector().size()!=11)throw std::runtime_error("XP11 ranks required");for(size_t rank=0;rank<11;++rank)integer(n["chances"].Vector()[rank],r.chances[rank]);}
  const auto &admitted=root["admittedRows"];if(!admitted.isVector())throw std::runtime_error("XP row permit list required");for(const auto&key:admitted.Vector()){if(!key.isString()||!permitted.insert(key.String()).second)throw std::runtime_error("Duplicate XP row permit");bool found=false;for(const auto&r:era_bridge::sourceXpAdmissionRows)if(!r.existingSourceOwner&&sourceXpAdmissionKey(r)==key.String())found=true;if(!found)throw std::runtime_error("Existing/unreviewed XP owner cannot be admitted");}
  const auto&proof=root["validation"];fields(proof,{"contractsSha256","migrationSha256","wholeActors","innateOwnership"});if(!root["mode"].isString())throw std::runtime_error("XP mode string required");const auto mode=root["mode"].String();const bool enabled=flag(root["enabled"]),validated=flag(root["nativeValidated"]);
  if(mode=="off"){if(enabled||validated||!permitted.empty())throw std::runtime_error("Invalid off XP permission");return;}
  if(mode=="private-validation"){if(!enabled||validated||permitted.empty())throw std::runtime_error("Invalid private XP permission");active=true;return;}
  if(mode!="validated-all43"||!enabled||!validated||permitted.size()!=40)throw std::runtime_error("Full validated XP43 permission required");hash(proof["contractsSha256"]);hash(proof["migrationSha256"]);
  const auto proofs=[&](const JsonNode&list,const std::set<int>&expected){if(!list.isVector()||list.Vector().size()!=expected.size())throw std::runtime_error("Incomplete XP actor ownership proof");std::set<int>seen;for(const auto&p:list.Vector()){fields(p,{"sourceId","nativeValidated","proofSha256"});if(!p["sourceId"].isNumber())throw std::runtime_error("XP source ID required");const int id=p["sourceId"].Integer();integer(p["sourceId"],id);if(!expected.count(id)||!seen.insert(id).second||!flag(p["nativeValidated"]))throw std::runtime_error("Unvalidated XP actor ownership");hash(p["proofSha256"]);}};
  std::set<int>actors;for(const auto&r:era_bridge::sourceXpAdmissionRows)actors.insert(r.sourceId);proofs(proof["wholeActors"],actors);proofs(proof["innateOwnership"],{25,76,81,106,107,141,206,228,241,242});active=true;
 }
 bool enabled()const{return active;}
 bool owns(const era_bridge::SourceXpProvenance&r)const{if(!active||r.existingSourceOwner||!permitted.count(sourceXpAdmissionKey(r)))return false;for(const auto&e:era_bridge::sourceXpAdmissionRows)if(e.sourceId==r.sourceId&&e.nativeId==r.nativeId&&e.sourceLine==r.sourceLine&&e.sourceOrdinal==r.sourceOrdinal&&e.cacheSlot==r.cacheSlot&&e.code==r.code&&e.spell==r.spell&&e.chances==r.chances&&!e.existingSourceOwner)return true;return false;}
 bool ownsActor(std::string_view key)const{if(!active)return false;for(const auto&r:era_bridge::sourceXpAdmissionRows)if(r.nativeId==key&&owns(r))return true;return false;}
 static const SourceXpAdmissionPolicy&get(){static const SourceXpAdmissionPolicy value;return value;}
};
inline Bonus sourceXpAdmissionEnrollment(){Bonus b(BonusDuration::PERMANENT,BonusType::PRIMARY_SKILL,BonusSource::OTHER,0,BonusSourceID(),BonusSubtypeID(PrimarySkill::DEFENSE));b.stacking=sourceXpAdmissionTag();b.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{sourceXpAdmissionSignature,1});return b;}
// Permission/lifecycle only. Source71C16D XP module/count/actualcommander/rank
// preparation remains with the router; DEFEND enrollment is never consulted.
inline bool sourceXpBattleAdmitted(const CBattleInfoCallback & battle)
{
 const auto & policy=SourceXpAdmissionPolicy::get();if(!policy.enabled())return false;
 for(const auto * stack:battle.battleGetAllStacks())
 {
  const auto bonuses=stack->getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE)));
  for(const auto & bonus:*bonuses)
   if(bonus->stacking==sourceXpAdmissionTag())
   {
    if(bonus->source!=BonusSource::OTHER||bonus->val!=0||bonus->duration!=BonusDuration::PERMANENT
       ||!bonus->parameters||bonus->parameters->toVector()!=std::vector<int32_t>{sourceXpAdmissionSignature,1}
       ||bonus->valType!=BonusValueType::ADDITIVE_VALUE||bonus->effectRange!=BonusLimitEffect::NO_LIMIT
       ||bonus->limiter||bonus->updater||bonus->propagator||bonus->propagationUpdater)
      throw std::runtime_error("Invalid independent XP admission marker");
    return true;
   }
 }
 return false;
}
}
VCMI_LIB_NAMESPACE_END
