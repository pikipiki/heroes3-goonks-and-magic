/* Source TUM first-day replacement adapters. No ERM or Windows code executes. */
#pragma once
#include "../../lib/era/EraObjectReplacementRule.h"
#include "../CGameHandler.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/json/JsonNode.h"
#include "../../lib/mapObjectConstructors/CObjectClassesHandler.h"
#include "../../lib/mapObjects/CGObjectInstance.h"
#include "../../lib/mapObjects/CGMysteriousCave.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/StartInfo.h"
#include <vstd/RNG.h>
#include <optional>
#include <set>
#include <algorithm>
#include <cmath>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ObjectReplacementPolicy
{
    std::vector<::era_bridge::ObjectReplacementPlan> plans;
    static int number(const JsonNode & node,int minimum,int maximum)
    {
        if(!node.isNumber() || node.Float()!=std::floor(node.Float())
            || node.Float()<minimum || node.Float()>maximum)
            throw std::runtime_error("Invalid source object replacement integer");
        return static_cast<int>(node.Float());
    }
    static void fields(const JsonNode & node,std::initializer_list<std::string> keys)
    {
        if(!node.isStruct() || node.Struct().size()!=keys.size())
            throw std::runtime_error("Invalid source object replacement structure");
        for(const auto & field:node.Struct())
            if(std::find(keys.begin(),keys.end(),field.first)==keys.end())
                throw std::runtime_error("Unknown source object replacement field");
    }
    static CompoundMapObjectID identity(const JsonNode & node)
    {
        fields(node,{"group","type"});
        if(!node["group"].isString() || !node["type"].isString())
            throw std::runtime_error("Invalid source object replacement identity");
        const auto group=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"object",node["group"].String(),true);
        if(!group)throw std::runtime_error("Unresolved replacement object group");
        const auto type=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),
            LIBRARY->objtypeh->getJsonKey(MapObjectID(*group)),node["type"].String(),true);
        if(!type)throw std::runtime_error("Unresolved replacement object subtype");
        LIBRARY->objtypeh->getHandlerFor(MapObjectID(*group),MapObjectSubID(*type));
        return CompoundMapObjectID(*group,*type);
    }
public:
    ObjectReplacementPolicy()
    {
        const auto file=JsonPath::builtin("config/era-object-replacements-v1");
        if(!CResourceHandler::get()->existsResource(file))return;
        const JsonNode root(file);
        fields(root,{"schemaVersion","contract","enabled","sourceArchiveSha256","plans"});
        if(number(root["schemaVersion"],1,1)!=1 || !root["contract"].isString()
            || root["contract"].String()!="source-object-replacements-v1"
            || !root["enabled"].isBool() || !root["plans"].isVector()
            || !root["sourceArchiveSha256"].isString()
            || root["sourceArchiveSha256"].String()!="452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c")
            throw std::runtime_error("Invalid original object replacement admission");
        if(!root["enabled"].Bool())return;
        std::set<std::string> sourceKeys;
        for(const auto & row:root["plans"].Vector())
        {
            fields(row,{"sourceKey","parameterId","targetSourceType","targetSourceSubtype","target","enabled","allowRandomMap","functionMultiplicity","rules"});
            if(!row["sourceKey"].isString() || !row["parameterId"].isString()
                || !sourceKeys.insert(row["sourceKey"].String()).second
                || !row["enabled"].isBool() || !row["allowRandomMap"].isBool()
                || !row["rules"].isVector() || row["rules"].Vector().size()!=7)
                throw std::runtime_error("Invalid original replacement plan");
            ::era_bridge::ObjectReplacementPlan plan;
            plan.sourceKey=row["sourceKey"].String();
            plan.parameterId=row["parameterId"].String();
            plan.targetType=number(row["targetSourceType"],0,255);
            plan.targetSubtype=number(row["targetSourceSubtype"],0,65535);
            plan.enabled=row["enabled"].Bool();
            plan.allowRandomMap=row["allowRandomMap"].Bool();
            plan.functionMultiplicity=number(row["functionMultiplicity"],1,2);
            const auto target=identity(row["target"]);
            plan.nativeTargetType=target.primaryID;plan.nativeTargetSubtype=target.secondaryID;
            int slot=0;
            for(const auto & input:row["rules"].Vector())
            {
                fields(input,{"slot","sourceType","sourceSubtype","source","percentage","xOffset"});
                ::era_bridge::ObjectReplacementRule rule;
                rule.slot=number(input["slot"],0,6);
                if(rule.slot!=slot++)throw std::runtime_error("Unordered original replacement slots");
                rule.sourceType=number(input["sourceType"],-1,255);
                rule.sourceSubtype=number(input["sourceSubtype"],-1,65535);
                rule.percentage=number(input["percentage"],0,100);
                rule.xOffset=number(input["xOffset"],std::numeric_limits<int>::min(),std::numeric_limits<int>::max());
                if(rule.sourceType>=0 && rule.sourceSubtype>=0 && rule.percentage>0)
                {
                    const auto source=identity(input["source"]);
                    rule.nativeSourceType=source.primaryID;rule.nativeSourceSubtype=source.secondaryID;
                }
                else if(!input["source"].isNull())throw std::runtime_error("Unexpected disabled replacement identity");
                plan.rules.push_back(rule);
            }
            plans.push_back(plan);
        }
    }
    const auto & getPlans()const{return plans;}
    static const ObjectReplacementPolicy & get(){static const ObjectReplacementPolicy value;return value;}
};

