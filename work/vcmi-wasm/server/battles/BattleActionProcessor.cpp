/*
 * BattleActionProcessor.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../era/EraDragonFly241AdmissionRuntime.h"
#include "../era/EraSourceExperienceRuntime.h"
#include "../era/EraBankDeathStare.h"
#include "../era/EraDwellingGhost.h"
#include "../era/EraDwellingAfterShot.h"
#include "../era/EraSourceXpNativeRuntime.h"
#include "../../lib/era/EraSourceXpRetaliationFrame.h"
#include "../era/EraSourceXpDispel78LegacyLate.h"
#include "../era/EraSourceDefendRuntime.h"
#include "../../lib/era/EraExperienceMagicReductionNative.h"
#include "../../lib/era/EraOrbChaos238Runtime.h"
#include "../era/EraConfluxRuntime.h"
#include "../era/EraPrimordialCastRuntime.h"
#include "../era/EraPrimordialExperience.h"
#include "../../lib/era/EraPrimordialShieldRule.h"
#include "../era/EraSulfideStatusRuntime.h"
#include "../era/EraConfluxExperience.h"
#include "../era/EraFaerieChainRuntime.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../era/EraCreatureSpellCleanse.h"
#include "../../lib/era/EraFortressCounterstrikes.h"
#include "../../lib/era/EraOriginalRetaliationShield.h"
#include "../../lib/era/EraCrystalExperienceRuntime.h"
#include "../../lib/era/EraDeflectionLog.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include "../../lib/era/EraInterferenceState.h"
#include "../../lib/era/EraHorn266.h"
#include "../../lib/era/EraSourceAttackGate.h"
#include "../../lib/era/EraCloneHealScope.h"
#include "../../lib/era/EraDeathBlowChance.h"
#include "BattleActionProcessor.h"
#include "../era/EraOblivionRuntime.h"
#include "../era/EraDoneRound.h"
#include "../era/EraRebirth.h"
#include "../era/EraPetrification.h"
#include "../era/EraDungeonChainRuntime.h"
#include "../era/EraStatusAttacks.h"
#include "../../lib/era/EraDeflectionRuntime.h"
#include "../../lib/era/EraSourceRangedResistance.h"
#include "../era/EraAcidAttackRuntime.h"
#include "../era/EraPhysicalBlockRuntime.h"
#include "../era/EraPrimalFaerieRuntime.h"
#include "../era/EraThunderAttackRuntime.h"
#include "../era/EraArtifactMassSpellsRuntime.h"
#include "../era/EraHorn266Runtime.h"

#include "BattleProcessor.h"

#include "../CGameHandler.h"

#include "../../lib/CStack.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/IGameSettings.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/CObstacleInstance.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/battle/BattleAction.h"
#include "../../lib/bonuses/BonusParameters.h"
#include "../../lib/callback/IGameInfoCallback.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/entities/building/TownFortifications.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/spells/Problem.h"

#include <vstd/RNG.h>

BattleActionProcessor::BattleActionProcessor(BattleProcessor * owner, CGameHandler * newGameHandler)
	: owner(owner)
	, gameHandler(newGameHandler)
{
}

bool BattleActionProcessor::doEmptyAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	return true;
}

bool BattleActionProcessor::doEndTacticsAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	return true;
}

bool BattleActionProcessor::doWaitAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);

	if (!canStackAct(battle, stack))
		return false;

	processBattleEventTriggers(battle, CombatEventType::WAIT, stack, nullptr);
	return true;
}

bool BattleActionProcessor::doRetreatAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	if (!battle.battleCanFlee(battle.sideToPlayer(ba.side)))
	{
		gameHandler->complain("Cannot retreat!");
		return false;
	}

	owner->setBattleResult(battle, EBattleResult::ESCAPE, battle.otherSide(ba.side));
	return true;
}

bool BattleActionProcessor::doSurrenderAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	PlayerColor player = battle.sideToPlayer(ba.side);
	int cost = battle.battleGetSurrenderCost(player);
	if (cost < 0)
	{
		gameHandler->complain("Cannot surrender!");
		return false;
	}

	if (gameHandler->gameInfo().getResource(player, EGameResID::GOLD) < cost)
	{
		gameHandler->complain("Not enough gold to surrender!");
		return false;
	}

	gameHandler->giveResource(player, EGameResID::GOLD, -cost);
	owner->setBattleResult(battle, EBattleResult::SURRENDER, battle.otherSide(ba.side));
	return true;
}

bool BattleActionProcessor::doHeroSpellAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CGHeroInstance *h = battle.battleGetFightingHero(ba.side);
	if (!h)
	{
		logGlobal->error("Wrong caster!");
		return false;
	}

	if (!ba.spell.hasValue())
	{
		logGlobal->error("Wrong spell id (%d)!", ba.spell.getNum());
		return false;
	}

	const CSpell * s = ba.spell.toSpell();
	spells::BattleCast parameters(&battle, h, spells::Mode::HERO, s);

	spells::detail::ProblemImpl problem;

	auto m = s->battleMechanics(&parameters);

	if(!m->canBeCast(problem))//todo: should we check aimed cast?
	{
		logGlobal->warn("Spell cannot be cast!");
		std::vector<std::string> texts;
		problem.getAll(texts);
		for(const auto & text : texts)
			logGlobal->warn(text);
		return false;
	}

	parameters.cast(gameHandler->spellcastEnvironment(), ba.getTarget(&battle));
	gameHandler->useChargeBasedSpell(h->id, ba.spell);

	return true;
}

bool BattleActionProcessor::doWalkAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);

	if (!canStackAct(battle, stack))
		return false;

	if(target.empty())
	{
		gameHandler->complain("Destination required for move action.");
		return false;
	}

	processBattleEventTriggers(battle, CombatEventType::BEFORE_MOVE, stack, nullptr);

	auto movementResult = moveStack(battle, ba.stackNumber, target.at(0).hexValue); //move
	if (movementResult.invalidRequest)
	{
		gameHandler->complain("Stack failed movement!");
		return false;
	}
    if(!battle.battleTacticDist())
    {
        markEraDoneRound(*gameHandler, battle, stack);
    }
	processBattleEventTriggers(battle, CombatEventType::AFTER_MOVE, stack, nullptr);
	return true;
}

bool BattleActionProcessor::doDefendAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);

	if (!canStackAct(battle, stack))
		return false;

    // ERA DEFEND sets DONE before applying defense/after-defend effects.
    markEraDoneRound(*gameHandler, battle, stack);

	//defensive stance, TODO: filter out spell boosts from bonus (stone skin etc.)
	SetStackEffect sse;
	sse.battleID = battle.getBattle()->getBattleID();

	Bonus defenseBonusToAdd(BonusDuration::STACK_GETS_TURN, BonusType::PRIMARY_SKILL, BonusSource::OTHER, 20, BonusSourceID(), BonusSubtypeID(PrimarySkill::DEFENSE), BonusValueType::PERCENT_TO_ALL);
	Bonus bonus2(BonusDuration::STACK_GETS_TURN, BonusType::PRIMARY_SKILL, BonusSource::OTHER, stack->valOfBonuses(BonusType::DEFENSIVE_STANCE), BonusSourceID(), BonusSubtypeID(PrimarySkill::DEFENSE), BonusValueType::ADDITIVE_VALUE);
	Bonus alternativeWeakCreatureBonus(BonusDuration::STACK_GETS_TURN, BonusType::PRIMARY_SKILL, BonusSource::OTHER, 1, BonusSourceID(), BonusSubtypeID(PrimarySkill::DEFENSE), BonusValueType::ADDITIVE_VALUE);
	Bonus tagBonus(BonusDuration::STACK_GETS_TURN, BonusType::UNIT_DEFENDING, BonusSource::OTHER, 0, BonusSourceID());

	BonusList defence = *stack->getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL, BonusSubtypeID(PrimarySkill::DEFENSE)));
	int oldDefenceValue = defence.totalValue();

	defence.push_back(std::make_shared<Bonus>(defenseBonusToAdd));
	defence.push_back(std::make_shared<Bonus>(bonus2));

	int difference = defence.totalValue() - oldDefenceValue;
	std::vector<Bonus> buffer;
	if(difference == 0) //give replacement bonus for creatures not reaching 5 defense points (20% of def becomes 0)
	{
		difference = 1;
		buffer.push_back(alternativeWeakCreatureBonus);
	}
	else
	{
		buffer.push_back(defenseBonusToAdd);
	}

	buffer.push_back(bonus2);
	buffer.push_back(tagBonus);

    if(era_compat_server::prepareSourceXpDefend(battle,*stack,difference,buffer))
    {
        if(!buffer.empty())sse.toAdd.emplace_back(ba.stackNumber,buffer);
    }
    else
	sse.toUpdate.emplace_back(ba.stackNumber, buffer);
	gameHandler->sendAndApply(sse);

	BattleLogMessage message;
	message.battleID = battle.getBattle()->getBattleID();

	MetaString text;
	stack->addText(text, EMetaText::GENERAL_TXT, 120);
	stack->addNameReplacement(text);
	text.replaceNumber(difference);

	message.lines.push_back(text);

	gameHandler->sendAndApply(message);

    era_compat_server::primalFaerieAfterDefend(*gameHandler,battle,stack);
    era_compat_server::primordialAfterDefend(*gameHandler,battle,stack);
	processBattleEventTriggers(battle, CombatEventType::DEFEND, stack, nullptr);
	return true;
}

bool BattleActionProcessor::doAttackAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);

	if (!canStackAct(battle, stack))
		return false;

	if(target.size() < 2)
	{
		gameHandler->complain("Two destinations required for attack action.");
		return false;
	}

	BattleHex attackPos = target.at(0).hexValue;
	BattleHex destinationTile = target.at(1).hexValue;
	const CStack * destinationStack = battle.battleGetStackByPos(destinationTile, true);

	if(!destinationStack)
	{
		gameHandler->complain("Invalid target to attack");
		return false;
	}

    if(stack->unitId() == destinationStack->unitId() || !CStack::isMeleeAttackPossible(stack, destinationStack, attackPos))
    {
        gameHandler->complain("Invalid melee attack destination");
        return false;
    }
    EraPetrificationSequence petrification;
    const auto beforeMovement = [&]()
    {
        petrification.beforeAction(*gameHandler,battle,stack,destinationStack);
        // Original75CAE1 c selector precedes75CB09 p/J/j; these primary
        // action records run once BEFORE movement and preemptive strikes.
        era_compat_server::runSourceExperience(*gameHandler,battle,stack,destinationStack,era_bridge::SourceXpPhase::Before);
        era_compat_server::confluxExperienceCasts(*gameHandler,battle,stack,destinationStack,false);
        era_compat_server::primordialExperienceCasts(*gameHandler,battle,stack,destinationStack,false);
    // Apply once per accepted melee action, before movement, first strike or retaliation.
    // Extra attacks within this action share the resulting authoritative stats.
    if(era_compat::Policies::get().meleeRage(stack->creatureId().toCreature()->getJsonKey()))
    {
        const auto transfer = ::era_bridge::beforeMeleeStatTransfer(::era_bridge::ActionKind::MeleeAttack,
            stack->getAttack(false), stack->getDefense(false));
        if(transfer.applied)
        {
            SetStackEffect effect;
            effect.battleID = battle.getBattle()->getBattleID();
            std::vector<Bonus> bonuses;
            bonuses.emplace_back(BonusDuration::ONE_BATTLE, BonusType::PRIMARY_SKILL, BonusSource::OTHER,
                transfer.attackDelta, BonusSourceID(), BonusSubtypeID(PrimarySkill::ATTACK), BonusValueType::ADDITIVE_VALUE);
            bonuses.emplace_back(BonusDuration::ONE_BATTLE, BonusType::PRIMARY_SKILL, BonusSource::OTHER,
                transfer.defenseDelta, BonusSourceID(), BonusSubtypeID(PrimarySkill::DEFENSE), BonusValueType::ADDITIVE_VALUE);
            effect.toAdd.emplace_back(ba.stackNumber, std::move(bonuses));
            gameHandler->sendAndApply(effect);
        }
    }
    };

	BattleHex startingPos = stack->getPosition();
	int beforeAttackSpeed = stack->getMovementRange(0);
	const auto movementResult = moveStack(battle, ba.stackNumber, attackPos, beforeMovement);

	logGlobal->trace("%s will attack %s", stack->nodeName(), destinationStack->nodeName());

	if (movementResult.invalidRequest)
	{
		gameHandler->complain("Stack failed attack - unable to reach target!");
		return false;
	}

	if(movementResult.obstacleHit)
	{
		// we were not able to reach destination tile, nor occupy specified hex
		// abort attack attempt, but treat this case as legal - we have stepped onto a quicksands/mine
        petrification.flush(*gameHandler,battle);
		return true;
	}

	if(destinationStack && stack->unitId() == destinationStack->unitId()) //we should just move, it will be handled by following check
	{
		destinationStack = nullptr;
	}

	if(!destinationStack)
	{
		gameHandler->complain("Unit can not attack itself");
		return false;
	}

	if(!CStack::isMeleeAttackPossible(stack, destinationStack))
	{
		gameHandler->complain("Attack cannot be performed!");
		return false;
	}


	//attack
	int totalAttacks = stack->getTotalAttacks(false);

	//TODO: move to CUnitState
	const auto * attackingHero = battle.battleGetFightingHero(ba.side);
	if(attackingHero)
	{
		totalAttacks += attackingHero->valOfBonuses(BonusType::HERO_GRANTS_ATTACKS, BonusSubtypeID(stack->creatureId()));
	}

	static const auto firstStrikeSelector = Selector::typeSubtype(BonusType::FIRST_STRIKE, BonusCustomSubtype::damageTypeAll).Or(Selector::typeSubtype(BonusType::FIRST_STRIKE, BonusCustomSubtype::damageTypeMelee));
	// Original Amethyst Before_Melee441ADE consumes one retaliation before
	// the first hit. Unlike native FIRST_STRIKE it still allows the ordinary
	// retaliation afterward when the source stack has counters remaining.
	const bool sourcePreemptive = era_compat::Policies::get().preemptiveRetaliation(destinationStack->creatureId().toCreature()->getJsonKey());
	const bool firstStrike = (sourcePreemptive || destinationStack->hasBonus(firstStrikeSelector)) && !destinationStack->hasBonusOfType(BonusType::NOT_ACTIVE);

    const bool xpRetaliation=era_compat::sourceXpBattleAdmitted(battle);
    std::optional<era_bridge::xp184::AttackFrame> xpIncomingStatus;
    const bool retaliation = destinationStack->ableToRetaliate();
    const auto & sourceCounters = era_compat::FortressCounterstrikes::get();
    const auto defenderKey = destinationStack->creatureId().toCreature()->getJsonKey();
	bool ferocityApplied = false;
	int32_t defenderInitialQuantity = destinationStack->getCount();

	for (int i = 0; i < totalAttacks; ++i)
	{
		//first strike
		if(i == 0 && firstStrike && retaliation && !stack->hasBonusOfType(BonusType::BLOCKS_RETALIATION) && !stack->isInvincible())
		{
			makeAttack(battle, destinationStack, stack, 0, stack->getPosition(), true, false, true, &petrification);
		}

		//move can cause death, eg. by walking into the moat, first strike can cause death or paralysis/petrification
		if(stack->alive() && !stack->hasBonusOfType(BonusType::NOT_ACTIVE) && destinationStack->alive())
		{
            if(xpRetaliation)xpIncomingStatus=era_compat_server::captureXpTimedAttackFrame(*destinationStack,false);
			makeAttack(battle, stack, destinationStack, (i ? 0 : movementResult.distance), destinationTile, i==0, false, false, &petrification);//no distance travelled on second attack

			if(!ferocityApplied && stack->hasBonusOfType(BonusType::FEROCITY))
			{
				auto ferocityBonus = stack->getBonus(Selector::type()(BonusType::FEROCITY));
				int32_t requiredCreaturesToKill = ferocityBonus->parameters ? ferocityBonus->parameters->toNumber() : 1;
				if(defenderInitialQuantity - destinationStack->getCount() >= requiredCreaturesToKill)
				{
					ferocityApplied = true;
					int additionalAttacksCount = stack->valOfBonuses(BonusType::FEROCITY);
					totalAttacks += additionalAttacksCount;
				}
			}
		}

		//counterattack
		//we check retaliation twice, so if it unblocked during attack it will work only on next attack
		if(stack->alive()
			&& (!stack->hasBonusOfType(BonusType::BLOCKS_RETALIATION) || sourceCounters.fury(defenderKey)
                || era_compat::OriginalRetaliationShield::get().equipped(battle,*destinationStack))
			&& !stack->isInvincible()
			&& (i == 0 && (!firstStrike || sourcePreemptive))
            && retaliation && destinationStack->ableToRetaliate()
            && (!xpIncomingStatus||era_bridge::xp184::normalRetaliationAllowed(*xpIncomingStatus,
                destinationStack->alive(),destinationStack->counterAttacks.available(),
                era_compat::readXpTimed184(*destinationStack,70).state.active(),false,true)))
		{
            //441B4F..55 flips CURRENT side for the normal441330 counter,
            //441B67..72 restores it. Before_strike's earlier call does NOT.
            const auto sourceCurrent=era_compat::confluxActiveSide(battle);
            const auto counterSide=sourceCurrent==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
            era_compat::ConfluxCurrentSideScope sourceCounterSide(counterSide);
            std::optional<era_bridge::SourceXpRetaliationScope> xpCounterDamage;
            if(xpIncomingStatus)xpCounterDamage.emplace(destinationStack->unitId(),era_bridge::xp184::retaliationPercent(*xpIncomingStatus));
            const bool twice = sourceCounters.twice(defenderKey);
            // DLL10018030 injects the second441330 before original441B7E
            // decrements the counter ONCE. Both hits retain counter semantics.
            makeAttack(battle, destinationStack, stack, 0, stack->getPosition(), true, false, true, &petrification, !twice);
            if(twice)
            {
                makeAttack(battle, destinationStack, stack, 0, stack->getPosition(), true, false, true, &petrification, false);
                auto state = destinationStack->acquireState();
                state->counterAttacks.use();
                BattleUnitsChanged change;
                change.battleID = battle.getBattle()->getBattleID();
                change.changedStacks.emplace_back(destinationStack->unitId(), UnitChanges::EOperation::RESET_STATE);
                state->save(change.changedStacks.back().data);
                gameHandler->sendAndApply(change);
            }
            // Amethyst441B62 runs only after the normal441330 response,
            // before441B67 restores CURRENT. Preemptive strikes never reach it.
            era_compat_server::applySulfideStatuses(*gameHandler,battle,destinationStack,stack->getPosition());
            era_compat_server::confluxAfterRetaliation(*gameHandler,battle,destinationStack,stack);
            era_compat_server::primordialAfterMelee(*gameHandler,battle,destinationStack,stack);
		}
	}

    era_compat_server::confluxAfterMelee(*gameHandler,battle,stack,destinationStack);
    era_compat_server::primordialAfterMelee(*gameHandler,battle,stack,destinationStack);

    // Original468C99 consumes queued per-target spells after all strikes.
    petrification.flush(*gameHandler, battle);

    // Source445780 calls469020 only after retaliation and double strikes.
    applyEraRebirth(*gameHandler, battle);

    era_compat_server::finishSourceXpPrimaryAttack(*gameHandler,battle,stack);

    // ERA sub478230 sets DONE after the complete melee/retaliation sequence,
    // before the return movement. StartAction.movedThisRound is too early.
    markEraDoneRound(*gameHandler, battle, stack);

	//return
	if(stack->hasBonusOfType(BonusType::RETURN_AFTER_STRIKE)
		&& !stack->hasBonusOfType(BonusType::NOT_ACTIVE)
		&& !stack->hasBonusOfType(BonusType::BIND_EFFECT)
		&& target.size() == 3
		&& startingPos != stack->getPosition()
		&& startingPos == target.at(2).hexValue
		&& stack->alive())
	{
		assert(stack->unitId() == ba.stackNumber);
		int afterAttackSpeed = stack->getMovementRange(0);
		std::pair<BattleHexArray, int> path = battle.getPath(stack->getPosition(), startingPos, stack);
		size_t maxReachbleIndex = std::max(0, beforeAttackSpeed - afterAttackSpeed);
		if(maxReachbleIndex < path.first.size())
			moveStack(battle, ba.stackNumber, path.first[maxReachbleIndex]);
	}
    // Amethyst46453E: CFG statuses after the completed primary action6.
    era_compat_server::applySulfideStatuses(*gameHandler,battle,stack,destinationTile);
	return true;
}

bool BattleActionProcessor::doShootAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);

	if (!canStackAct(battle, stack))
		return false;

	if(target.empty())
	{
		gameHandler->complain("Destination required for shot action.");
		return false;
	}

	auto destination = target.at(0).hexValue;

	const CStack * destinationStack = battle.battleGetStackByPos(destination);

	if (!battle.battleCanShoot(stack, destination))
	{
		gameHandler->complain("Cannot shoot!");
		return false;
	}

	const bool emptyTileAreaAttack = battle.battleCanTargetEmptyHex(stack);

	if (!destinationStack && !emptyTileAreaAttack)
	{
		gameHandler->complain("No target to shoot!");
		return false;
	}

    EraPetrificationSequence petrification;
    petrification.beforeAction(*gameHandler,battle,stack,destinationStack,false);
    era_compat_server::runSourceExperience(*gameHandler,battle,stack,destinationStack,era_bridge::SourceXpPhase::Before);
        era_compat_server::confluxExperienceCasts(*gameHandler,battle,stack,destinationStack,false);
    era_compat_server::primordialExperienceCasts(*gameHandler,battle,stack,destinationStack,false);
	bool firstStrike = false;
	if(!emptyTileAreaAttack)
	{
		static const auto firstStrikeSelector = Selector::typeSubtype(BonusType::FIRST_STRIKE, BonusCustomSubtype::damageTypeAll).Or(Selector::typeSubtype(BonusType::FIRST_STRIKE, BonusCustomSubtype::damageTypeRanged));
		firstStrike = destinationStack->hasBonus(firstStrikeSelector) && !destinationStack->hasBonusOfType(BonusType::NOT_ACTIVE);
	}

	if (!firstStrike)
		makeAttack(battle, stack, destinationStack, 0, destination, true, true, false, &petrification);

	//ranged counterattack
	if (!emptyTileAreaAttack
		&& destinationStack->hasBonusOfType(BonusType::RANGED_RETALIATION)
        && (era_compat::BankActors::get().sourceId(destinationStack->unitType()->getJsonKey())==281
            ? era_compat::StatusAttacks::get().id(stack->unitType()->getJsonKey())!=149
            : !stack->hasBonusOfType(BonusType::BLOCKS_RANGED_RETALIATION))
		&& destinationStack->ableToRetaliate()
		&& battle.battleCanShoot(destinationStack, stack->getPosition())
		&& stack->alive()) //attacker may have died (fire shield)
	{
		makeAttack(battle, destinationStack, stack, 0, stack->getPosition(), true, true, true, &petrification);
	}
	//allow more than one additional attack

	int totalRangedAttacks = stack->getTotalAttacks(true);

	//TODO: move to CUnitState
	const auto * attackingHero = battle.battleGetFightingHero(ba.side);
	if(attackingHero)
	{
		totalRangedAttacks += attackingHero->valOfBonuses(BonusType::HERO_GRANTS_ATTACKS, BonusSubtypeID(stack->creatureId()));
	}

	for(int i = firstStrike ? 0:1; i < totalRangedAttacks; ++i)
	{
		if(stack->alive()
			&& (emptyTileAreaAttack || destinationStack->alive())
			&& stack->shots.canUse())
		{
			makeAttack(battle, stack, destinationStack, 0, destination, false, true, false, &petrification);
		}
	}

    era_compat_server::dwellingAfterShot(*gameHandler,battle,stack,destinationStack);
    petrification.flush(*gameHandler,battle);
    era_compat_server::finishSourceXpPrimaryAttack(*gameHandler,battle,stack);
    // Same46453E service accepts primary action7, never ranged retaliation.
    era_compat_server::applySulfideStatuses(*gameHandler,battle,stack,destination);
	return true;
}

bool BattleActionProcessor::doCatapultAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);

	if (!canStackAct(battle, stack))
		return false;

	std::shared_ptr<const Bonus> catapultAbility = stack->getFirstBonus(Selector::type()(BonusType::CATAPULT));
	if(!catapultAbility || catapultAbility->subtype == BonusSubtypeID())
	{
		gameHandler->complain("We do not know how to shoot :P");
	}
	else
	{
		const CSpell * spell = catapultAbility->subtype.as<SpellID>().toSpell();
		spells::BattleCast parameters(&battle, stack, spells::Mode::SPELL_LIKE_ATTACK, spell); //We can shot infinitely by catapult
		auto shotLevel = stack->valOfBonuses(Selector::typeSubtype(BonusType::CATAPULT_EXTRA_SHOTS, catapultAbility->subtype));
		parameters.setSpellLevel(shotLevel);
		parameters.cast(gameHandler->spellcastEnvironment(), target);
	}
	return true;
}

bool BattleActionProcessor::doUnitSpellAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);
	SpellID spellID = ba.spell;

	if (!canStackAct(battle, stack))
		return false;

	std::shared_ptr<const Bonus> randSpellcaster = stack->getBonus(Selector::type()(BonusType::RANDOM_SPELLCASTER));
	std::shared_ptr<const Bonus> spellcaster = stack->getBonus(Selector::typeSubtype(BonusType::SPELLCASTER, BonusSubtypeID(spellID)));

	if (!spellcaster && !randSpellcaster)
	{
		gameHandler->complain("That stack can't cast spells!");
		return false;
	}

	if (randSpellcaster)
	{
		if (target.size() != 1)
		{
			gameHandler->complain("Invalid target for random spellcaster!");
			return false;
		}

		const battle::Unit * subject = target[0].unitValue;
		if (target[0].unitValue == nullptr)
			subject = battle.battleGetStackByPos(target[0].hexValue, true);

		if (subject == nullptr)
		{
			gameHandler->complain("Invalid target for random spellcaster!");
			return false;
		}

		spellID = battle.getRandomBeneficialSpell(gameHandler->getRandomGenerator(), stack, subject);

		if (spellID == SpellID::NONE)
		{
			gameHandler->complain("That stack can't cast spells!");
			return false;
		}
	}

	const CSpell * spell = SpellID(spellID).toSpell();
    const bool sourceFaerie=era_compat::sourceFaeriePoolActor(stack);
    const bool sourcePrimordial=era_compat::PrimordialPolicies::get().owns(stack->unitType()->getJsonKey());
    auto sourceSide=stack->unitSide();
    if(stack->isHypnotized())sourceSide=sourceSide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    era_compat::ConfluxCaster sourceCaster(stack,battle.battleGetFightingHero(sourceSide),battle.sideToPlayer(sourceSide));
    std::optional<era_compat::ConfluxSideScope> sourceContext;
    if(sourceFaerie || sourcePrimordial)sourceContext.emplace(sourceSide,1);
	spells::BattleCast parameters(&battle, (sourceFaerie || sourcePrimordial)?static_cast<const spells::Caster *>(&sourceCaster):stack, spells::Mode::CREATURE_ACTIVE, spell);
	int32_t spellLvl = 0;
	if(spellcaster)
		vstd::amax(spellLvl, spellcaster->val);
	if(randSpellcaster)
	{
		vstd::amax(spellLvl, randSpellcaster->val);
	}
	parameters.setSpellLevel(spellLvl);
    if(sourceFaerie && !spell->battleMechanics(&parameters)->canBeCastAt(target))
    {
        return false;
    }
    if(sourceFaerie && spellID==SpellID(19))
    {
        return era_compat_server::applyFaerieNormalChain(*gameHandler,battle,stack,
            target.empty()?nullptr:battle.battleGetStackByPos(target.front().hexValue,true),parameters,sourceSide);
    }
	parameters.cast(gameHandler->spellcastEnvironment(), target);

	processBattleEventTriggers(battle, CombatEventType::UNIT_SPELLCAST, stack, nullptr);
	return true;
}

bool BattleActionProcessor::doHealAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);

	if (!canStackAct(battle, stack))
		return false;

	if(target.empty())
	{
		gameHandler->complain("Destination required for heal action.");
		return false;
	}

	const battle::Unit * destStack = nullptr;
	std::shared_ptr<const Bonus> healerAbility = stack->getFirstBonus(Selector::type()(BonusType::HEALER));

	if(target.at(0).unitValue)
		destStack = target.at(0).unitValue;
	else
		destStack = battle.battleGetUnitByPos(target.at(0).hexValue);

	if(stack == nullptr || destStack == nullptr || !healerAbility || !healerAbility->subtype.hasValue())
	{
		gameHandler->complain("There is either no healer, no destination, or healer cannot heal :P");
	}
	else
	{
		const CSpell * spell = healerAbility->subtype.as<SpellID>().toSpell();
		spells::BattleCast parameters(&battle, stack, spells::Mode::SPELL_LIKE_ATTACK, spell); //We can heal infinitely by first aid tent
		auto dest = battle::Destination(destStack, target.at(0).hexValue);
		parameters.setSpellLevel(0);
		parameters.cast(gameHandler->spellcastEnvironment(), {dest});
	}
	return true;
}

bool BattleActionProcessor::doWalkAndSpellcastAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
	battle::Target target = ba.getTarget(&battle);
	SpellID spellID = ba.spell;

	if (!canStackAct(battle, stack))
		return false;

	if(target.size() < 2)
	{
		gameHandler->complain("Two destinations required for walk and spellcast action.");
		return false;
	}

	BattleHex movementDestinationTile = target.at(0).hexValue;
	BattleHex targetUnitTile = target.at(1).hexValue;
	const CStack * destinationStack = battle.battleGetStackByPos(targetUnitTile, false);

	if(!destinationStack)
	{
		gameHandler->complain("Invalid target for walk and spellcast");
		return false;
	}

	auto bonus = stack->getBonus(Selector::typeSubtype(BonusType::ADJACENT_SPELLCASTER, BonusSubtypeID(spellID)));
	if (!bonus)
	{
		gameHandler->complain("Creature cannot walk and spellcast.");
		return false;
	}

	const auto movementResult = moveStack(battle, ba.stackNumber, movementDestinationTile);

	if (movementResult.invalidRequest)
	{
		gameHandler->complain("Stack failed walk and spellcast - unable to reach target!");
		return false;
	}

	if(movementResult.obstacleHit)
	{
		return true;
	}

	const CSpell * spell = spellID.toSpell();
	spells::BattleCast parameters(&battle, stack, spells::Mode::CREATURE_ACTIVE, spell);
	battle::Target spellTarget;
	spellTarget.emplace_back(destinationStack);
	parameters.setSpellLevel(std::max(0, bonus->val));
	parameters.cast(gameHandler->spellcastEnvironment(), spellTarget);

	return true;
}

bool BattleActionProcessor::canStackAct(const CBattleInfoCallback & battle, const CStack * stack)
{
	if (!stack)
	{
		gameHandler->complain("No such stack!");
		return false;
	}
	if (!stack->alive())
	{
		gameHandler->complain("This stack is dead: " + stack->nodeName());
		return false;
	}

	if (battle.battleTacticDist())
	{
		if (stack && stack->unitSide() != battle.battleGetTacticsSide())
		{
			gameHandler->complain("This is not a stack of side that has tactics!");
			return false;
		}
	}
	else
	{
		if (stack != battle.battleActiveUnit())
		{
			gameHandler->complain("Action has to be about active stack!");
			return false;
		}
	}
	return true;
}

bool BattleActionProcessor::dispatchBattleAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	switch(ba.actionType)
	{
		case EActionType::BAD_MORALE:
		case EActionType::NO_ACTION:
			return doEmptyAction(battle, ba);
		case EActionType::END_TACTIC_PHASE:
			return doEndTacticsAction(battle, ba);
		case EActionType::RETREAT:
			return doRetreatAction(battle, ba);
		case EActionType::SURRENDER:
			return doSurrenderAction(battle, ba);
		case EActionType::HERO_SPELL:
			return doHeroSpellAction(battle, ba);
		case EActionType::WALK:
			return doWalkAction(battle, ba);
		case EActionType::WAIT:
			return doWaitAction(battle, ba);
		case EActionType::DEFEND:
			return doDefendAction(battle, ba);
		case EActionType::WALK_AND_ATTACK:
			return doAttackAction(battle, ba);
		case EActionType::WALK_AND_CAST:
			return doWalkAndSpellcastAction(battle, ba);
		case EActionType::SHOOT:
			return doShootAction(battle, ba);
		case EActionType::CATAPULT:
			return doCatapultAction(battle, ba);
		case EActionType::MONSTER_SPELL:
			return doUnitSpellAction(battle, ba);
		case EActionType::STACK_HEAL:
			return doHealAction(battle, ba);
	}
	gameHandler->complain("Unrecognized action type received!!");
	return false;
}

bool BattleActionProcessor::makeBattleActionImpl(const CBattleInfoCallback & battle, const BattleAction &ba)
{
    auto sourceNativeAccess=era_compat_server::sourceXpNativeAccess(battle);
    era_compat::XpTimed184NativeAccessScope sourceNativeScope(sourceNativeAccess);
	era_compat::OrbChaosActionScope sourceAction(ba.actionType==EActionType::HERO_SPELL);
	logGlobal->trace("Making action: %s", ba.toString());
	const CStack * stack = battle.battleGetStackByID(ba.stackNumber);
    // Preserve the original hero-cast target even if its corpse disappears.
    std::optional<EraHorn266Target> hornPrimary,hornActor;
    if(era_compat::Horn266Policy::enabled() && (ba.actionType==EActionType::HERO_SPELL || ba.actionType==EActionType::MONSTER_SPELL))
    {
        const auto targets=ba.getTarget(&battle);
        if(!targets.empty())
        {
            const CStack * primary=nullptr;
            if(targets.front().unitValue)primary=battle.battleGetStackByID(targets.front().unitValue->unitId(),false);
            else primary=battle.battleGetStackByPos(targets.front().hexValue,false);
            hornPrimary=captureEraHorn266Target(primary);
        }
        const auto * active=battle.battleActiveUnit();
        hornActor=captureEraHorn266Target(active?battle.battleGetStackByID(active->unitId(),false):nullptr);
    }
    std::optional<uint32_t> artifactMainTarget;
    if(ba.actionType==EActionType::HERO_SPELL)
    {
        const auto targets=ba.getTarget(&battle);
        if(!targets.empty())
        {
            if(targets.front().unitValue)artifactMainTarget=targets.front().unitValue->unitId();
            else if(const auto * target=battle.battleGetStackByPos(targets.front().hexValue,false))artifactMainTarget=target->unitId();
        }
    }

	// StartAction marks the stack as having waited, so check before broadcasting it.
	if (ba.actionType == EActionType::WAIT)
	{
		if (!canStackAct(battle, stack))
			return false;
		if (stack->waitedThisTurn)
		{
			gameHandler->complain("This stack has already waited this round!");
			return false;
		}
	}

    // Capture source bit27 before native StartAction marks THIS DEFEND.
    const auto * sourceDefender=ba.actionType==EActionType::DEFEND&&stack&&era_compat_server::sourceDefendBattleEnrolled(battle)?stack:nullptr;
    era_bridge::SourceDefendActionScope sourceDefendAction(sourceDefender,sourceDefender&&sourceDefender->defended(0));

	// for these events client does not expects StartAction/EndAction wrapper
	if (!ba.isBattleEndAction())
	{
		StartAction startAction(ba);
		startAction.battleID = battle.getBattle()->getBattleID();
		gameHandler->sendAndApply(startAction);
	}

	bool result = dispatchBattleAction(battle, ba);

    if(result && (ba.actionType == EActionType::SHOOT
        || ba.actionType == EActionType::HERO_SPELL
        || ba.actionType == EActionType::MONSTER_SPELL
        || ba.actionType == EActionType::WALK_AND_CAST
        || ba.actionType == EActionType::CATAPULT))
        applyEraRebirth(*gameHandler, battle);

    if(result && (ba.actionType==EActionType::HERO_SPELL || ba.actionType==EActionType::MONSTER_SPELL))
        applyEraHorn266Spell(*gameHandler,battle,ba.side,hornPrimary,hornActor);

    if(result && ba.actionType==EActionType::HERO_SPELL)
        if(const auto * hero=battle.battleGetFightingHero(ba.side))
            applyEraArtifactMassSpell(*gameHandler,battle,*hero,ba.spell,ba.side,artifactMainTarget);

    // Ranged attacks, activated creature spells and ordinary moves become
    // DONE only after their synchronous action completes. WAIT and hero casts
    // do not set a creature DONE bit; tactics moves are also excluded.
    if(result && ba.isUnitAction() && !battle.battleTacticDist()
        && ba.actionType != EActionType::WAIT
        && ba.actionType != EActionType::HERO_SPELL)
    {
        markEraDoneRound(*gameHandler, battle, stack);
    }

    if(result && !ba.isBattleEndAction())applyEraCreatureSpellCleanse(*gameHandler,battle);
    if(result && (ba.actionType==EActionType::HERO_SPELL || ba.actionType==EActionType::MONSTER_SPELL))
    {
        removeEraOblivionCorpses(*gameHandler,battle);
    }

	if (!ba.isBattleEndAction())
	{
		EndAction endAction;
		endAction.battleID = battle.getBattle()->getBattleID();
		gameHandler->sendAndApply(endAction);
	}

	if(ba.actionType == EActionType::WAIT || ba.actionType == EActionType::DEFEND || ba.actionType == EActionType::SHOOT || ba.actionType == EActionType::MONSTER_SPELL)
		battle.handleObstacleTriggersForUnit(*gameHandler->spellEnv, *stack);

    //479223/441CAD consumes old obstacles BEFORE Amethyst479231 creates
    //355's new wall. A wall placed under its caster must not hit it here.
    if(result && ba.actionType==EActionType::DEFEND)
        era_compat_server::confluxAfterDefend(*gameHandler,battle,stack);

	return result;
}

BattleActionProcessor::MovementResult BattleActionProcessor::moveStack(const CBattleInfoCallback & battle, int stack, BattleHex dest, const std::function<void()> & beforeMovement)
{
	const CStack *currentUnit = battle.battleGetStackByID(stack);
	const CStack *stackAtEnd = battle.battleGetStackByPos(dest);

	assert(currentUnit);
	assert(dest < GameConstants::BFIELD_SIZE);

	if (battle.battleGetTacticDist())
	{
		assert(battle.isInTacticRange(dest));
	}

	auto start = currentUnit->getPosition();
	if (start == dest)
    {
        if(beforeMovement)
            beforeMovement();
        return { 0, false, false };
    }

	//initing necessary tables
	auto accessibility = battle.getAccessibility(currentUnit);
	BattleHexArray passed;
	//Ignore obstacles on starting position
	passed.insert(currentUnit->getPosition());
	if(currentUnit->doubleWide())
		passed.insert(currentUnit->occupiedHex());

	//shifting destination (if we have double wide stack and we can occupy dest but not be exactly there)
	if(!stackAtEnd && currentUnit->doubleWide() && !accessibility.accessible(dest, currentUnit))
	{
		BattleHex shifted = dest.cloneInDirection(currentUnit->headDirection(), false);

		if(accessibility.accessible(shifted, currentUnit))
			dest = shifted;
	}

	if((stackAtEnd && stackAtEnd!=currentUnit && stackAtEnd->alive()) || !accessibility.accessible(dest, currentUnit))
	{
		gameHandler->complain("Given destination is not accessible!");
		return { 0, false, true };
	}

	bool canUseGate = false;
	auto dbState = battle.battleGetGateState();
	if(battle.battleGetFortifications().wallsHealth > 0 && currentUnit->unitSide() == BattleSide::DEFENDER &&
		dbState != EGateState::DESTROYED &&
		dbState != EGateState::BLOCKED)
	{
		canUseGate = true;
	}

	auto [unitPath, pathDistance] = battle.getPath(start, dest, currentUnit);
	bool movementSuccess = true;

	int unitMovementRange = currentUnit->getMovementRange(0);

	if (battle.battleGetTacticDist() > 0 && unitMovementRange > 0)
		unitMovementRange = GameConstants::BFIELD_SIZE;

	if (pathDistance > unitMovementRange)
	{
		gameHandler->complain("Given destination is not reachable!");
		return { 0, false, true };
	}

    // All path validation succeeded; ERA OnBeforeBattleAction precedes any
    // obstacle/moat damage along the accepted movement path.
    if(beforeMovement)
    {
        beforeMovement();
    }

	bool hasWideMoat = vstd::contains_if(battle.battleGetAllObstaclesOnPos(BattleHex(BattleHex::GATE_BRIDGE), false), [](const std::shared_ptr<const CObstacleInstance> & obst)
	{
		return obst->obstacleType == CObstacleInstance::MOAT;
	});

	auto isGateDrawbridgeHex = [&](const BattleHex & hex) -> bool
	{
		if (hasWideMoat && hex == BattleHex::GATE_BRIDGE)
			return true;
		if (hex == BattleHex::GATE_OUTER)
			return true;
		if (hex == BattleHex::GATE_INNER)
			return true;

		return false;
	};

	auto occupyGateDrawbridgeHex = [&](const BattleHex & hex) -> bool
	{
		if (isGateDrawbridgeHex(hex))
			return true;

		if (currentUnit->doubleWide())
		{
			BattleHex otherHex = currentUnit->occupiedHex(hex);
			if (otherHex.isValid() && isGateDrawbridgeHex(otherHex))
				return true;
		}

		return false;
	};

	if (currentUnit->hasBonusOfType(BonusType::FLYING))
	{
		if (pathDistance <= unitMovementRange && !unitPath.empty())
		{
			if (canUseGate && dbState != EGateState::OPENED &&
				occupyGateDrawbridgeHex(dest))
			{
				BattleUpdateGateState db;
				db.battleID = battle.getBattle()->getBattleID();
				db.state = EGateState::OPENED;
				gameHandler->sendAndApply(db);
			}

			//inform clients about move
			BattleStackMoved sm;
			sm.battleID = battle.getBattle()->getBattleID();
			sm.stack = currentUnit->unitId();
			BattleHexArray tiles;
			tiles.insert(unitPath[0]);
			sm.tilesToMove = tiles;
			sm.distance = pathDistance;
			sm.teleporting = false;
			gameHandler->sendAndApply(sm);
		}
	}
	else //for non-flying creatures
	{
		BattleHexArray tiles;
		const int tilesToMove = std::max<int>(unitPath.size() - unitMovementRange, 0);
		int movementsLeft = static_cast<int>(unitPath.size())-1;
		unitPath.insert(start);

		// check if gate need to be open or closed at some point
		BattleHex openGateAtHex;
		BattleHex gateMayCloseAtHex;
		if (canUseGate)
		{
			for (int i = static_cast<int>(unitPath.size())-1; i >= 0; i--)
			{
				auto needOpenGates = [hasWideMoat, i, unitPath = unitPath](const BattleHex & hex) -> bool
				{
					if (hasWideMoat && hex == BattleHex::GATE_BRIDGE)
						return true;
					if (hex == BattleHex::GATE_BRIDGE && i-1 >= 0 && unitPath[i-1] == BattleHex::GATE_OUTER)
						return true;
					if (hex == BattleHex::GATE_OUTER || hex == BattleHex::GATE_INNER)
						return true;

					return false;
				};

				auto hex = unitPath[i];
				if (!openGateAtHex.isValid() && dbState != EGateState::OPENED)
				{
					if (needOpenGates(hex))
						openGateAtHex = unitPath[i+1];

					//TODO we need find better way to handle double-wide stacks
					//currently if only second occupied stack part is standing on gate / bridge hex then stack will start to wait for bridge to lower before it's needed. Though this is just a visual bug.
					if (currentUnit->doubleWide() && i + 2 < unitPath.size())
					{
						BattleHex otherHex = currentUnit->occupiedHex(hex);
						if (otherHex.isValid() && needOpenGates(otherHex))
							openGateAtHex = unitPath[i+2];
					}

					//gate may be opened and then closed during stack movement, but not other way around
					if (openGateAtHex.isValid())
						dbState = EGateState::OPENED;
				}

				if (!gateMayCloseAtHex.isValid() && dbState != EGateState::CLOSED)
				{
					if (hex == BattleHex::GATE_INNER && i-1 >= 0 && unitPath[i-1] != BattleHex::GATE_OUTER)
					{
						gateMayCloseAtHex = unitPath[i-1];
					}
					if (hasWideMoat)
					{
						if (hex == BattleHex::GATE_BRIDGE && i-1 >= 0 && unitPath[i-1] != BattleHex::GATE_OUTER)
						{
							gateMayCloseAtHex = unitPath[i-1];
						}
						else if (hex == BattleHex::GATE_OUTER && i-1 >= 0 &&
							unitPath[i-1] != BattleHex::GATE_INNER &&
							unitPath[i-1] != BattleHex::GATE_BRIDGE)
						{
							gateMayCloseAtHex = unitPath[i-1];
						}
					}
					else if (hex == BattleHex::GATE_OUTER && i-1 >= 0 && unitPath[i-1] != BattleHex::GATE_INNER)
					{
						gateMayCloseAtHex = unitPath[i-1];
					}
				}
			}
		}

		while(movementSuccess)
		{
			if (movementsLeft<tilesToMove)
				throw std::runtime_error("Movement terminated abnormally");

			bool gateStateChanging = false;
			//special handling for opening gate on from starting hex
			if (openGateAtHex.isValid() && openGateAtHex == start)
				gateStateChanging = true;
			else
			{
				for (bool obstacleHit = false; (!obstacleHit) && (!gateStateChanging) && (movementsLeft >= tilesToMove); --movementsLeft)
				{
					BattleHex hex = unitPath[movementsLeft];
					tiles.insert(hex);

					if ((openGateAtHex.isValid() && openGateAtHex == hex) ||
						(gateMayCloseAtHex.isValid() && gateMayCloseAtHex == hex))
					{
						gateStateChanging = true;
					}

					//if we walked onto something, finalize this portion of stack movement check into obstacle
					if(!battle.battleGetAllObstaclesOnPos(hex, false).empty())
						obstacleHit = true;

					if (currentUnit->doubleWide())
					{
						BattleHex otherHex = currentUnit->occupiedHex(hex);
						//two hex creature hit obstacle by backside
						auto obstacle2 = battle.battleGetAllObstaclesOnPos(otherHex, false);
						if(otherHex.isValid() && !obstacle2.empty())
							obstacleHit = true;
					}
					if(!obstacleHit)
						passed.insert(hex);
				}
			}

			if (!tiles.empty())
			{
				//commit movement
				BattleStackMoved sm;
				sm.battleID = battle.getBattle()->getBattleID();
				sm.stack = currentUnit->unitId();
				sm.distance = pathDistance;
				sm.teleporting = false;
				sm.tilesToMove = tiles;
				gameHandler->sendAndApply(sm);
				tiles.clear();
			}

			//we don't handle obstacle at the destination tile -> it's handled separately in the if at the end
			if (currentUnit->getPosition() != dest)
			{
				if(movementSuccess && start != currentUnit->getPosition())
				{
					movementSuccess &= battle.handleObstacleTriggersForUnit(*gameHandler->spellEnv, *currentUnit, passed);
					passed.insert(currentUnit->getPosition());
					if(currentUnit->doubleWide())
						passed.insert(currentUnit->occupiedHex());
				}
				if (gateStateChanging)
				{
					if (currentUnit->getPosition() == openGateAtHex)
					{
						openGateAtHex = BattleHex();
						//only open gate if stack is still alive
						if (currentUnit->alive())
						{
							BattleUpdateGateState db;
							db.battleID = battle.getBattle()->getBattleID();
							db.state = EGateState::OPENED;
							gameHandler->sendAndApply(db);
						}
					}
					else if (currentUnit->getPosition() == gateMayCloseAtHex)
					{
						gateMayCloseAtHex = BattleHex();
						owner->updateGateState(battle);
					}
				}
			}
			else
			{
				//movement finished normally: we reached destination
				break;
			}
		}
	}
	//handle last hex separately for deviation
	if (gameHandler->gameInfo().getSettings().getBoolean(EGameSettings::COMBAT_ONE_HEX_TRIGGERS_OBSTACLES))
	{
		if (dest == battle::Unit::occupiedHex(start, currentUnit->doubleWide(), currentUnit->unitSide())
			|| start == battle::Unit::occupiedHex(dest, currentUnit->doubleWide(), currentUnit->unitSide()))
			passed.clear(); //Just empty passed, obstacles will handled automatically
	}
	if(dest == start) 	//If dest is equal to start, then we should handle obstacles for it anyway
		passed.clear();	//Just empty passed, obstacles will handled automatically
	//handling obstacle on the final field (separate, because it affects both flying and walking stacks)
	movementSuccess &= battle.handleObstacleTriggersForUnit(*gameHandler->spellEnv, *currentUnit, passed);

	return { static_cast<int16_t>(pathDistance), !movementSuccess, false };
}

void BattleActionProcessor::makeAttack(const CBattleInfoCallback & battle, const CStack * attacker, const CStack * defender, int distance, const BattleHex & targetHex, bool first, bool ranged, bool counter, EraPetrificationSequence * petrification, bool consumeCounter)
{
	if(defender && first && !counter)
		handleAttackBeforeCasting(battle, ranged, attacker, defender);

	// If the attacker or defender is not alive before the attack action, the action should be skipped.
	if((!attacker->alive()) || (defender && !defender->alive()))
		return;

    if(era_compat_server::applyDungeonChainShot(*gameHandler,battle,attacker,defender,ranged,counter,consumeCounter))return;
    // Shot4 jumps past source43FAD9, so only the ordinary attack path captures.
    const auto hornTarget=captureEraHorn266Target(defender);

	FireShieldInfo fireShield;
	BattleAttack bat;
	BattleLogMessage blm;
	blm.battleID = battle.getBattle()->getBattleID();
	bat.battleID = battle.getBattle()->getBattleID();
	bat.attackerChanges.battleID = battle.getBattle()->getBattleID();
	bat.stackAttacking = attacker->unitId();
	bat.tile = targetHex;

	std::shared_ptr<battle::CUnitState> attackerState = attacker->acquireState();

	if(ranged)
		bat.flags |= BattleAttack::SHOT;
	if(counter)
		bat.flags |= BattleAttack::COUNTER;

	const int attackerLuck = attacker->luckVal();
	ObjectInstanceID ownerArmy = battle.getBattle()->getSideArmy(attacker->unitSide())->id;

	if(attackerLuck > 0 && gameHandler->randomizer->rollGoodLuck(ownerArmy, attackerLuck))
		bat.flags |= BattleAttack::LUCKY;

	if(attackerLuck < 0 && gameHandler->randomizer->rollBadLuck(ownerArmy, -attackerLuck))
		bat.flags |= BattleAttack::UNLUCKY;

    const int deathBlowChance = attacker->valOfBonuses(BonusType::DOUBLE_DAMAGE_CHANCE);
    const bool sourceDeathBlow = era_compat::Policies::get().deathBlowCRT(attacker->unitType()->getJsonKey())
        && deathBlowChance >= 0 && deathBlowChance <= 100;
    // Explicitly reviewed actors only. The source uses CRT%100+1, without
    // VCMI's per-army adaptive ability bias. Foreign/out-of-domain changes
    // retain the original native route; this does not emulate CRT seed state.
    const bool deathBlow = sourceDeathBlow
        ? era_bridge::rollSourceDeathBlow(deathBlowChance, [&](){ return gameHandler->getRandomGenerator().nextInt(0,32767); })
        : gameHandler->randomizer->rollCombatAbility(ownerArmy, deathBlowChance);
    if(deathBlow)
    {
        bat.flags |= BattleAttack::DEATH_BLOW;
    }

	const auto * ownerHero = battle.battleGetFightingHero(attacker->unitSide());
	if(ownerHero)
	{
		int chance = ownerHero->valOfBonuses(BonusType::BONUS_DAMAGE_CHANCE, BonusSubtypeID(attacker->creatureId()));
		if (gameHandler->randomizer->rollCombatAbility(ownerArmy, chance))
			bat.flags |= BattleAttack::BALLISTA_DOUBLE_DMG;
	}

	battle::HealInfo healInfo;

	// The source custom all-around sweep excludes original allies even under
	// Hypnotize; source350 may therefore sweep without damaging the click target.
	const bool sourceSplash = !ranged && era_compat::Policies::get().sourceSplashRangeOne(attacker->creatureId().toCreature()->getJsonKey());
	if(defender && defender->alive() && (!sourceSplash || defender->unitSide()!=attacker->unitSide()))
		applyBattleEffects(battle, bat, attackerState, fireShield, defender, healInfo, distance, false);

	//multiple-hex normal attack
	const auto & [attackedCreatures, useCustomAnimation] = battle.getAttackedCreatures(attacker, targetHex, bat.shot()); //creatures other than primary target
	for(const CStack * stack : attackedCreatures)
	{
		if(stack != defender && stack->alive()) //do not hit same stack twice
			applyBattleEffects(battle, bat, attackerState, fireShield, stack, healInfo, distance, true);
	}

	if (useCustomAnimation)
		bat.flags |= BattleAttack::CUSTOM_ANIMATION;

	std::shared_ptr<const Bonus> bonus = attacker->getBonus(Selector::type()(BonusType::SPELL_LIKE_ATTACK));
	if(bonus && ranged && bonus->subtype.hasValue()) //TODO: make it work in melee?
	{
		//this is need for displaying hit animation
		bat.flags |= BattleAttack::SPELL_LIKE;
		bat.spellID = bonus->subtype.as<SpellID>();

		//TODO: should spell override creature`s projectile?

		const auto * spell = bat.spellID.toSpell();

		battle::Target target;
		target.emplace_back(defender, targetHex);

		spells::BattleCast event(&battle, attacker, spells::Mode::SPELL_LIKE_ATTACK, spell);
		event.setSpellLevel(bonus->val);

		auto affectedStacks = spell->battleMechanics(&event)->getAffectedStacks(target);

		//TODO: get exact attacked hex for defender

		for(const CStack * stack : affectedStacks)
		{
			if(stack != defender && stack->alive()) //do not hit same stack twice
			{
				applyBattleEffects(battle, bat, attackerState, fireShield, stack, healInfo, distance, true);
			}
		}

		//now add effect info for all attacked stacks
		for (BattleStackAttacked & bsa : bat.bsa)
		{
			if (bsa.attackerID == attacker->unitId()) //this is our attack and not f.e. fire shield
			{
				//this is need for displaying affect animation
				bsa.flags |= BattleStackAttacked::SPELL_EFFECT;
				bsa.spellID = bonus->subtype.as<SpellID>();
			}
		}
	}

	attackerState->afterAttack(ranged, counter && consumeCounter);

	{
		UnitChanges info(attackerState->unitId(), UnitChanges::EOperation::RESET_STATE);
		attackerState->save(info.data);
		bat.attackerChanges.changedStacks.push_back(info);
	}

	if (healInfo.healedHealthPoints > 0)
		bat.flags |= BattleAttack::LIFE_DRAIN;

	gameHandler->sendAndApply(bat);

    if(petrification && !ranged)
    {
        petrification->collect(*gameHandler, battle, attacker, bat, defender);
    }

	{
		const bool multipleTargets = bat.bsa.size() > 1;

		int64_t totalDamage = 0;
		int32_t totalKills = 0;

		for(const BattleStackAttacked & bsa : bat.bsa)
		{
			totalDamage += bsa.damageAmount;
			totalKills += bsa.killedAmount;
		}

		addGenericDamageLog(blm, attackerState, totalDamage);

		if(defender)
			addGenericKilledLog(blm, defender, totalKills, multipleTargets);
	}

	// drain life effect (as well as log entry) must be applied after the attack
	if(healInfo.healedHealthPoints > 0)
	{
		addGenericDrainedLifeLog(blm, attackerState, defender, healInfo.healedHealthPoints);
		addGenericResurrectedLog(blm, attackerState, defender, healInfo.resurrectedCount);
	}

    era_compat_server::applySourceThunder(*gameHandler,battle,ranged,attacker,defender);
    era_compat_server::applyAcidAttack(*gameHandler, battle, ranged, attacker, defender);

    std::optional<era_compat_server::DragonFly241AttackFrame> source241Frame;
    if(defender)
    {
        const auto source241=era_compat_server::source241AfterPhysical(*gameHandler,battle,attacker,defender);
        if(source241.handled)source241Frame.emplace(attacker,defender);
    }

    // Source756DBB calls71DBD8 immediately after4408E0, before the caller's
    //4419A0 FireShield. Keep ordinary VCMI after-attack casts at their old point.
    if(defender)
    {
        attackCasting(battle,ranged,BonusType::SPELL_AFTER_ATTACK,attacker,defender,AttackCastFilter::SourceOnly);
        era_compat_server::runSourceExperience(*gameHandler,battle,attacker,defender,era_bridge::SourceXpPhase::After);
        era_compat_server::confluxExperienceCasts(*gameHandler,battle,attacker,defender,true);
        era_compat_server::primordialExperienceCasts(*gameHandler,battle,attacker,defender,true);
        era_compat_server::applySourceKPoison(*gameHandler,battle,attacker,defender);
    }

    // Source hook441996 follows4408E0/XP casts and precedes4419A0 shield.
    applyEraHorn266Target(*gameHandler,battle,attacker->unitSide(),hornTarget);

	if(!fireShield.empty())
	{
		//todo: this should be "virtual" spell instead, we only need fire spell school bonus here
		const CSpell * fireShieldSpell = SpellID(SpellID::FIRE_SHIELD).toSpell();
		int64_t totalDamage = 0;

		for(const auto & item : fireShield)
		{
			const CStack * actor = item.first;
			int64_t rawDamage = item.second;

			const CGHeroInstance * actorOwner = battle.battleGetFightingHero(actor->unitSide());

            // Source440858 sends reflection straight to443DB0. It does not
            // visit magical vulnerability selector11, or spell protection and
            // caster multipliers before a source L deflection wrapper.
            const auto & sourcePolicy=era_compat::Policies::get();
            const auto & targetKey=attacker->creatureId().toCreature()->getJsonKey();
            const bool sourceDirect=era_compat::sourceMagicReduction(attacker).has_value()
                || sourcePolicy.spellDamageInversion(targetKey)
                || sourcePolicy.physicalDeflection(targetKey).has_value()
                || sourcePolicy.physicalBlock(targetKey).has_value()
                || era_compat::ConfluxPolicies::get().owns(targetKey)
                || era_compat_server::DragonFly241AttackFrame::handles(attacker,defender)
                || (era_compat::sourceXpBattleAdmitted(battle)&&era_compat::sourceXpAnyOwnsActor(targetKey));
            if(!sourceDirect)
            {
                if(actorOwner)
                    rawDamage=fireShieldSpell->adjustRawDamage(actorOwner,attacker,rawDamage);
                else
                    rawDamage=fireShieldSpell->adjustRawDamage(actor,attacker,rawDamage);
            }

			totalDamage+=rawDamage;
			//FIXME: add custom effect on actor
		}

		if (totalDamage > 0)
		{
			BattleStackAttacked bsa;

			bsa.flags |= BattleStackAttacked::FIRE_SHIELD;
			bsa.stackAttacked = attacker->unitId(); //invert
			bsa.attackerID = defender->unitId();
			bool sourceShieldEntered=false;
            bsa.damageAmount = era_compat_server::applySourcePhysicalWrapper(*gameHandler,battle,attacker,totalDamage,&sourceShieldEntered);
            totalDamage = bsa.damageAmount;
			attacker->prepareAttacked(bsa, gameHandler->getRandomGenerator());
            if(sourceShieldEntered&&era_compat::sourceXpBattleAdmitted(battle))bsa.newState.data["eraSourceXpDamageEntered"].Bool()=true;

			StacksInjured pack;
			pack.battleID = battle.getBattle()->getBattleID();
			pack.stacks.push_back(bsa);
			gameHandler->sendAndApply(pack);

			// TODO: this is already implemented in Damage::describeEffect()
			{
				MetaString text;
				text.appendLocalString(EMetaText::GENERAL_TXT, 376);
				text.replaceName(SpellID(SpellID::FIRE_SHIELD));
				text.replaceNumber(totalDamage);
				blm.lines.push_back(std::move(text));
			}
			addGenericKilledLog(blm, attacker, bsa.killedAmount, false);
		}
	}

	gameHandler->sendAndApply(blm);

    removeEraOblivionCorpses(*gameHandler,battle);
	if(defender)
		handleAfterAttackCasting(battle, ranged, attacker, defender);
}

void BattleActionProcessor::attackCasting(const CBattleInfoCallback & battle, bool ranged, BonusType attackMode, const battle::Unit * attacker, const CStack * defender, AttackCastFilter filter)
{
	ObjectInstanceID ownerArmy = battle.getBattle()->getSideArmy(attacker->unitSide())->id;
    const bool sourceEntryAlive=attacker->alive() && defender->alive();

    const auto late66Row=std::find_if(era_bridge::sourceXpAdmissionRows.begin(),era_bridge::sourceXpAdmissionRows.end(),[](const auto &r){return r.sourceId==66;});
    const auto * late66Actor=dynamic_cast<const CStack *>(attacker);
    const bool late66=!ranged&&attackMode==BonusType::SPELL_AFTER_ATTACK&&filter==AttackCastFilter::NativeOnly
        &&late66Actor&&attacker->creatureId().toCreature()->getJsonKey()==late66Row->nativeId
        &&era_compat::sourceXpBattleAdmitted(battle)&&era_compat::SourceXpAdmissionPolicy::get().owns(*late66Row)
        &&era_compat_server::sourceXpModuleEnabled(*gameHandler);
    if(attacker->hasBonusOfType(attackMode)||late66)
    {
        TConstBonusListPtr spells = attacker->getBonuses(Selector::type()(attackMode));
        if(filter==AttackCastFilter::NativeOnly&&attackMode==BonusType::SPELL_AFTER_ATTACK)
            spells=era_compat_server::sorceress193WithoutLegacyCopies(spells,attacker);
        const bool split241=attackMode==BonusType::SPELL_AFTER_ATTACK&&filter!=AttackCastFilter::SourceOnly
            &&era_compat_server::DragonFly241AttackFrame::handles(attacker,defender);
        if(split241)spells=era_compat_server::source241WithoutOwnedNativeDispel(spells,attacker,defender);
		std::set<SpellID> spellsToCast = getSpellsForAttackCasting(spells, defender);
        if(split241||late66)spellsToCast.insert(SpellID(78)); // native custom-only lane at78, not merged with banners.

        std::vector<SpellID> orderedSpells(spellsToCast.begin(), spellsToCast.end());
        // Original71DBD8 executes a before K (then k), independent of SpellID.
        // For the proven231 pair this means Blind62 before Berserk59.
        const auto & sourceContracts = era_compat::ExperienceAttackSpells::get();
        const auto creatureKey = attacker->creatureId().toCreature()->getJsonKey();
        const auto priority = [&](SpellID id)
        {
            if(sourceContracts.mastery(creatureKey, id.toSpell()->getJsonKey(), attackMode) < 0) return 2;
            return id == SpellID(SpellID::BLIND) ? 0 : 1;
        };
        if(attackMode == BonusType::SPELL_AFTER_ATTACK)
            std::stable_sort(orderedSpells.begin(), orderedSpells.end(), [&](SpellID lhs, SpellID rhs) { return priority(lhs) < priority(rhs); });
		for(SpellID spellID : orderedSpells)
		{
            if(late66&&spellID==SpellID(78))
                era_compat_server::castXpDispel78LegacyLate(*gameHandler,battle,late66Actor,defender,*late66Row,
                    late66Actor->base?late66Actor->base->getExpRank():0,true,ranged);
            if(split241&&spellID==SpellID(78)&&era_compat_server::DragonFly241AttackFrame::consumeLate(attacker,defender))
                era_compat_server::castSourceDragonFly241CustomLate(*gameHandler,battle,dynamic_cast<const CStack *>(attacker),defender,true);
            // STONE selector5 is queued by the melee sequence service, including
            // counterstrikes; never cast an inherited immediate copy.
            const int sourceMastery = sourceContracts.mastery(creatureKey, spellID.toSpell()->getJsonKey(), attackMode);
            const bool sourceExperienceCast = sourceMastery >= 0;
            if((filter==AttackCastFilter::SourceOnly && !sourceExperienceCast)
                || (filter==AttackCastFilter::NativeOnly && sourceExperienceCast))continue;
            const bool queuedIntrinsic = (spellID == SpellID(SpellID::STONE_GAZE)
                && era_compat::Policies::get().petrification(creatureKey))
                || (spellID == SpellID(SpellID::BLIND)
                && era_compat::Policies::get().blindness(creatureKey));
            if(queuedIntrinsic && !sourceExperienceCast) continue;
            //71D98D/71D9A0 reject a dead caster or target before any RNG draws.
            if(sourceExperienceCast && !sourceEntryAlive) continue;
			bool castMe = false;
			if(!defender->alive() && !sourceExperienceCast)
			{
				logGlobal->debug("attackCasting: all attacked creatures have been killed");
				return;
			}
			int32_t spellLevel = 0;
			TConstBonusListPtr spellsByType = attacker->getBonuses(Selector::typeSubtype(attackMode, BonusSubtypeID(spellID)));
            if(split241)spellsByType=era_compat_server::source241WithoutOwnedNativeDispel(spellsByType,attacker,defender);
            if((split241||late66)&&spellsByType->empty())continue;
			for(const auto & sf : *spellsByType)
			{
				int meleeRanged = -1;
				if (sf->parameters)
				{
					vstd::amax(spellLevel, sf->parameters->toVector()[0]);
					meleeRanged = sf->parameters->toVector()[1];
				}

				if (meleeRanged == -1 || meleeRanged == 0 || (meleeRanged == 1 && ranged) || (meleeRanged == 2 && !ranged))
					castMe = true;
			}
            int chance=split241?spellsByType->totalValue():attacker->valOfBonuses(Selector::typeSubtype(attackMode,BonusSubtypeID(spellID)));
			vstd::amin(chance, 100);

			const CSpell * spell = SpellID(spellID).toSpell();
			const bool sourcePreAttack = sourceExperienceCast; // shared71D939 primary gate, also a/K afterattack
            spells::AbilityCaster caster(attacker, spellLevel);
            BattleSide effectiveSide = attacker->unitSide();
            if(sourcePreAttack && attacker->isHypnotized())
                effectiveSide = effectiveSide == BattleSide::ATTACKER ? BattleSide::DEFENDER : BattleSide::ATTACKER;
            const bool sourceFangarm=sourceExperienceCast && creatureKey=="tum-era:eraCreature263" && spellID==SpellID(60);
            const auto * fangarmHero=sourceFangarm?battle.getBattle()->getSideHero(effectiveSide):nullptr;
            era_compat::ExperienceAttackCaster sourceCaster(attacker, battle.getBattle()->getSidePlayer(effectiveSide),
                sourceExperienceCast ? sourceMastery : 3,fangarmHero,sourceFangarm);
            const auto currentSourceSide=sourceExperienceCast?era_compat::confluxActiveSide(battle):effectiveSide;
            era_compat::ConfluxCaster sourceAreaCaster(&sourceCaster,battle.battleGetFightingHero(currentSourceSide),battle.sideToPlayer(effectiveSide));
            const bool source294Area=sourceExperienceCast && creatureKey=="tum-era:eraCreature294" && spellID==SpellID(21);
            const spells::Caster * selectedCaster = source294Area?static_cast<const spells::Caster *>(&sourceAreaCaster)
                :sourcePreAttack ? static_cast<const spells::Caster *>(&sourceCaster) : &caster;
            std::optional<era_compat::ConfluxSideScope> sourceContext;
            if(sourceExperienceCast)sourceContext.emplace(currentSourceSide,1);

			spells::Target target;
			target.emplace_back(defender);

			spells::BattleCast parameters(&battle, selectedCaster, spells::Mode::PASSIVE, spell);
            parameters.eraExperiencePreAttack = sourcePreAttack;
            if(sourcePreAttack)
            {
                parameters.setSpellLevel(sourceMastery);
                const int sourcePower=era_compat::experienceAttackPower(battle.battleActiveUnit(),spellID);
                parameters.setEffectDuration(sourcePower);
                parameters.setEffectPower(sourcePower);
                if(sourceFangarm)
                {
                    const auto cache=era_compat::sourceInterferencePower(battle,fangarmHero);
                    const int power=fangarmHero?(cache?cache->effective:fangarmHero->getPrimSkillLevel(PrimarySkill::SPELL_POWER)):0;
                    const int actualMastery=fangarmHero?fangarmHero->getSpellSchoolLevel(spell):0;
                    //71DB27 checks hero cached power/actual mastery BEFORE the
                    //5A0145 creature power replacement. Absent hero is defined
                    //as0/0/no specialty, replacing the original NULL reads.
                    parameters.setEffectValue(::era_bridge::hornSigned32(static_cast<uint32_t>(
                        spell->calculateRawEffectValue(actualMastery,power,1))));
                }
            }

			auto m = spell->battleMechanics(&parameters);

			if(!sourcePreAttack && !m->canBeCastAt(target))
				continue;

			// Source WoG71DA69..71DA85 rolls the ability, then the original
            // defender's resistance before any expert mass spell is dispatched.
            if(sourcePreAttack)
            {
                era_compat::ConfluxResistanceScope primaryQuery(true,effectiveSide);
                if(chance <= 0) continue; //71DA44 rejects zero chance before RNG.
                if(!::era_bridge::experienceAttackTriggers(chance, gameHandler->getRandomGenerator().nextInt(1,100)))
                    continue;
                const bool primaryReceptive = era_compat::sourceSpellContextAllows(battle,defender,spell) && m->isReceptive(defender);
                //5A8950 truncates source float success*100 before its mandatory
                //1..100 draw. Native integer magicResistance differs by one
                //percentage point for e.g. dwarf20+hero10+aura20 (55 vs56).
                const int accuracy = primaryReceptive ? era_compat_server::statusRawAccuracy(battle, defender) : 0;
                const int primaryAcceptanceRoll = gameHandler->getRandomGenerator().nextInt(1,100);
                if(primaryAcceptanceRoll > accuracy)
                    continue;
                if(!m->canBeCastAt(target))
                    continue;
            }
            else if(!gameHandler->randomizer->rollCombatAbility(ownerArmy, chance))
                continue;

			//casting
			if(castMe)
			{
                const bool originalProvider=sourceExperienceCast||std::all_of(spellsByType->begin(),spellsByType->end(),[&](const auto & b)
                    {return b->source==BonusSource::CREATURE_ABILITY&&b->sid==BonusSourceID(attacker->creatureId());});
                era_compat_server::SourceXpNativeProviderScope originalScope(originalProvider);
				parameters.cast(gameHandler->spellcastEnvironment(), target);
			}
		}
	}
}

std::set<SpellID> BattleActionProcessor::getSpellsForAttackCasting(const TConstBonusListPtr & spells, const CStack *defender)
{
	std::set<SpellID> spellsToCast;
	constexpr int unlayeredItemsInternalLayer = -1;

	std::map<int, std::vector<std::shared_ptr<Bonus>>> spellsWithBackupLayers;

	for(int i = 0; i < spells->size(); i++)
	{
		std::shared_ptr<Bonus> bonus = spells->operator[](i);
		int layer = bonus->parameters ? bonus->parameters->toVector()[2] : -1;
		vstd::amax(layer, -1);
		spellsWithBackupLayers[layer].push_back(bonus);
	}

	auto addSpellsFromLayer = [&](int layer) -> void
	{
		assert(spellsWithBackupLayers.find(layer) != spellsWithBackupLayers.end());

		for(const auto & spell : spellsWithBackupLayers[layer])
		{
			if (spell->subtype.as<SpellID>() != SpellID())
				spellsToCast.insert(spell->subtype.as<SpellID>());
			else
				logGlobal->error("Invalid spell to cast during attack!");
		}
	};

	if(spellsWithBackupLayers.find(unlayeredItemsInternalLayer) != spellsWithBackupLayers.end())
	{
		addSpellsFromLayer(unlayeredItemsInternalLayer);
		spellsWithBackupLayers.erase(unlayeredItemsInternalLayer);
	}

	for(auto item : spellsWithBackupLayers)
	{
		bool areCurrentLayerSpellsApplied = std::all_of(item.second.begin(), item.second.end(),
			[&](const std::shared_ptr<Bonus> spell)
			{
				std::vector<SpellID> activeSpells = defender->activeSpells();
				return vstd::find(activeSpells, spell->subtype.as<SpellID>()) != activeSpells.end();
			});

		if(!areCurrentLayerSpellsApplied || item.first == spellsWithBackupLayers.rbegin()->first)
		{
			addSpellsFromLayer(item.first);
			break;
		}
	}

	return spellsToCast;
}

void BattleActionProcessor::handleAttackBeforeCasting(const CBattleInfoCallback & battle, bool ranged, const CStack * attacker, const CStack * defender)
{
	attackCasting(battle, ranged, BonusType::SPELL_BEFORE_ATTACK, attacker, defender); //no death stare / acid breath needed?

	processBattleEventTriggers(battle, CombatEventType::BEFORE_ATTACK, attacker, defender);
	processBattleEventTriggers(battle, CombatEventType::BEFORE_ATTACKED, defender, attacker);
}

void BattleActionProcessor::handleDeathStare(const CBattleInfoCallback & battle, bool ranged, const CStack * attacker, const CStack * defender)
{
	// mechanics of Death Stare as in H3:
	// each gorgon have 10% chance to kill (counted separately in H3) -> binomial distribution
	//original formula x = min(x, (gorgons_count + 9)/10);

	/* mechanics of Accurate Shot as in HotA:
		* each creature in an attacking stack has a X% chance of killing a creature in the attacked squad,
		* but the total number of killed creatures cannot be more than (number of creatures in an attacking squad) * X/100 (rounded up).
		* X = 3 multiplier for shooting without penalty and X = 2 if shooting with penalty. Ability doesn't work if shooting at creatures behind walls.
		*/

	auto subtype = BonusCustomSubtype::deathStareGorgon;

	if (ranged)
	{
		bool rangePenalty = battle.battleHasDistancePenalty(attacker, attacker->getPosition(), defender->getPosition());
		bool obstaclePenalty = battle.battleHasWallPenalty(attacker, attacker->getPosition(), defender->getPosition());

		if(rangePenalty)
		{
			if(obstaclePenalty)
				subtype = BonusCustomSubtype::deathStareRangeObstaclePenalty;
			else
				subtype = BonusCustomSubtype::deathStareRangePenalty;
		}
		else
		{
			if(obstaclePenalty)
				subtype = BonusCustomSubtype::deathStareObstaclePenalty;
			else
				subtype = BonusCustomSubtype::deathStareNoRangePenalty;
		}
	}

	int singleCreatureKillChancePercent = attacker->valOfBonuses(BonusType::DEATH_STARE, subtype);
	double chanceToKill = singleCreatureKillChancePercent / 100.0;
	vstd::amin(chanceToKill, 1); //cap at 100%
    const auto sourceKills=era_compat_server::bankDeathStareKills(ranged,attacker,defender,gameHandler->getRandomGenerator());
    int killedCreatures=0;
    if(sourceKills)killedCreatures=*sourceKills;
    else
    {
        killedCreatures=gameHandler->getRandomGenerator().nextBinomialInt(attacker->getCount(),chanceToKill);
        const int maxToKill=vstd::divideAndCeil(attacker->getCount()*singleCreatureKillChancePercent,100);
        vstd::amin(killedCreatures,maxToKill);
    }

	killedCreatures += (attacker->level() * attacker->valOfBonuses(BonusType::DEATH_STARE, BonusCustomSubtype::deathStareCommander)) / defender->level();

	if(killedCreatures)
	{
		SpellID spellID(SpellID::DEATH_STARE); //also used as fallback spell for ACCURATE_SHOT
		auto bonus = attacker->getBonus(Selector::typeSubtype(BonusType::DEATH_STARE, subtype));
		if(bonus && bonus->parameters && bonus->parameters->toSpell() != SpellID::NONE)
			spellID = bonus->parameters->toSpell();

		const CSpell * spell = spellID.toSpell();
		spells::AbilityCaster caster(attacker, 0);

		spells::BattleCast parameters(&battle, &caster, spells::Mode::PASSIVE, spell);
		spells::Target target;
		target.emplace_back(defender);
		parameters.setEffectValue(killedCreatures);
		parameters.cast(gameHandler->spellcastEnvironment(), target);
	}
}

