#pragma once
#include "../json/JsonNode.h"
#include <stdexcept>
namespace era_compat::commander_choices
{
inline void validate(const JsonNode & state)
{
    if(!state.isStruct() || !state["choices"].isStruct() || state["choices"].Struct().size()>256)
        throw std::runtime_error("Invalid saved commander choices");
    for(const auto & [key,choice]:state["choices"].Struct())
    {
        for(const auto * name:{"heroType","owner","level"})
            if(!choice[name].isNumber())throw std::runtime_error("Invalid commander choice field");
        if(key!=std::to_string(choice["heroType"].Integer()) || choice["heroType"].Integer()<0
            || choice["owner"].Integer()<0 || choice["owner"].Integer()>7
            || choice["level"].Integer()<2 || choice["level"].Integer()>75
            || !choice["visits"].isVector() || choice["visits"].Vector().size()>32
            || !choice["skills"].isVector() || choice["skills"].Vector().empty() || choice["skills"].Vector().size()>64)
            throw std::runtime_error("Invalid commander choice identity");
        for(const auto & skill:choice["skills"].Vector())
            if(!skill.isNumber() || skill.Integer()<0 || skill.Integer()>65535)
                throw std::runtime_error("Invalid commander choice skill");
    }
}
inline bool checkpoint(const JsonNode & state,int heroType,int owner,int level)
{
    const auto & choice=state["choices"][std::to_string(heroType)];
    return choice.isStruct() && choice["owner"].Integer()==owner && choice["level"].Integer()==level;
}
}
