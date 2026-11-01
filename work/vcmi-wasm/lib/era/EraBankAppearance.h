#pragma once
// Install beside EraBankSemantics.h in lib/era/. Include from
// CRewardableConstructor.cpp, retain config["eraBankAppearance"] as a JsonNode
// member, and call applyBankAppearance after initializeGuards(). Schema addition
// is mandatory: see schema-extension.json. Existing constructors remain unchanged
// when no policy is configured. All source-bank states must emit mapDice:index.
#include "EraBankSemantics.h"
#include "../mapObjects/CRewardableObject.h"
#include "../mapObjects/ObjectTemplate.h"
#include "../json/JsonNode.h"
#include "../filesystem/ResourcePath.h"
#include <memory>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_bridge
{
inline void applyBankAppearance(CRewardableObject & object, const JsonNode & policy)
{
    if(policy.isNull())
        return;
    // CGameHandler::createNewObject configures once before selecting an
    // appearance; newObject->initObj configures again with the actual template.
    if(!object.appearance)
        return;

    std::array<int,4> chances{};
    if(policy["chances"].Vector().size()!=4 || policy["animations"].Vector().size()!=4)
        throw std::runtime_error("Invalid ERA bank appearance policy");
    for(std::size_t i=0;i<4;++i)
        chances[i]=static_cast<int>(policy["chances"][i].Integer());

    int state;
    const auto & preset=object.configuration.getPresetVariable("dice","map");
    if(!preset.isNull())
        state=static_cast<int>(preset.Integer());
    else
    {
        const auto dice=object.configuration.getVariable("dice","0");
        if(!dice.has_value())
            throw std::runtime_error("ERA bank appearance has no configured state dice");
        state=::era_bridge::bankState(chances,*dice);
    }
    if(state<0 || state>3)
        throw std::runtime_error("Invalid ERA bank appearance state");

    const auto & animation=policy["animations"][state];
    if(animation.String().empty())
        throw std::runtime_error("ERA bank appearance asset is unresolved");
    // ERA0x4C9650 copies original object attributes and replaces DEF filename;
    // its footprint remains the original bank's. Copying the native template
    // preserves masks, visit offset, terrain and anchor while changing graphics.
    auto changed=std::make_shared<ObjectTemplate>(*object.appearance);
    changed->animationFile=AnimationPath::fromJson(animation);
    object.appearance=changed;
}
}
VCMI_LIB_NAMESPACE_END
