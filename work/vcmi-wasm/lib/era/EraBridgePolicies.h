/* Native ERA service adapters for VCMI; GPL-2.0-or-later. */
#pragma once
#include "EraPrimalFaerie.h"
#include "EraSulfideDragon.h"
#include "EraSulfideDragonRule.h"
#include "EraFortressCounterstrikes.h"
#include "EraBridgeRuntime.h"
#include "../filesystem/Filesystem.h"
#include "../GameLibrary.h"
#include "../entities/ResourceTypeHandler.h"
#include "../json/JsonNode.h"
#include <map>
#include <optional>
#include <string>
#include <vector>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct RegenerationPolicy { int hitPoints; int chancePercent; };
struct DailyResourcePolicy { GameResID resource; int amount; int goldPerCreature; };
struct ImposedSpellPolicy { std::string spell; int mastery; };
struct PhysicalDeflectionPolicy { int modifier; std::vector<int> values; };
struct ExperienceRegenerationPolicy { int chancePercent; std::vector<int> values; };
struct RebirthPolicy { float chance; float fraction; float guaranteedFraction; };
// Immutable, versioned native policies. This is not a DLL loader. Unknown
// operations/fields are fatal configuration errors, never ignored commands.
class Policies
{
    std::map<std::string, DailyResourcePolicy> dailyResourcePolicies;
    std::map<std::string, std::vector<ImposedSpellPolicy>> imposedSpellPolicies;
    std::map<std::string, RegenerationPolicy> regenerationPolicies;
    std::map<std::string, RegenerationPolicy> sourceRegenerationPolicies;
    std::map<std::string, ExperienceRegenerationPolicy> experienceRegenerationPolicies;
    std::map<std::string, std::vector<int>> physicalBlockPolicies;
    std::map<std::string, RebirthPolicy> rebirthPolicies;
    std::map<std::string, bool> meleeRagePolicies;
    std::map<std::string, bool> preemptiveRetaliationPolicies;
    std::map<std::string, bool> sourceSplashRangeOnePolicies;
    std::map<std::string, bool> sourceRangedResistance30Policies;
    std::map<std::string, std::vector<int>> sourceRoundTwoDemonsPolicies;
    std::map<std::string, bool> spellDamageInversionPolicies;
    std::map<std::string, bool> vampireDrainPolicies;
    std::map<std::string, int> artifactMimicPolicies;
    std::map<std::string, std::string> angelicArmyMoralePolicies;
    std::map<std::string, bool> armySpellCostPolicies;
    std::map<std::string, bool> allSpellImmunityPolicies;
    std::map<std::string, PhysicalDeflectionPolicy> physicalDeflectionPolicies;
    std::map<std::string, bool> defenseReduction95Policies;
    std::map<std::string, bool> deathBlowCrtPolicies;
    std::map<std::string, bool> petrificationPolicies;
    std::map<std::string, bool> blindnessPolicies;
    static float fraction(const JsonNode & node, float maximum)
    {
        if(!node.isNumber() || !std::isfinite(node.Float()) || node.Float() < 0 || node.Float() > maximum)
            throw std::runtime_error("ERA bridge: invalid fractional policy parameter");
        return static_cast<float>(node.Float());
    }
    static void fields(const JsonNode & node, std::initializer_list<std::string> allowed)
    {
        if(!node.isStruct() || node.Struct().size() != allowed.size())
            throw std::runtime_error("ERA bridge: incomplete operation parameters");
        for(const auto & field : node.Struct())
            if(std::find(allowed.begin(), allowed.end(), field.first) == allowed.end())
                throw std::runtime_error("ERA bridge: unknown operation parameter " + field.first);
    }
    static int integer(const JsonNode & node, int low, int high)
    {
        if(!node.isNumber() || !std::isfinite(node.Float()) || std::floor(node.Float()) != node.Float() || node.Float() < low || node.Float() > high)
            throw std::runtime_error("ERA bridge: invalid integer policy parameter");
        return static_cast<int>(node.Float());
    }
public:
    Policies()
    {
        const auto resource = JsonPath::builtin("config/era-bridge-runtime");
        if(!CResourceHandler::get()->existsResource(resource))
            return;
        const JsonNode root(resource);
        if(!root.isStruct() || integer(root["schemaVersion"], 1, 1) != 1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA bridge: invalid runtime policy document");
        for(const auto & field : root.Struct())
            if(field.first != "schemaVersion" && field.first != "creatures" && field.first != "artifacts")
                throw std::runtime_error("ERA bridge: unsupported root field " + field.first);
        for(const auto & creature : root["creatures"].Struct())
        {
            if(creature.first.find(':') == std::string::npos || !creature.second.isStruct())
                throw std::runtime_error("ERA bridge: policy must use a qualified VCMI creature ID");
            for(const auto & operation : creature.second.Struct())
            {
                if(operation.first == "dailyResources")
                {
                    fields(operation.second, {"resource", "amount", "goldPerCreature"});
                    const auto & resource = operation.second["resource"];
                    if(!resource.isString() || resource.String().find(':') == std::string::npos)
                        throw std::runtime_error("ERA bridge: daily income requires qualified resource");
                    const GameResID id(GameResID::decode(resource.String()));
                    const auto & registered = LIBRARY->resourceTypeHandler->getAllObjects();
                    if(!id.hasValue() || std::find(registered.begin(), registered.end(), id) == registered.end())
                        throw std::runtime_error("ERA bridge: daily income resource unavailable " + resource.String());
                    dailyResourcePolicies.emplace(creature.first, DailyResourcePolicy{id,
                        integer(operation.second["amount"], 0, 1000000000),
                        integer(operation.second["goldPerCreature"], 0, 1000000000)});
                }
                else if(operation.first == "imposedSpells")
                {
                    if(!operation.second.isVector() || operation.second.Vector().size() > 3)
                        throw std::runtime_error("ERA bridge: imposedSpells requires up to three slots");
                    std::vector<ImposedSpellPolicy> spells;
                    for(const auto & slot : operation.second.Vector())
                    {
                        fields(slot, {"spell", "mastery"});
                        static const std::vector<std::string> supported = {"core:airShield", "core:fireShield",
                            "core:protectionFromAir", "core:protectionFromFire", "core:protectionFromWater", "core:protectionFromEarth",
                            "core:magicMirror", "core:bloodlust", "core:precision", "core:stoneSkin", "core:prayer", "core:slayer"};
                        if(!slot["spell"].isString() || std::find(supported.begin(), supported.end(), slot["spell"].String()) == supported.end())
                            throw std::runtime_error("ERA bridge: unsupported imposed enchantment");
                        spells.push_back({slot["spell"].String(), integer(slot["mastery"], 0, 3)});
                    }
                    imposedSpellPolicies.emplace(creature.first, std::move(spells));
                }
                else if(operation.first == "regeneration")
                {
                    fields(operation.second, {"hitPoints", "chancePercent"});
                    regenerationPolicies.emplace(creature.first, RegenerationPolicy{
                        integer(operation.second["hitPoints"], 0, 1000000000),
                        integer(operation.second["chancePercent"], 0, 100)});
                }
                else if(operation.first == "sourceRegeneration")
                {
                    fields(operation.second, {"hitPoints", "chancePercent"});
                    if(creature.first != "tum-era:eraCreature350")
                        throw std::runtime_error("ERA bridge: unaudited source regeneration actor");
                    sourceRegenerationPolicies.emplace(creature.first,RegenerationPolicy{integer(operation.second["hitPoints"],100,100),integer(operation.second["chancePercent"],100,100)});
                }
                else if(operation.first == "experienceRegeneration")
                {
                    fields(operation.second, {"chancePercent", "values"});
                    if(creature.first != "tum-era:eraCreature267" && creature.first != "tum-era:eraCreature268" && creature.first != "tum-era:eraCreature273" && creature.first != "tum-era:eraCreature294" && creature.first != "tum-era:eraCreature339")
                        throw std::runtime_error("ERA bridge: unaudited experience regeneration actor");
                    const bool sourceWerewolf = creature.first == "tum-era:eraCreature273";
                    const bool sourceSulfide = creature.first == "tum-era:eraCreature339";
                    if(sourceSulfide && !SulfideDragon::get().enabled(creature.first))
                        throw std::runtime_error("ERA bridge: exact optional Sulfide339 contract required");
                    const int chance = sourceSulfide ? era_bridge::SulfideDragonRule::regenerationChance : sourceWerewolf ? 50 : 100;
                    const int perRank = sourceWerewolf ? 4 : 9;
                    ExperienceRegenerationPolicy policy{integer(operation.second["chancePercent"], chance, chance), {}};
                    const auto & values=operation.second["values"];
                    if(!values.isVector() || values.Vector().size()!=11)
                        throw std::runtime_error("ERA bridge: eleven regeneration rank values required");
                    for(size_t rank=0;rank<11;++rank)
                    {
                        const int expected=sourceSulfide?era_bridge::SulfideDragonRule::regeneration.at(rank):static_cast<int>(rank)*perRank;
                        policy.values.push_back(integer(values.Vector()[rank],expected,expected));
                    }
                    experienceRegenerationPolicies.emplace(creature.first,std::move(policy));
                }
                else if(operation.first == "preemptiveRetaliation")
                {
                    fields(operation.second, {});
                    if(creature.first != "tum-era:eraCreature280")
                        throw std::runtime_error("ERA bridge: unaudited preemptive retaliation actor");
                    preemptiveRetaliationPolicies.emplace(creature.first,true);
                }
                else if(operation.first == "sourceRoundTwoDemons")
                {
                    fields(operation.second, {"values"});
                    if(creature.first!="third-upgrades:tumPitMaster" || !operation.second["values"].isVector()
                        || operation.second["values"].Vector().size()!=11)
                        throw std::runtime_error("ERA bridge: unproven source round2 actor or ranks");
                    const std::vector<int> expected{0,0,0,10,10,15,15,20,20,25,25};
                    std::vector<int> values;
                    for(size_t i=0;i<expected.size();++i)
                        values.push_back(integer(operation.second["values"].Vector()[i],expected[i],expected[i]));
                    sourceRoundTwoDemonsPolicies.emplace(creature.first,std::move(values));
                }
                else if(operation.first == "sourceRangedResistance30")
                {
                    fields(operation.second, {});
                    if(creature.first!="tum-era:eraCreature337" && creature.first!="tum-era:eraCreature338")
                        throw std::runtime_error("ERA bridge: unproven source ranged resistance actor");
                    sourceRangedResistance30Policies.emplace(creature.first,true);
                }
                else if(operation.first == "sourceSplashRangeOne")
                {
                    fields(operation.second, {});
                    if(creature.first != "tum-era:eraCreature350")
                        throw std::runtime_error("ERA bridge: unaudited source splash radius actor");
                    sourceSplashRangeOnePolicies.emplace(creature.first,true);
                }
                else if(operation.first == "physicalBlock")
                {
                    fields(operation.second, {"values"});
                    if(creature.first != "tum-era:eraCreature268" &&
                        !(creature.first == "tum-era:eraCreature258" && PrimalFaerie::get().enabled(creature.first)))
                        throw std::runtime_error("ERA bridge: unaudited full physical block actor");
                    const auto & values=operation.second["values"];
                    if(!values.isVector() || values.Vector().size()!=11)
                        throw std::runtime_error("ERA bridge: eleven block rank values required");
                    std::vector<int> ranks;
                    for(size_t rank=0;rank<11;++rank)
                    {
                        const int expected=std::min(25,static_cast<int>(rank)*5);
                        ranks.push_back(integer(values.Vector()[rank],expected,expected));
                    }
                    physicalBlockPolicies.emplace(creature.first,std::move(ranks));
                }
                else if(operation.first == "rebirth")
                {
                    fields(operation.second, {"chance", "fraction", "guaranteedFraction"});
                    rebirthPolicies.emplace(creature.first, RebirthPolicy{
                        fraction(operation.second["chance"], 1),
                        fraction(operation.second["fraction"], 1000),
                        fraction(operation.second["guaranteedFraction"], 1000)});
                }
                else if(operation.first == "artifactMimic")
                {
                    fields(operation.second, {"artifact"});
                    const int artifact=integer(operation.second["artifact"],71,135);
                    const bool source354 = artifact==71 && creature.first=="tum-era:eraCreature354"
                        && FortressCounterstrikes::get().twice(creature.first);
                    if(artifact!=129 && artifact!=135 && !source354)
                        throw std::runtime_error("ERA bridge: unproven creature artifact mimic");
                    artifactMimicPolicies.emplace(creature.first,artifact);
                }
                else if(operation.first == "angelicArmyMorale")
                {
                    fields(operation.second, {"supremeArchangel"});
                    const auto & companion = operation.second["supremeArchangel"];
                    if(!companion.isString() || companion.String().find(':') == std::string::npos)
                        throw std::runtime_error("ERA bridge: qualified Supreme Archangel ID required");
                    angelicArmyMoralePolicies.emplace(creature.first, companion.String());
                }
                else if(operation.first == "blindness")
                {
                    fields(operation.second, {});
                    blindnessPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "armySpellCost")
                {
                    fields(operation.second, {});
                    armySpellCostPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "vampireDrain")
                {
                    fields(operation.second, {});
                    if(creature.first!="tum-era:redBonesDragon")
                        throw std::runtime_error("ERA bridge: unproven vampire selector actor");
                    vampireDrainPolicies.emplace(creature.first,true);
                }
                else if(operation.first == "allSpellImmunity")
                {
                    fields(operation.second, {});
                    allSpellImmunityPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "physicalDeflection")
                {
                    fields(operation.second, {"modifier", "values"});
                    const auto & values = operation.second["values"];
                    if(!values.isVector() || values.Vector().size() != 11)
                        throw std::runtime_error("ERA bridge: physical deflection requires eleven rank values");
                    PhysicalDeflectionPolicy policy{integer(operation.second["modifier"], 0, 255), {}};
                    for(const auto & value : values.Vector())
                        policy.values.push_back(integer(value, 0, 255));
                    physicalDeflectionPolicies.emplace(creature.first, std::move(policy));
                }
                else if(operation.first == "defenseReduction")
                {
                    fields(operation.second, {"percent"});
                    integer(operation.second["percent"], 95, 95);
                    defenseReduction95Policies.emplace(creature.first, true);
                }
                else if(operation.first == "deathBlowCRT")
                {
                    fields(operation.second, {});
                    if(creature.first != "tum-era:eraCreature318" && creature.first != "tum-era:eraCreature319"
                        && creature.first != "tum-era:ancestralBehemoth" && creature.first != "tum-era:eraCreature361")
                        throw std::runtime_error("ERA bridge: unaudited DeathBlow CRT actor");
                    deathBlowCrtPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "petrification")
                {
                    fields(operation.second, {});
                    petrificationPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "spellDamageInversion")
                {
                    fields(operation.second, {});
                    spellDamageInversionPolicies.emplace(creature.first, true);
                }
                else if(operation.first == "meleeRage")
                {
                    fields(operation.second, {});
                    meleeRagePolicies.emplace(creature.first, true);
                }
                else
                    throw std::runtime_error("ERA bridge: unsupported operation " + operation.first);
            }
            if(petrificationPolicies.count(creature.first) && blindnessPolicies.count(creature.first))
                throw std::runtime_error("ERA bridge: conflicting post-hit effects " + creature.first);
        }
    }
    std::optional<RegenerationPolicy> sourceRegeneration(const std::string & creature) const
    {
        const auto found=sourceRegenerationPolicies.find(creature);
        return found==sourceRegenerationPolicies.end()?std::nullopt:std::optional<RegenerationPolicy>(found->second);
    }
    std::optional<RegenerationPolicy> regeneration(const std::string & creature) const
    {
        const auto found = regenerationPolicies.find(creature);
        if(found == regenerationPolicies.end())
            return std::nullopt;
        return found->second;
    }
    std::optional<ExperienceRegenerationPolicy> experienceRegeneration(const std::string & creature) const
    {
        const auto found=experienceRegenerationPolicies.find(creature);
        return found==experienceRegenerationPolicies.end()?std::nullopt:std::optional<ExperienceRegenerationPolicy>(found->second);
    }
    std::optional<std::vector<int>> physicalBlock(const std::string & creature) const
    {
        const auto found=physicalBlockPolicies.find(creature);
        return found==physicalBlockPolicies.end()?std::nullopt:std::optional<std::vector<int>>(found->second);
    }
    std::optional<RebirthPolicy> rebirth(const std::string & creature) const
    {
        const auto found = rebirthPolicies.find(creature);
        if(found == rebirthPolicies.end())
            return std::nullopt;
        return found->second;
    }
    std::optional<int> artifactMimic(const std::string & creature) const
    {
        const auto found = artifactMimicPolicies.find(creature);
        if(found == artifactMimicPolicies.end())
            return std::nullopt;
        return found->second;
    }
    const std::map<std::string, std::string> & angelicArmyMorale() const
    {
        return angelicArmyMoralePolicies;
    }
    bool blindness(const std::string & creature) const
    {
        return blindnessPolicies.count(creature) != 0;
    }
    bool armySpellCost(const std::string & creature) const
    {
        return armySpellCostPolicies.count(creature) != 0;
    }
    bool vampireDrain(const std::string & creature) const { return vampireDrainPolicies.count(creature)!=0; }
    bool hasAllSpellImmunity() const { return !allSpellImmunityPolicies.empty(); }
    bool allSpellImmunity(const std::string & creature) const
    {
        return allSpellImmunityPolicies.count(creature) != 0;
    }
    std::optional<PhysicalDeflectionPolicy> physicalDeflection(const std::string & creature) const
    {
        const auto found = physicalDeflectionPolicies.find(creature);
        return found == physicalDeflectionPolicies.end() ? std::nullopt : std::optional<PhysicalDeflectionPolicy>(found->second);
    }
    bool defenseReduction95(const std::string & creature) const
    {
        return defenseReduction95Policies.count(creature) != 0;
    }
    bool deathBlowCRT(const std::string & creature) const
    {
        return deathBlowCrtPolicies.count(creature) != 0;
    }
    bool petrification(const std::string & creature) const
    {
        return petrificationPolicies.count(creature) != 0;
    }
    bool spellDamageInversion(const std::string & creature) const
    {
        return spellDamageInversionPolicies.count(creature) != 0;
    }
    bool preemptiveRetaliation(const std::string & creature) const
    {
        return preemptiveRetaliationPolicies.count(creature) != 0;
    }
    std::optional<std::vector<int>> sourceRoundTwoDemons(const std::string & creature) const
    {
        const auto found=sourceRoundTwoDemonsPolicies.find(creature);
        return found==sourceRoundTwoDemonsPolicies.end()?std::nullopt:std::optional<std::vector<int>>(found->second);
    }
    bool sourceRangedResistance30(const std::string & creature) const
    {
        return sourceRangedResistance30Policies.count(creature) != 0;
    }
    bool sourceSplashRangeOne(const std::string & creature) const
    {
        return sourceSplashRangeOnePolicies.count(creature) != 0;
    }
    bool meleeRage(const std::string & creature) const
    {
        return meleeRagePolicies.count(creature) != 0;
    }
    const std::vector<ImposedSpellPolicy> & imposedSpells(const std::string & creature) const
    {
        static const std::vector<ImposedSpellPolicy> empty;
        const auto found = imposedSpellPolicies.find(creature);
        return found == imposedSpellPolicies.end() ? empty : found->second;
    }
    std::optional<DailyResourcePolicy> dailyResources(const std::string & creature) const
    {
        const auto found = dailyResourcePolicies.find(creature);
        if(found == dailyResourcePolicies.end())
            return std::nullopt;
        return found->second;
    }
    static const Policies & get()
    {
        static const Policies policies;
        return policies;
    }
};
}
VCMI_LIB_NAMESPACE_END