void BattleActionProcessor::handleAfterAttackCasting(const CBattleInfoCallback & battle, bool ranged, const CStack * attacker, const CStack * defender)
{
	if(!attacker->alive() || !defender->alive()) // can be already dead
		return;

	attackCasting(battle, ranged, BonusType::SPELL_AFTER_ATTACK, attacker, defender,AttackCastFilter::NativeOnly);
	processBattleEventTriggers(battle, CombatEventType::AFTER_ATTACK, attacker, defender);
	processBattleEventTriggers(battle, CombatEventType::AFTER_ATTACKED, defender, attacker);

	if(!defender->alive())
	{
		//don't try death stare or acid breath on dead stack (crash!)
		return;
	}

	if(attacker->hasBonusOfType(BonusType::DEATH_STARE))
		handleDeathStare(battle, ranged, attacker, defender);

	if(!defender->alive())
		return;

	int64_t acidDamage = 0;
	TConstBonusListPtr acidBreath = attacker->getBonuses(Selector::type()(BonusType::ACID_BREATH));
	ObjectInstanceID ownerArmy = battle.getBattle()->getSideArmy(attacker->unitSide())->id;

	for(const auto & b : *acidBreath)
	{
		if (b->parameters && gameHandler->randomizer->rollCombatAbility(ownerArmy, b->parameters->toNumber()))
			acidDamage += b->val;
	}

	if(acidDamage > 0)
	{
		const CSpell * spell = SpellID(SpellID::ACID_BREATH_DAMAGE).toSpell();

		spells::AbilityCaster caster(attacker, 0);

		spells::BattleCast parameters(&battle, &caster, spells::Mode::PASSIVE, spell);
		spells::Target target;
		target.emplace_back(defender);

		parameters.setEffectValue(acidDamage * attacker->getCount());
		parameters.cast(gameHandler->spellcastEnvironment(), target);
	}


	if(!defender->alive())
		return;

	if(attacker->hasBonusOfType(BonusType::TRANSMUTATION) && defender->isLiving() && !defender->hasBonusOfType(BonusType::TRANSMUTATION_IMMUNITY)) //transmutation mechanics, similar to WoG werewolf ability
	{
		int chanceToTrigger = attacker->valOfBonuses(BonusType::TRANSMUTATION);
		if (!gameHandler->randomizer->rollCombatAbility(ownerArmy, chanceToTrigger))
			return;

		const auto & bonusParameters = attacker->getBonus(Selector::type()(BonusType::TRANSMUTATION))->parameters;
		const auto & targetCreature = bonusParameters ? bonusParameters->toCreature() : attacker->creatureId();

		if(defender->unitType()->getId() == targetCreature)
			return;

		battle::UnitInfo resurrectInfo;
		resurrectInfo.id = battle.battleNextUnitId();
		resurrectInfo.summoned = false;
		resurrectInfo.position = defender->getPosition();
		resurrectInfo.side = defender->unitSide();
		resurrectInfo.type = targetCreature;

		if(attacker->hasBonusOfType(BonusType::TRANSMUTATION, BonusCustomSubtype::transmutationPerHealth))
			resurrectInfo.count = std::max((defender->getCount() * defender->getMaxHealth()) / resurrectInfo.type.toCreature()->getMaxHealth(), 1u);
		else if (attacker->hasBonusOfType(BonusType::TRANSMUTATION, BonusCustomSubtype::transmutationPerUnit))
			resurrectInfo.count = defender->getCount();
		else
			return; //wrong subtype

		BattleUnitsChanged addUnits;
		addUnits.battleID = battle.getBattle()->getBattleID();
		addUnits.changedStacks.emplace_back(resurrectInfo.id, UnitChanges::EOperation::ADD);
		resurrectInfo.save(addUnits.changedStacks.back().data);

		BattleUnitsChanged removeUnits;
		removeUnits.battleID = battle.getBattle()->getBattleID();
		removeUnits.changedStacks.emplace_back(defender->unitId(), UnitChanges::EOperation::REMOVE);
		gameHandler->sendAndApply(removeUnits);
		gameHandler->sendAndApply(addUnits);

		// send empty event to client
		// temporary(?) workaround to force animations to trigger
		StacksInjured fakeEvent;
		fakeEvent.battleID = battle.getBattle()->getBattleID();
		gameHandler->sendAndApply(fakeEvent);
	}

	if(attacker->hasBonusOfType(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillPercentage) || attacker->hasBonusOfType(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillAmount))
	{
		int chanceToTrigger = 0;
		int amountToDie = 0;

		if(attacker->hasBonusOfType(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillPercentage)) //killing by percentage
		{
			chanceToTrigger = attacker->valOfBonuses(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillPercentage);
			const auto & bonus = attacker->getBonus(Selector::type()(BonusType::DESTRUCTION).And(Selector::subtype()(BonusCustomSubtype::destructionKillPercentage)));
			int percentageToDie = bonus->parameters ? bonus->parameters->toNumber() : 0;
			amountToDie = defender->getCount() * percentageToDie / 100;
		}
		else if(attacker->hasBonusOfType(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillAmount)) //killing by count
		{
			chanceToTrigger = attacker->valOfBonuses(BonusType::DESTRUCTION, BonusCustomSubtype::destructionKillAmount);
			const auto & bonus = attacker->getBonus(Selector::type()(BonusType::DESTRUCTION).And(Selector::subtype()(BonusCustomSubtype::destructionKillAmount)));
			amountToDie = bonus->parameters ? bonus->parameters->toNumber() : 0;
		}

		if (!gameHandler->randomizer->rollCombatAbility(ownerArmy, chanceToTrigger))
			return;

		BattleStackAttacked bsa;
		bsa.attackerID = -1;
		bsa.stackAttacked = defender->unitId();
		bsa.damageAmount = amountToDie * defender->getMaxHealth();
		bsa.flags = BattleStackAttacked::SPELL_EFFECT;
		bsa.spellID = SpellID::SLAYER;
		defender->prepareAttacked(bsa, gameHandler->getRandomGenerator());

		StacksInjured si;
		si.battleID = battle.getBattle()->getBattleID();
		si.stacks.push_back(bsa);

		gameHandler->sendAndApply(si);
		sendGenericKilledLog(battle, defender, bsa.killedAmount, false);
	}
}