class ObjectReplacementAdapter
{
    CGameHandler & handler;
    const CMap & map;
    const CGObjectInstance * at(const ::era_bridge::ReplacementPosition & position)const
    {
        const int3 point(position.x,position.y,position.z);
        if(!map.isInTheMap(point))return nullptr;
        const auto & objects=map.getTile(point).visitableObjects;
        // Original UN:U unwraps a hero's underlying map object. It scans entry
        // tiles, not the list of object instance IDs.
        for(auto it=objects.rbegin();it!=objects.rend();++it)
            if(const auto * object=handler.gameInfo().getObj(*it);object && object->ID!=Obj::HERO)return object;
        return nullptr;
    }
public:
    explicit ObjectReplacementAdapter(CGameHandler & value):handler(value),map(value.gameState().getMap()){}
    int width()const{return map.width;}
    std::uint64_t countType(int type)const
    {
        std::uint64_t result=0;
        for(int z=0;z<map.levels();++z)
            for(int y=0;y<map.height;++y)
                for(int x=0;x<map.width;++x)
                    if(const auto * object=at({x,y,z});object && object->ID.getNum()==type)++result;
        return result;
    }
    std::optional<::era_bridge::ReplacementPosition> findNextType(int type,const ::era_bridge::ReplacementPosition & cursor)const
    {
        const auto start=(static_cast<std::int64_t>(cursor.z)*map.height+cursor.y)*map.width+cursor.x+1;
        const auto limit=static_cast<std::int64_t>(map.width)*map.height*map.levels();
        for(auto i=std::max<std::int64_t>(0,start);i<limit;++i)
        {
            const ::era_bridge::ReplacementPosition position{static_cast<int>(i%map.width),
                static_cast<int>((i/map.width)%map.height),static_cast<int>(i/(map.width*map.height))};
            if(const auto * object=at(position);object && object->ID.getNum()==type)return position;
        }
        return std::nullopt;
    }
    bool matches(const ::era_bridge::ReplacementPosition & position,int type,int subtype)const
    {
        const auto * object=at(position);
        return object && object->ID.getNum()==type && object->subID.getNum()==subtype;
    }
    int randomInt(int minimum,int maximum){return handler.getRandomGenerator().nextInt(minimum,maximum);}
    void replace(const ::era_bridge::ReplacementPosition & oldPosition,const ::era_bridge::ReplacementPosition & position,
        const ::era_bridge::ObjectReplacementPlan & plan)
    {
        const auto * old=at(oldPosition);
        if(!old)throw std::runtime_error("Original replacement lost its source object");
        auto created=handler.createNewObject(int3(position.x,position.y,position.z),
            MapObjectID(plan.nativeTargetType),MapObjectSubID(plan.nativeTargetSubtype));
        // Both source metadata values are retained in a native serialized name.
        // They are not interpreted as a bank's visit or reward flags.
        created->instanceName+="_eraCB"+plan.parameterId+"_"+std::to_string(position.x)+"_"
            +std::to_string(position.y)+"_"+std::to_string(position.z)+"_PO_N3";
        RemoveObject remove;remove.objectID=old->id;remove.initiator=PlayerColor::NEUTRAL;
        handler.sendAndApply(remove);
        handler.newObject(created,PlayerColor::NEUTRAL);
        // Source UN:I is followed by PO:N3. Cave reads this nibble before
        // the first human weekly reset; an AI starting day1 must see it closed.
        if(auto * cave=dynamic_cast<CGMysteriousCave *>(created.get()))
        {
            auto configuration=cave->configuration;
            configuration.variables.values["eraCave:visited"]=3;
            configuration.variables.values["eraCave:subtypeVisited"]=plan.targetSubtype==55?1:0;
            handler.setRewardableObjectConfiguration(cave->id,configuration);
        }
    }
};

inline void applyEraFirstDayObjectReplacements(CGameHandler & handler,bool firstTurn)
{
    // The transition0→1 is serialized by the standard NewTurn packet. Loading
    // an existing day1 save never re-enters this branch or consumes RNG again.
    if(!firstTurn)return;
    const auto & plans=ObjectReplacementPolicy::get().getPlans();
    if(plans.empty())return;
    ObjectReplacementAdapter adapter(handler);
    const bool randomMap=handler.gameInfo().getStartInfo()->mapname.empty();
    ::era_bridge::runObjectReplacements(plans,adapter,true,randomMap);
}
}
VCMI_LIB_NAMESPACE_END
