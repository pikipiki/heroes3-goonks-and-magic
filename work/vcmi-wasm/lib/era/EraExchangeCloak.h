/* Original TUM Exchange Cloak BF contract; GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
#include <limits>
#include <optional>
#include <stdexcept>
namespace era_bridge
{
struct ExchangeHeroStats { int attack; int defense; int mana; };
struct ExchangeHeroChange { int attackDelta; int defenseDelta; int mana; };
inline std::optional<std::array<ExchangeHeroChange,2>> exchangeCloakChanges(
    bool realBattle,bool bothHeroes,bool attackerEquipped,bool defenderEquipped,
    const ExchangeHeroStats & attacker,const ExchangeHeroStats & defender)
{
    // BF&1000 skips theoretical AI-only battles. Source requires a defending
    // hero and exits when neither hero, or both heroes, equip the cloak.
    if(!realBattle || !bothHeroes || attackerEquipped==defenderEquipped)
        return std::nullopt;
    const auto difference=[](int other,int own)
    {
        const std::int64_t delta=static_cast<std::int64_t>(other)-own;
        if(delta<std::numeric_limits<int>::min() || delta>std::numeric_limits<int>::max())
            throw std::overflow_error("ERA cloak primary-skill delta outside native range");
        return static_cast<int>(delta);
    };
    return std::array<ExchangeHeroChange,2>{{
        {difference(defender.attack,attacker.attack),difference(defender.defense,attacker.defense),defender.mana},
        {difference(attacker.attack,defender.attack),difference(attacker.defense,defender.defense),attacker.mana}}};
}
inline bool exchangeCloakAffectsCreature(int sourceId)
{
    // Source KO_cape/KO_cape2 exclude ballista/towers/cart/tent/catapult.
    return sourceId<145 || sourceId>149;
}
}