void BattleActionProcessor::applyBattleEffects(const CBattleInfoCallback & battle, BattleAttack & bat, std::shared_ptr<battle::CUnitState> attackerState, FireShieldInfo & fireShield, const CStack * def, battle::HealInfo & healInfo, int distance, bool secondary) const
{
    // Only secondary Lich/Magog spell-like physical hits use these source
    // origins; the direct target and ordinary breath/all-around hits remain.
    bool sourceSecondaryCanceled=false;
    if(secondary && bat.shot())
    {
        if(const auto spellLike=attackerState->getBonus(Selector::type()(BonusType::SPELL_LIKE_ATTACK)))
        {
            using Origin=::era_bridge::CreatureSpellDamageOrigin;
            const auto spell=spellLike->subtype.as<SpellID>();
            const auto origin=spell==SpellID(SpellID::DEATH_CLOUD)?Origin::DeathCloud
                :spell==SpellID(SpellID::FIREBALL)?Origin::Fireball:Origin::Other;
            sourceSecondaryCanceled=cancelsSourceCreatureSpellDamage(def,origin,false);
        }
    }
	BattleStackAttacked bsa;
	if(secondary)
		bsa.flags |= BattleStackAttacked::SECONDARY; //all other targets do not suffer from spells & spell-like abilities

	bsa.attackerID = attackerState->unitId();
	bsa.stackAttacked = def->unitId();
    int64_t rawDamageBeforeDeflection = 0;
    bool sourcePhysicalBlocked = false;
	{
		BattleAttackInfo bai(attackerState.get(), def, distance, bat.shot());

		bai.deathBlow = bat.deathBlow();
		bai.doubleDamage = bat.ballistaDoubleDmg();
		bai.luckyStrike  = bat.lucky();
		bai.unluckyStrike  = bat.unlucky();

		auto range = battle.calculateDmgRange(bai);
		bsa.damageAmount = battle.getBattle()->getActualDamage(range.damage, attackerState->getCount(), gameHandler->getRandomGenerator());
        rawDamageBeforeDeflection = bsa.damageAmount;
        if(sourceSecondaryCanceled)return; // MF:F0/Efalse occurs after raw damage, before source B/L.
        // Proven source replacement sites cover regular physical hits and
        // siege-tower hits; spell and moat entry points are scoped separately.
        sourcePhysicalBlocked = applyEraCrystalPhysicalBlock(def,gameHandler->getRandomGenerator());
        if(sourcePhysicalBlocked)
        {
            bsa.damageAmount=0;
            // Cosmetic announcement only; the authoritative zero-damage packet
            // below owns the hit. Source71C6A7 uses animation85 before its log.
            BattleTriggerEffect blocked;blocked.battleID=battle.getBattle()->getBattleID();
            blocked.stackID=def->unitId();blocked.effect=BonusType::GENERAL_DAMAGE_REDUCTION;
            blocked.val=100;blocked.additionalInfo=85;gameHandler->sendAndApply(blocked);
            BattleLogMessage message;message.battleID=battle.getBattle()->getBattleID();
            MetaString line;line.appendTextID("tum-era.deflection.fullBlock");message.lines.push_back(line);
            gameHandler->sendAndApply(message);
        }
        else
        {
            // Source766AC8 is reached after full block71C5A9, and invokes
            // the resistance wrapper before partial block71C710. This is not
            // an Air Shield factor inside the earlier damage calculation.
            if(bat.shot() && !bat.counter() && era_compat::Policies::get().sourceRangedResistance30(def->creatureId().toCreature()->getJsonKey()))
            {
                bsa.damageAmount=::era_bridge::sourceRangedResistance30(bsa.damageAmount);
                BattleTriggerEffect resistance;resistance.battleID=battle.getBattle()->getBattleID();
                resistance.stackID=def->unitId();resistance.effect=BonusType::GENERAL_DAMAGE_REDUCTION;
                resistance.val=30;resistance.additionalInfo=89;gameHandler->sendAndApply(resistance);
            }
            bsa.damageAmount = applyEraDeflection(def, gameHandler->getRandomGenerator(), bsa.damageAmount, [&](int strength,int chance){auto message=eraDeflectionLog(battle.getBattle()->getBattleID(),strength,chance);gameHandler->sendAndApply(message);});
        }
		CStack::prepareAttacked(bsa, gameHandler->getRandomGenerator(), bai.defender->acquireState()); //calculate casualties
        if(!sourcePhysicalBlocked&&era_compat::sourceXpBattleAdmitted(battle))
            bsa.newState.data["eraSourceXpDamageEntered"].Bool()=true;
	}

    healInfo += applyEraDwellingGhost(*attackerState,*def,static_cast<int32_t>(std::min<int64_t>(sourcePhysicalBlocked?0:rawDamageBeforeDeflection,INT32_MAX)),bsa.killedAmount);

	//life drain handling
    const bool sourceVampire=era_compat::Policies::get().vampireDrain(attackerState->creatureId().toCreature()->getJsonKey());
	if(attackerState->hasBonusOfType(BonusType::LIFE_DRAIN) && (sourceVampire?era_compat_server::statusLiving(def):def->isLiving()) && attackerState->getTotalHealth() != attackerState->getAvailableHealth())
	{
		// Source440921 uses min(raw attack damage, victim pre-hit HP),
        // calculated before the71C710 block in443DB0. Preserve it only for
        // source-profiled targets; other mods retain native drain behavior.
        const bool sourceBlock = era_compat::Policies::get().physicalDeflection(def->creatureId().toCreature()->getJsonKey()).has_value();
        const int64_t drainDamage = sourcePhysicalBlocked ? 0 : (sourceBlock || sourceVampire) ? std::min<int64_t>(rawDamageBeforeDeflection, def->getAvailableHealth()) : bsa.damageAmount;
        // Amethyst selector0 jumps to440921: full min(raw damage, pre-hit
        // victim HP), including clone victims; no inherited WoG40% multiplier.
        int64_t toHeal = sourceVampire ? drainDamage : drainDamage * attackerState->valOfBonuses(BonusType::LIFE_DRAIN) / 100;
        if(sourceVampire)
        {
            // Original440921 also heals CLONE attackers. A clone296 can be
            // partially restored by rebirth; retain its fragile flag afterward.
            ::era_bridge::CloneHealScope cloneScope(attackerState->cloned);
            healInfo += attackerState->heal(toHeal, EHealLevel::RESURRECT, EHealPower::PERMANENT);
        }
        else
            healInfo += attackerState->heal(toHeal, EHealLevel::RESURRECT, EHealPower::PERMANENT);
	}

	//soul steal handling
	if(attackerState->hasBonusOfType(BonusType::SOUL_STEAL) && def->isLiving())
	{
		//we can have two bonuses - one with subtype 0 and another with subtype 1
		//try to use permanent first, use only one of two
		for(const auto & subtype : { BonusCustomSubtype::soulStealBattle, BonusCustomSubtype::soulStealPermanent})
		{
			if(attackerState->hasBonusOfType(BonusType::SOUL_STEAL, subtype))
			{
				int64_t toHeal = bsa.killedAmount * attackerState->valOfBonuses(BonusType::SOUL_STEAL, subtype) * attackerState->getMaxHealth();
				bool permanent = subtype == BonusCustomSubtype::soulStealPermanent;
				healInfo += attackerState->heal(toHeal, EHealLevel::OVERHEAL, (permanent ? EHealPower::PERMANENT : EHealPower::ONE_BATTLE));
				break;
			}
		}
	}
	bat.bsa.push_back(bsa); //add this stack to the list of victims after drain life has been calculated

	//fire shield handling
	if(!bat.shot() &&
        !cancelsSourceCreatureSpellDamage(attackerState.get(),::era_bridge::CreatureSpellDamageOrigin::FireShield) &&
		!def->isClone() &&
		def->hasBonusOfType(BonusType::FIRE_SHIELD) &&
		!attackerState->hasBonusOfType(BonusType::SPELL_SCHOOL_IMMUNITY, BonusSubtypeID(SpellSchool::FIRE)) &&
		!attackerState->hasBonusOfType(BonusType::NEGATIVE_EFFECTS_IMMUNITY, BonusSubtypeID(SpellSchool::FIRE)) &&
		attackerState->valOfBonuses(BonusType::SPELL_DAMAGE_REDUCTION, BonusSubtypeID(SpellSchool::FIRE)) < 100 &&
		CStack::isMeleeAttackPossible(attackerState.get(), def) // attacked needs to be adjacent to defender for fire shield to trigger (e.g. Dragon Breath attack)
			)
	{
		//TODO: use damage with bonus but without penalties
		auto fireShieldDamage = (std::min<int64_t>(def->getAvailableHealth(), era_compat::Policies::get().physicalDeflection(def->creatureId().toCreature()->getJsonKey()).has_value() ? rawDamageBeforeDeflection : bsa.damageAmount) * def->valOfBonuses(BonusType::FIRE_SHIELD)) / 100;
		// Source346: a live spell29 overrides the intrinsic REAL4 .3,
        // even when that spell is weaker. Do not sum native shield bonuses.
        if(def->unitType()->getJsonKey()=="tum-era:eraCreature346"
            && era_compat::PrimordialPolicies::get().owns(def->unitType()->getJsonKey()))
        {
            const auto live=def->getBonus(Selector::type()(BonusType::FIRE_SHIELD)
                .And(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(29)))));
            const std::optional<float> coefficient=live
                ?std::optional<float>(static_cast<float>(live->val)/100.0f):std::nullopt;
            const auto physical=era_compat::Policies::get().physicalDeflection(
                def->unitType()->getJsonKey()).has_value()?rawDamageBeforeDeflection:bsa.damageAmount;
            fireShieldDamage=era_bridge::primordialShieldRaw(
                static_cast<int32_t>(def->getAvailableHealth()),static_cast<int32_t>(physical),coefficient);
        }
        fireShield.emplace_back(def, fireShieldDamage);
	}
}

