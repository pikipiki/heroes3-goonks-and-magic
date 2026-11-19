#pragma once
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include <stdexcept>
namespace era_compat::source_artifacts
{
inline const JsonNode & state(const IGameInfoCallback & cb)
{return cb.gameState().getMap().eraGameplayState["artifactGrants"];}
inline JsonNode emptyState()
{
    JsonNode result;result["contract"].String()="source-artifact-grants-v1";
    result["jobs"].Struct();result["levels"].Struct();result["seen"].Struct();return result;
}
inline void validate(const JsonNode & value)
{
    if(value["contract"].String()!="source-artifact-grants-v1"||!value["jobs"].isStruct()||!value["levels"].isStruct()||!value["seen"].isStruct())
        throw std::runtime_error("Invalid original artifact grant state");
    for(const auto & item:value["jobs"].Struct())
    {
        const auto & job=item.second;if(!job["entries"].isVector())throw std::runtime_error("Missing original artifact reward entries");
        const auto count=job["entries"].Vector().size();
        if(!job.isStruct()||!job["hero"].isNumber()||!job["heroType"].isNumber()||!job["owner"].isNumber()||job["owner"].Integer()<-1||job["owner"].Integer()>7
            ||!job["entries"].isVector()||count>104||job["cursor"].Integer()<0||job["cursor"].Integer()>count
            ||job["summaryCursor"].Integer()<0||job["summaryCursor"].Integer()>count||job["revision"].Integer()<0)
            throw std::runtime_error("Invalid original artifact grant job");
        for(const auto & entry:job["entries"].Vector())
        {
            if(!entry.isStruct()||(entry["source"].isNull()&&entry["class"].isNull()))throw std::runtime_error("Invalid original artifact reward entry");
            if(!entry["source"].isNull()&&(entry["source"].Integer()<0||entry["source"].Integer()>143))throw std::runtime_error("Invalid original artifact reward identity");
            if(!entry["class"].isNull()&&(!entry["class"].isNumber()||entry["class"].Integer()<=0||(entry["class"].Integer()&~30)))throw std::runtime_error("Invalid original artifact reward class");
            if(!entry["spell"].isNull()&&(!entry["spell"].isNumber()||entry["spell"].Integer()<-1||entry["spell"].Integer()>81))throw std::runtime_error("Invalid original artifact reward spell");
        }
        const auto & phase=job["phase"].String();
        if(!phase.empty()&&phase!="assembly"&&phase!="summary")throw std::runtime_error("Invalid original artifact reward phase");
        if(phase=="summary"&&(job["summaryEnd"].Integer()<=job["summaryCursor"].Integer()||job["summaryEnd"].Integer()>count||job["summaryEnd"].Integer()>job["summaryCursor"].Integer()+8))throw std::runtime_error("Invalid original artifact reward page");
        if(phase=="assembly"&&(!job["combined"].isNumber()||!job["slot"].isNumber()||job["slot"].Integer()<0||job["slot"].Integer()>18))throw std::runtime_error("Invalid original artifact assembly prompt");
    }
    for(const auto & item:value["levels"].Struct())
    {
        const auto & level=item.second;
        if(!level["heroType"].isNumber()||!level["owner"].isNumber()||!level["first"].isNumber()||!level["count"].isNumber()||!level["left"].isNumber()
            ||level["owner"].Integer()<0||level["owner"].Integer()>7||level["first"].Integer()<1||level["first"].Integer()>104
            ||level["count"].Integer()<1||level["count"].Integer()>105-level["first"].Integer()||level["left"].Integer()<1||level["left"].Integer()>level["count"].Integer())throw std::runtime_error("Invalid original level reward batch");
        const auto & choice=level["choice"];
        if(!choice.isNull())
        {
            if(!choice["level"].isNumber()||!choice["primary"].isNumber()||!choice["skills"].isVector()||choice["skills"].Vector().size()<2||choice["primary"].Integer()<0||choice["primary"].Integer()>3)throw std::runtime_error("Invalid original level reward choice");
            for(const auto & skill:choice["skills"].Vector())if(!skill.isNumber()||skill.Integer()<0)throw std::runtime_error("Invalid original level reward skill");
        }
    }
}
inline bool seen(const IGameInfoCallback & cb,PlayerColor owner,ArtifactID combined)
{
    return state(cb)["seen"][std::to_string(owner.getNum())][std::to_string(combined.getNum())].Bool();
}
}
