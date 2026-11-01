/* ATT_DISRUPT selector4; only source-proven Necross254/Nightmare245 may opt in. */
#pragma once
#include "../../lib/era/EraDeflectionLog.h"
#include "../../lib/era/EraAcidAttack.h"
#include "../../lib/era/EraSourceSpellAccuracy.h"
#include "../../lib/era/EraDeflectionRuntime.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/json/JsonNode.h"
#include "../../lib/CStack.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../CGameHandler.h"
#include <set>
#include <vstd/RNG.h>
namespace era_compat_server
{
class AcidAttacks
{
    std::set<std::string> creatures;
public:
    AcidAttacks()
    {
        const auto path=JsonPath::builtin("config/era-bridge-acid-attacks");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector())
            throw std::runtime_error("ERA acid attacks: invalid document");
        for(const auto & item:root["creatures"].Vector())
            if(!item.isString() || (item.String()!="tum-era:necrossDragon" && item.String()!="tum-era:nightmareHydra") || !creatures.insert(item.String()).second)
                throw std::runtime_error("ERA acid attacks: unproven or duplicate creature");
    }
    bool enabled(const CStack * attacker)const
    {
        return attacker && creatures.count(attacker->creatureId().toCreature()->getJsonKey())!=0;
    }
    bool nightmare(const CStack * actor)const
    {return enabled(actor) && actor->creatureId().toCreature()->getJsonKey()=="tum-era:nightmareHydra";}
    static const AcidAttacks & get(){static const AcidAttacks instance;return instance;}
};
inline void applyAcidAttack(CGameHandler & handler, const CBattleInfoCallback & battle,
    bool ranged, const CStack * attacker, const CStack * defender)
{
    // Original441991 calls ATT_DISRUPT only for melee, before4419A0 FireShield.
    // No magic accuracy gate, wards, damage inversion or caster spell bonus:
    //44124C calls target443DB0 directly, whose registered L wrapper remains active.
    if(ranged || !attacker || !defender || !defender->alive() || defender->isGhost() || !AcidAttacks::get().enabled(attacker))return;
    auto & rng=handler.getRandomGenerator();
    if(!era_bridge::AcidAttack::succeeds(rng.nextInt(1,AcidAttacks::get().nightmare(attacker)?19:100)))return;
    // Amethyst4411E5 rejects Toxic15 AFTER the proc draw and before damage RNG.
    const int sourceId=era_compat::StatusAttacks::get().id(defender->creatureId().toCreature()->getJsonKey());
    if(sourceId==335 || sourceId==336 || sourceId==339)return;
    // Original reads mutable instance damageMin/Max and alive count, not hero
    // attack/defence, physical damage, bless/curse resolution or original count.
    const int rolled=rng.nextInt(attacker->getMinDamage(false),attacker->getMaxDamage(false));
    const auto raw=era_bridge::AcidAttack::damage(rolled,attacker->getCount());
    if(raw<=0)return;
    BattleStackAttacked hit;
    hit.stackAttacked=defender->unitId();
    hit.attackerID=attacker->unitId();
    hit.flags|=BattleStackAttacked::SPELL_EFFECT;
    hit.spellID=SpellID(SpellID::ACID_BREATH_DAMAGE);
    hit.damageAmount=applyEraDeflection(defender,rng,raw, [&](int strength,int chance){auto message=eraDeflectionLog(battle.getBattle()->getBattleID(),strength,chance);handler.sendAndApply(message);});
    defender->prepareAttacked(hit,rng);
    StacksInjured packet;
    packet.battleID=battle.getBattle()->getBattleID();
    packet.stacks.push_back(hit);
    handler.sendAndApply(packet);
}
}