void BattleActionProcessor::sendGenericKilledLog(const CBattleInfoCallback & battle, const CStack * defender, int32_t killed, bool multiple)
{
	if(killed > 0)
	{
		BattleLogMessage blm;
		blm.battleID = battle.getBattle()->getBattleID();
		addGenericKilledLog(blm, defender, killed, multiple);
		gameHandler->sendAndApply(blm);
	}
}

void BattleActionProcessor::addGenericKilledLog(BattleLogMessage & blm, const CStack * defender, int32_t killed, bool multiple) const
{
	if(killed > 0)
	{
		MetaString line;

		if (killed > 1)
		{
			line.appendTextID("core.genrltxt.379"); // %d %s perished
			line.replaceNumber(killed);
		}
		else
			line.appendTextID("core.genrltxt.378"); // One %s perishes

		if (multiple)
		{
			if (killed > 1)
				line.replaceTextID("core.genrltxt.43"); // creatures
			else
				line.replaceTextID("core.genrltxt.42"); // creature
		}
		else
			line.replaceName(defender->unitType()->getId(), killed);

		blm.lines.push_back(line);
	}
}

void BattleActionProcessor::addGenericDamageLog(BattleLogMessage& blm, const std::shared_ptr<battle::CUnitState> &attackerState, int64_t damageDealt) const
{
	MetaString text;
	attackerState->addText(text, EMetaText::GENERAL_TXT, 376);
	attackerState->addNameReplacement(text);
	text.replaceNumber(damageDealt);
	blm.lines.push_back(std::move(text));
}

