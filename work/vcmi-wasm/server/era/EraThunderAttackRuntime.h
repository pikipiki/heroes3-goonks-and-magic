/* TUM212 ATT_THUNDER selector1: source440EA5..441048; opt-in only. */
#pragma once
#include "../../lib/era/EraDeflectionLog.h"
#include "../../lib/era/EraThunderAttack.h"
#include "../../lib/era/EraSourceSpellAccuracy.h"
#include "../../lib/era/EraDeflectionRuntime.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../CGameHandler.h"
#include <set>
#include <vstd/RNG.h>
namespace era_compat_server
{
class ThunderAttacks
{
    std::set<std::string> creatures;
public:
    ThunderAttacks()
    {
        const auto path=JsonPath::builtin("config/era-bridge-thunder-attacks");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector())
            throw std::runtime_error("ERA thunder attacks: invalid document");
        for(const auto & value:root["creatures"].Vector())
            if(!value.isString() || value.String()!="tum-era:guardianOfZeus"
                || !creatures.insert(value.String()).second)
                throw std::runtime_error("ERA thunder attacks: unproven or duplicate creature");
    }
    bool enabled(const CStack * actor)const
    {return actor && creatures.count(actor->creatureId().toCreature()->getJsonKey())!=0;}
    static const ThunderAttacks & get(){static const ThunderAttacks instance;return instance;}
};
class ThunderAttackCaster final:public spells::AbilityCaster
{
    PlayerColor effectiveOwner;
public:
    ThunderAttackCaster(const CStack * actor,PlayerColor owner):spells::AbilityCaster(actor,0),effectiveOwner(owner){}
    PlayerColor getCasterOwner()const override{return effectiveOwner;}
};
inline void applySourceThunder(CGameHandler & handler,const CBattleInfoCallback & battle,
    bool ranged,const CStack * actor,const CStack * target)
{
    //441991 calls ATT_THUNDER for melee only, before4419A0 FireShield.
    //440EAA checks target life BEFORE its20% roll. No caster-life test.
    if(ranged || !actor || !target || !ThunderAttacks::get().enabled(actor)
        || !target->alive() || target->isGhost())return;
    auto & rng=handler.getRandomGenerator();
    if(!era_bridge::sourceThunderChance(rng.nextInt(1,100)))return;
    const auto * spell=SpellID(17).toSpell(); //Original gate AND damage use LightningBolt17, not ability77.
    ThunderAttackCaster caster(actor,battle.battleGetOwner(actor));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
    cast.setSpellLevel(0);cast.setEffectPower(0);cast.setEffectDuration(0);
    const bool receptive=era_compat::sourceSpellContextAllows(battle,target,spell)
        && spell->battleMechanics(&cast)->isReceptive(target);
    const int accuracy=receptive?era_compat::statusRawAccuracy(battle,target):0;
    if(rng.nextInt(1,100)>accuracy)return; //5A8950 mandatory roll, including zero accuracy.
    const auto adjusted=spell->adjustRawDamage(&caster,target,
        era_bridge::sourceThunderRawDamage(static_cast<std::uint32_t>(actor->getCount())));
    //440F1D explicitly rejects nonpositive adjusted damage. In particular,
    //selector11 inversion297 DOES NOT heal from intrinsic Thunder; p#57 does.
    if(adjusted<=0)return;
    BattleStackAttacked hit;
    hit.stackAttacked=target->unitId();hit.attackerID=actor->unitId();
    hit.flags|=BattleStackAttacked::SPELL_EFFECT;hit.spellID=SpellID(17);
    //441048 belongs to the source thirteen-callsite L hook list.
    hit.damageAmount=applyEraDeflection(target,rng,adjusted, [&](int strength,int chance){auto message=eraDeflectionLog(battle.getBattle()->getBattleID(),strength,chance);handler.sendAndApply(message);});
    target->prepareAttacked(hit,rng);
    StacksInjured packet;packet.battleID=battle.getBattle()->getBattleID();packet.stacks.push_back(hit);
    handler.sendAndApply(packet);
}
}
