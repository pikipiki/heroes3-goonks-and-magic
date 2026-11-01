#pragma once
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class SkeletonTransformations
{
public:
    struct Entry { int target; bool living; };
private:
    std::map<std::string,Entry> creatures;
    static int resolve(const std::string & key)
    {
        if(key.find(':')==std::string::npos)
            throw std::runtime_error("ERA skeleton transformation requires qualified IDs");
        const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",key,true);
        if(!id || *id<0)throw std::runtime_error("ERA skeleton transformation unresolved creature "+key);
        return *id;
    }
public:
    SkeletonTransformations()
    {
        const auto path=JsonPath::builtin("config/era-bridge-skeleton-transformations");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA skeleton transformation invalid document");
        for(const auto & entry : root["creatures"].Struct())
        {
            resolve(entry.first);
            if(!entry.second.isStruct() || entry.second.Struct().size()!=2
                || !entry.second["target"].isString() || !entry.second["living"].isBool())
                throw std::runtime_error("ERA skeleton transformation requires target and source living flag");
            creatures.emplace(entry.first,Entry{resolve(entry.second["target"].String()),entry.second["living"].Bool()});
        }
    }
    bool enabled() const { return !creatures.empty(); }
    const Entry * find(const std::string & key) const
    {
        const auto found=creatures.find(key);
        return found==creatures.end()?nullptr:&found->second;
    }
    static const SkeletonTransformations & get()
    {
        static const SkeletonTransformations instance;
        return instance;
    }
};
}
VCMI_LIB_NAMESPACE_END