void BattleActionProcessor::addGenericDrainedLifeLog(BattleLogMessage& blm, const std::shared_ptr<battle::CUnitState>& attackerState, const CStack* defender, int64_t drainedLife) const
{
	MetaString text;
	attackerState->addText(text, EMetaText::GENERAL_TXT, 361);
	attackerState->addNameReplacement(text);
	text.replaceNumber(drainedLife);

	if (defender)
		defender->addNameReplacement(text);
	else
		text.replaceTextID("core.genrltxt.43"); // creatures

	blm.lines.push_back(std::move(text));
}

void BattleActionProcessor::addGenericResurrectedLog(BattleLogMessage& blm, const std::shared_ptr<battle::CUnitState>& attackerState, const CStack* defender, int64_t resurrected) const
{
	if (resurrected > 0)
	{
		MetaString & ms = blm.lines.back();

		if (resurrected == 1)
		{
			ms.appendLocalString(EMetaText::GENERAL_TXT, 363);		// "\n and one rises from the dead."
		}
		else
		{
			ms.appendLocalString(EMetaText::GENERAL_TXT, 364);		// "\n and %d rise from the dead."
			ms.replaceNumber(resurrected);
		}
	}
}

bool BattleActionProcessor::makeAutomaticBattleAction(const CBattleInfoCallback & battle, const BattleAction & ba)
{
	return makeBattleActionImpl(battle, ba);
}

bool BattleActionProcessor::makePlayerBattleAction(const CBattleInfoCallback & battle, PlayerColor player, const BattleAction &ba)
{
	if (ba.side != BattleSide::ATTACKER && ba.side != BattleSide::DEFENDER && gameHandler->complain("Can not make action - invalid battle side!"))
		return false;

	if(battle.battleGetTacticDist() != 0)
	{
		if(!ba.isTacticsAction())
		{
			gameHandler->complain("Can not make actions while in tactics mode!");
			return false;
		}

		if(player != battle.sideToPlayer(ba.side))
		{
			gameHandler->complain("Can not make actions in battles you are not part of!");
			return false;
		}
	}
	else
	{
		const auto * active = battle.battleActiveUnit();
		if(!active)
		{
			gameHandler->complain("No active unit in battle!");
			return false;
		}

		if (ba.isUnitAction() && ba.stackNumber != active->unitId())
		{
			gameHandler->complain("Can not make actions - stack is not active!");
			return false;
		}

		auto unitOwner = battle.battleGetOwner(active);

		if(player != unitOwner)
		{
			gameHandler->complain("Can not make actions in battles you are not part of!");
			return false;
		}
	}

	return makeBattleActionImpl(battle, ba);
}

void BattleActionProcessor::processBattleEventTriggers(const CBattleInfoCallback & battle, CombatEventType event, const CStack * target, const CStack * secondary)
{
	const auto & bonuses = target->getBonusesOfType(BonusType::ON_COMBAT_EVENT, BonusCustomSubtype(static_cast<int>(event)));
	for (const auto & bonus : *bonuses)
	{
		const auto parameters = bonus->parameters->toCustom<BonusParametersOnCombatEvent>();

		for (const auto & effect : parameters.effects)
		{
			auto * bonusEffect = std::get_if<BonusParametersOnCombatEvent::CombatEffectBonus>(&effect);
			auto * spellEffect = std::get_if<BonusParametersOnCombatEvent::CombatEffectSpell>(&effect);

			if (bonusEffect)
			{
				SetStackEffect sse;
				sse.battleID = battle.getBattle()->getBattleID();
				std::vector<Bonus> bonuses{*bonusEffect->bonus};
				if (bonusEffect->targetEnemy && secondary)
					sse.toAdd.emplace_back(secondary->unitId(), bonuses);
				if (!bonusEffect->targetEnemy)
					sse.toAdd.emplace_back(target->unitId(), bonuses);
				gameHandler->sendAndApply(sse);
			}
			if (spellEffect)
			{
				const CSpell * spell = spellEffect->spell.toSpell();
				spells::AbilityCaster spellCaster(target, spellEffect->masteryLevel);

				spells::Target spellTarget;
				if (spellEffect->targetEnemy && secondary)
					spellTarget.emplace_back(secondary);
				if (!spellEffect->targetEnemy)
					spellTarget.emplace_back(target);

				spells::BattleCast parameters(&battle, &spellCaster, spells::Mode::PASSIVE, spell);

				auto m = spell->battleMechanics(&parameters);

				if(m->canBeCastAt(spellTarget))
					parameters.cast(gameHandler->spellcastEnvironment(), spellTarget);
			}
		}

	}
}
