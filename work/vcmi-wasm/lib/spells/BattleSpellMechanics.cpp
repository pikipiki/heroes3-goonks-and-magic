/*
 * BattleSpellMechanics.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../era/EraFamiliarChannel43.h"
#include "../era/EraAdvancedArtifactRuntimeNative.h"
#include "../era/EraPhysicalAbilities.h"
#include "../era/EraSourceSpellAccuracy.h"
#include "../era/EraConfluxPolicies.h"
#include "../era/EraConfluxCaster.h"
#include "../era/EraExperienceCastTargets.h"

#include "BattleSpellMechanics.h"
#include "TargetCondition.h"
#include "../era/EraOblivion.h"

#include "Problem.h"
#include "CSpellHandler.h"

#include "../battle/IBattleState.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/Unit.h"
#include "../networkPacks/PacksForClientBattle.h"
#include "../networkPacks/SetStackEffect.h"
#include "../CStack.h"

#include <vstd/RNG.h>

VCMI_LIB_NAMESPACE_BEGIN

namespace spells
{

namespace SRSLPraserHelpers
{
	static int XYToHex(int x, int y)
	{
		return x + GameConstants::BFIELD_WIDTH * y;
	}

	static int XYToHex(std::pair<int, int> xy)
	{
		return XYToHex(xy.first, xy.second);
	}

	static int hexToY(int battleFieldPosition)
	{
		return battleFieldPosition/GameConstants::BFIELD_WIDTH;
	}

	static int hexToX(int battleFieldPosition)
	{
		int pos = battleFieldPosition - hexToY(battleFieldPosition) * GameConstants::BFIELD_WIDTH;
		return pos;
	}

	static std::pair<int, int> hexToPair(int battleFieldPosition)
	{
		return std::make_pair(hexToX(battleFieldPosition), hexToY(battleFieldPosition));
	}

	//moves hex by one hex in given direction
	//0 - left top, 1 - right top, 2 - right, 3 - right bottom, 4 - left bottom, 5 - left
	static std::pair<int, int> gotoDir(int x, int y, int direction)
	{
		switch(direction)
		{
		case 0: //top left
			return std::make_pair((y%2) ? x-1 : x, y-1);
		case 1: //top right
			return std::make_pair((y%2) ? x : x+1, y-1);
		case 2:  //right
			return std::make_pair(x+1, y);
		case 3: //right bottom
			return std::make_pair((y%2) ? x : x+1, y+1);
		case 4: //left bottom
			return std::make_pair((y%2) ? x-1 : x, y+1);
		case 5: //left
			return std::make_pair(x-1, y);
		default:
			throw std::runtime_error("Disaster: wrong direction in SRSLPraserHelpers::gotoDir!\n");
		}
	}

	static std::pair<int, int> gotoDir(std::pair<int, int> xy, int direction)
	{
		return gotoDir(xy.first, xy.second, direction);
	}

	static bool isGoodHex(std::pair<int, int> xy)
	{
		return xy.first >=0 && xy.first < GameConstants::BFIELD_WIDTH && xy.second >= 0 && xy.second < GameConstants::BFIELD_HEIGHT;
	}

	//helper function for rangeInHexes
	static std::set<ui16> getInRange(unsigned int center, int low, int high)
	{
		std::set<ui16> ret;
		if(low == 0)
		{
			ret.insert(center);
		}

		std::pair<int, int> mainPointForLayer[6]; //A, B, C, D, E, F points
		for(auto & elem : mainPointForLayer)
			elem = hexToPair(center);

		for(int it=1; it<=high; ++it) //it - distance to the center
		{
			for(int b=0; b<6; ++b)
				mainPointForLayer[b] = gotoDir(mainPointForLayer[b], b);

			if(it>=low)
			{
				std::pair<int, int> curHex;

				//adding lines (A-b, B-c, C-d, etc)
				for(int v=0; v<6; ++v)
				{
					curHex = mainPointForLayer[v];
					for(int h=0; h<it; ++h)
					{
						if(isGoodHex(curHex))
							ret.insert(XYToHex(curHex));
						curHex = gotoDir(curHex, (v+2)%6);
					}
				}

			} //if(it>=low)
		}

		return ret;
	}
}

BattleSpellMechanics::BattleSpellMechanics(const IBattleCast * event,
										   std::shared_ptr<effects::Effects> effects_,
										   std::shared_ptr<IReceptiveCheck> targetCondition_):
	BaseMechanics(event),
	effects(std::move(effects_)),
	targetCondition(std::move(targetCondition_))
{}

void BattleSpellMechanics::forEachEffect(const std::function<bool (const spells::effects::Effect &)> & fn) const
{
	if (!effects)
		return;

	effects->forEachEffect(getEffectLevel(), [&](const spells::effects::Effect * eff, bool & stop)
	{
		if(!eff)
			return;

		if(fn(*eff))
			stop = true;
	});
}

BattleSpellMechanics::~BattleSpellMechanics() = default;

void BattleSpellMechanics::applyEffects(ServerCallback * server, const Target & targets, bool indirect, bool ignoreImmunity) const
{
	auto callback = [&](const effects::Effect * effect, bool & stop)
	{
		if(indirect == effect->indirect)
		{
			if(ignoreImmunity)
			{
				effect->apply(server, this, targets);
			}
			else
			{
				EffectTarget filtered = effect->filterTarget(this, targets);
				effect->apply(server, this, filtered);
			}
		}
	};

	effects->forEachEffect(getEffectLevel(), callback);
}

bool BattleSpellMechanics::canBeCast(Problem & problem) const
{
	auto genProblem = battle()->battleCanCastSpell(caster, mode);
	if(genProblem != ESpellCastProblem::OK)
		return adaptProblem(genProblem, problem);

	switch(mode)
	{
	case Mode::HERO:
		{
			const auto * castingHero = dynamic_cast<const CGHeroInstance *>(caster); //todo: unify hero|creature spell cost
			if(!castingHero)
			{
				logGlobal->debug("CSpell::canBeCast: invalid caster");
				genProblem = ESpellCastProblem::NO_HERO_TO_CAST_SPELL;
			}
			else if(!castingHero->getArt(ArtifactPosition::SPELLBOOK))
				genProblem = ESpellCastProblem::NO_SPELLBOOK;
			else if(!castingHero->canCastThisSpell(owner))
				genProblem = ESpellCastProblem::HERO_DOESNT_KNOW_SPELL;
			else if(castingHero->mana < battle()->battleGetSpellCost(owner, castingHero)) //not enough mana
				genProblem = ESpellCastProblem::NOT_ENOUGH_MANA;
		}
		break;
	}

	if(genProblem != ESpellCastProblem::OK)
		return adaptProblem(genProblem, problem);

	if(!owner->isCombat())
		return adaptProblem(ESpellCastProblem::ADVMAP_SPELL_INSTEAD_OF_BATTLE_SPELL, problem);

	const PlayerColor player = caster->getCasterOwner();
	const BattleSide side = battle()->playerToSide(player);

	if(side == BattleSide::NONE)
		return adaptProblem(ESpellCastProblem::INVALID, problem);

	//effect like Recanter's Cloak. Blocks also passive casting.
	//TODO: check creature abilities to block
	//TODO: check any possible caster

	const bool sourcePhysicalAbility = era_compat::PhysicalAbilities::get().enabled(owner->getJsonKey());
    if(sourcePhysicalAbility && (isMagicalEffect() || getSpellLevel()!=0))
        throw std::runtime_error("ERA physical ability must be nonMagical with level0");
    if(!sourcePhysicalAbility && (battle()->battleMaxSpellLevel(side) < getSpellLevel() || battle()->battleMinSpellLevel(side) > getSpellLevel()))
		return adaptProblem(ESpellCastProblem::SPELL_LEVEL_LIMIT_EXCEEDED, problem);

    const auto * sourceActor=mode==Mode::CREATURE_ACTIVE?battle()->battleGetStackByID(caster->getCasterUnitId(),false):nullptr;
    if(era_compat::sourceFaeriePoolActor(sourceActor) && getSpellIndex()>=15 && getSpellIndex()<=23 && getSpellIndex()!=18)
    {
        //StartAction already marks castSpellThisTurn before server dispatch.
        //Only ammunition is checked here; action ownership remains in BAP.
        if(!sourceActor->casts.canUse(1))return adaptProblem(ESpellCastProblem::INVALID,problem);
        for(const auto * target:battle()->battleGetAllStacks(true))
            if(sourceFaeriePrimaryAllowed(sourceActor,target))return true;
        return adaptProblem(ESpellCastProblem::NO_APPROPRIATE_TARGET,problem);
    }
	return effects->applicable(problem, this);
}

bool BattleSpellMechanics::sourceConfluxWallTargetAllowed(const battle::Unit * target) const
{
    const auto * source=SpellID(13).toSpell();
    if(!era_compat::sourceSpellContextAllows(*battle(),target,source))return false;
    BattleCast query(battle(),caster,Mode::PASSIVE,source);
    auto mechanics=source->battleMechanics(&query);
    const auto * factory=TargetConditionItemFactory::getDefault();
    TargetCondition condition;
    condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
    condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
    condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
    //59FFE0 queries the stored wall side, while Catalyst still reads CURRENT.
    era_compat::ConfluxResistanceScope querySide(true,casterSide);
    return condition.isReceptive(mechanics.get(),target)
        && era_compat::statusRawAccuracy(*battle(),target,true,casterSide,true)>0;
}

bool BattleSpellMechanics::sourceFaeriePrimaryAllowed(const CStack * actor,const battle::Unit * target) const
{
    if(!actor || !target)return false;
    auto side=actor->unitSide();
    if(actor->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    era_compat::ConfluxSideScope context(side,1);
    // Original spell types:15/16/17=-1 enemy,19..23=0 area. Source5A8616
    // compares physical target.side for negative spells, not hypnotized owner.
    if(getSpellIndex()<=17 && target->unitSide()==side)return false;
    if(!era_compat::sourceSpellContextAllows(*battle(),target,getSpell()))return false;
    if(const auto rod=era_compat::sourceLightningResistance(*battle(),getSpellIndex(),side,*target))return *rod<100;
    return isReceptive(target)
        && era_compat::statusRawAccuracy(*battle(),target,true,BattleSide::NONE,true)>0;
}

bool BattleSpellMechanics::canCastAtTarget(const battle::Unit * target) const
{
	if(mode == Mode::HERO)
		return true;

	if(!target)
		return true;

	auto spell = getSpell();
	int range = caster->getEffectRange(spell);

	if(range <= 0)
		return true;

	auto casterStack = battle()->battleGetStackByID(caster->getCasterUnitId(), false);
	std::vector<BattleHex> casterPos = { casterStack->getPosition() };
	BattleHex casterWidePos = casterStack->occupiedHex();
	if(casterWidePos != BattleHex::INVALID)
		casterPos.push_back(casterWidePos);

	std::vector<BattleHex> destPos = { target->getPosition() };
	BattleHex destWidePos = target->occupiedHex();
	if(destWidePos != BattleHex::INVALID)
		destPos.push_back(destWidePos);
	
	int minDistance = std::numeric_limits<int>::max();
	for(auto & caster : casterPos)
		for(auto & dest : destPos)
		{
			int distance = BattleHex::getDistance(caster, dest);
			if(distance < minDistance)
				minDistance = distance;
		}

	if(minDistance > range)
		return false;
	
	return true;
}

bool BattleSpellMechanics::canBeCastAt(const Target & target) const
{
	spells::detail::ProblemImpl ignore;
	return canBeCastAt(target, ignore);
}

bool BattleSpellMechanics::canBeCastAt(const Target & target, Problem & problem) const
{
	if(!canBeCast(problem))
		return false;

    if(era_compat::ConfluxPolicies::get().enabled()
        && getSpell()->getJsonKey()=="tum-era:sourceConfluxFireWallTrigger")
        return !target.empty() && sourceConfluxWallTargetAllowed(target.front().unitValue);

    const auto * sourceActor=mode==Mode::CREATURE_ACTIVE?battle()->battleGetStackByID(caster->getCasterUnitId(),false):nullptr;
    if(era_compat::sourceFaeriePoolActor(sourceActor) && getSpellIndex()>=15 && getSpellIndex()<=23 && getSpellIndex()!=18)
    {
        if(target.empty())return false;
        const auto * primary=target.front().unitValue?target.front().unitValue:battle()->battleGetUnitByPos(target.front().hexValue,true);
        return sourceFaeriePrimaryAllowed(sourceActor,primary);
    }

	Target spellTarget = transformSpellTarget(target);

	const battle::Unit * mainTarget = nullptr;

	if(spellTarget.front().unitValue)
	{
		mainTarget = target.front().unitValue;
	}
	else if(spellTarget.front().hexValue.isValid())
	{
		mainTarget = battle()->battleGetUnitByPos(target.front().hexValue, true);
	}

	if(!canCastAtTarget(mainTarget))
		return false;

	if (!getSpell()->canCastOnSelf() && !getSpell()->canCastOnlyOnSelf())
	{
		if(mainTarget && mainTarget == caster)
			return false; // can't cast on self

		if(mainTarget && mainTarget->isInvincible() && !getSpell()->getPositiveness())
			return false;
	}
	else if(getSpell()->canCastOnlyOnSelf())
	{
		if(mainTarget && mainTarget != caster)
			return false; // can't cast on others
	}

	return effects->applicable(problem, this, target, spellTarget);
}

std::vector<const CStack *> BattleSpellMechanics::getAffectedStacks(const Target & target) const
{
	Target spellTarget = transformSpellTarget(target);

	EffectTarget all;

	effects->forEachEffect(getEffectLevel(), [&all, &target, &spellTarget, this](const effects::Effect * e, bool & stop)
	{
		EffectTarget one = e->transformTarget(this, target, spellTarget);
		vstd::concatenate(all, one);
	});

	std::set<const CStack *> stacks;

	for(const Destination & dest : all)
	{
		if(dest.unitValue && !dest.unitValue->isInvincible())
		{
			//FIXME: remove and return battle::Unit
			stacks.insert(battle()->battleGetStackByID(dest.unitValue->unitId(), false));
		}
	}

	std::vector<const CStack *> res;
	std::copy(stacks.begin(), stacks.end(), std::back_inserter(res));
	return res;
}

void BattleSpellMechanics::cast(ServerCallback * server, const Target & target)
{
	BattleSpellCast sc;

	int spellCost = 0;

	sc.side = casterSide;
	sc.spellID = getSpellId();
	sc.battleID = battle()->getBattle()->getBattleID();
	sc.tile = target.at(0).hexValue;

	sc.castByHero = mode == Mode::HERO;
	if (mode != Mode::HERO)
		sc.casterStack = caster->getCasterUnitId();
	sc.manaGained = 0;

	sc.activeCast = false;
	affectedUnits.clear();

	const CGHeroInstance * otherHero = nullptr;
	{
		//check it there is opponent hero
		const BattleSide otherSide = battle()->otherSide(casterSide);

		if(battle()->battleHasHero(otherSide))
			otherHero = battle()->battleGetFightingHero(otherSide);
	}

	//calculate spell cost
	if(mode == Mode::HERO)
	{
		const auto * casterHero = dynamic_cast<const CGHeroInstance *>(caster);
		spellCost = battle()->battleGetSpellCost(owner, casterHero);

		if(nullptr != otherHero) //handle mana channel
		{
			int manaChannel = 0;
			for(const auto * stack : battle()->battleGetAllStacks(true)) //TODO: shouldn't bonus system handle it somehow?
			{
                // Original5A24DC flips the channel side while Hypnotize60 is
                // active. Keep other, unregistered VCMI channel providers intact.
                const bool sourceChannel=era_compat::sourcePostEffectManaChannel(stack->creatureId().toCreature()->getJsonKey());
                if(sourceChannel)continue; // Original5A24DC evaluates admitted43/356 AFTER spell effects.
				if(stack->unitOwner() == otherHero->tempOwner && stack->alive())
					vstd::amax(manaChannel, stack->valOfBonuses(BonusType::MANA_CHANNELING));
			}
			sc.manaGained = (manaChannel * spellCost) / 100;
		}
		sc.activeCast = true;
	}
	else if(mode == Mode::CREATURE_ACTIVE || mode == Mode::ENCHANTER)
	{
		spellCost = 1;
		sc.activeCast = true;
	}

	beforeCast(sc, *server->getRNG(), target);

	BattleLogMessage castDescription;
	castDescription.battleID = battle()->getBattle()->getBattleID();

	switch (mode)
	{
	case Mode::CREATURE_ACTIVE:
	case Mode::ENCHANTER:
	case Mode::HERO:
	case Mode::PASSIVE:
	case Mode::MAGIC_MIRROR:
		{
			MetaString line;
			caster->getCastDescription(owner, affectedUnits, line);
			if(!line.empty())
				castDescription.lines.push_back(line);
		}
		break;

	default:
		break;
	}

	doRemoveEffects(server, affectedUnits, std::bind(&BattleSpellMechanics::counteringSelector, this, _1));

	for(auto & unit : affectedUnits)
		sc.affectedCres.insert(unit->unitId());

	if(!castDescription.lines.empty())
		server->apply(castDescription);

	server->apply(sc);

	for(auto & p : effectsToApply)
		p.first->apply(server, this, p.second);

    std::optional<BattleTriggerEffect> sourceChannelVisual;
    if(mode==Mode::HERO && otherHero)
    {
        int sourceChannel=0;
        const CStack * sourceProvider=nullptr;
        for(const auto * stack:battle()->battleGetAllStacks(true))
            if(stack->alive() && battle()->battleGetOwner(stack)==otherHero->tempOwner
                && era_compat::sourcePostEffectManaChannel(stack->creatureId().toCreature()->getJsonKey()))
            {
                sourceChannel=std::max(sourceChannel,stack->valOfBonuses(BonusType::MANA_CHANNELING));
                sourceProvider=stack;
            }
        const int sourceGain=(sourceChannel*spellCost)/100;
        if(sourceGain>sc.manaGained)
        {
            // The ordinary native channel animation was already queued only
            // when its own pre-cast providers supplied mana. Avoid duplication.
            if(sc.manaGained==0 && sourceProvider)
            {
                BattleTriggerEffect channel;channel.battleID=sc.battleID;
                channel.stackID=sourceProvider->unitId();channel.effect=BonusType::MANA_CHANNELING;
                channel.val=sourceGain;channel.additionalInfo=static_cast<int>(casterSide);
                sourceChannelVisual=channel;
            }
            sc.manaGained=sourceGain;
        }
    }
	if(sc.activeCast)
	{
		caster->spendMana(server, spellCost);

		if(sc.manaGained > 0)
		{
			assert(otherHero);
			otherHero->spendMana(server, -sc.manaGained);
		}
	}

    if(sourceChannelVisual)server->apply(*sourceChannelVisual); // Grant mana before the source SP07 animation.

	// send empty event to client
	// temporary(?) workaround to force animations to trigger
	StacksInjured fakeEvent;
	fakeEvent.battleID = battle()->getBattle()->getBattleID();
	server->apply(fakeEvent);
}

void BattleSpellMechanics::beforeCast(BattleSpellCast & sc, vstd::RNG & rng, const Target & target)
{
    const bool sourceConfluxCast=dynamic_cast<const era_compat::ConfluxCaster *>(caster)!=nullptr;
    const bool sourceConfluxArea=sourceConfluxCast && getSpellIndex()>=20 && getSpellIndex()<=23;
    std::optional<era_compat::ConfluxResistanceScope> confluxAreaQuery;
    if(sourceConfluxArea)confluxAreaQuery.emplace(true,era_compat::confluxActiveSide(*battle()));
	affectedUnits.clear();

	Target spellTarget = transformSpellTarget(target);

	std::vector <const battle::Unit *> resisted;

	resistantUnitIds.clear();
    const bool sourceMassTimed=isMassive() && ((eraExperiencePreAttack && getSpellIndex()==50)
        || (eraArtifactMassHypnotize && getSpellIndex()==60));
	if(isNegativeSpell() && isMagicalEffect())
	{
        if(sourceConfluxArea)
        {
            std::vector<const battle::Unit *> targets;
            if(!target.empty())for(const int hex:era_bridge::sourceAreaHexesReverse(
                target.front().hexValue.toInt(),getSpellIndex()==22?2:1,getSpellIndex()!=20))
            {
                const auto * unit=battle()->battleGetUnitByPos(BattleHex(hex),true);
                // Source CANNOT_MOVE bit21 is the removed/dead combat record,
                // not ordinary paralysis. Native position lookup excludes ghosts.
                if(unit && std::find(targets.begin(),targets.end(),unit)==targets.end())targets.push_back(unit);
            }
            //5A4A00 reverses the axial hex list while collecting unique units;
            //5A4C80 reverses that list again before each per-unit resistance.
            std::reverse(targets.begin(),targets.end());
            for(const auto * unit:targets)
            {
                const int accuracy=era_compat::sourceSpellContextAllows(*battle(),unit,getSpell()) && isReceptive(unit)
                    ?era_compat::statusRawAccuracy(*battle(),unit,true):0;
                if(rng.nextInt(1,100)>accuracy)resistantUnitIds.insert(unit->unitId());
            }
        }
        else if(era_compat::ConfluxPolicies::get().enabled()
            && getSpell()->getJsonKey()=="tum-era:sourceConfluxFireWallTrigger")
        {
            //59FFE0/5A0045 tests probability>0; it never rolls resistance.
        }
        else if((era_compat::confluxCastKind && *era_compat::confluxCastKind==1 && getSpellIndex()==15)
            || (sourceConfluxCast && getSpellIndex()>=15 && getSpellIndex()<=17))
        {
            //355 AfterMelee is Magic Arrow15, a single original target.
            //canSpellBeCast only checks probability>0. Kind1 explicitly skips
            //5A05E5..0628's resistance lottery at5A05DF, and15's dispatch
            //5A0C9A..0D3B contains no further draw. Partial resistance therefore
            //does not randomly prevent this automatic cast.
        }
		else if(eraExperiencePreAttack || eraArtifactMassHypnotize)
        {
            battle::Units sourceTargets;
            if(sourceMassTimed)
            {
                sourceTargets=battle()->battleGetUnitsIf([](const battle::Unit * unit){return unit->sourceMassSlot()!=-2;});
                // Original5A69E0 scans side then slot, including dead stacks,
                // removed clones not yet reused, towers and appended commanders.
                std::stable_sort(sourceTargets.begin(),sourceTargets.end(),[](const battle::Unit * a,const battle::Unit * b)
                {
                    if(a->unitSide()!=b->unitSide())return a->unitSide()==BattleSide::ATTACKER;
                    const auto aSlot=a->sourceMassSlot(),bSlot=b->sourceMassSlot();
                    // Additional/hypothetical native units retain native order
                    // after mapped slots. The source-slot service marks this
                    // compatibility extension outside the strict ERA domain.
                    if(aSlot<0 || bSlot<0)return aSlot>=0 && bSlot<0;
                    return aSlot<bSlot;
                });
            }
            else if(getSpellIndex()==59 && !target.empty())
            {
                //5A4B20: reverse source axial hex enumeration, first occurrence
                // of a living occupant; immunities are evaluated AFTER collection.
                for(const int hex:era_bridge::sourceAdvancedBerserkHexes(target.front().hexValue.toInt()))
                {
                    const auto * unit=battle()->battleGetUnitByPos(BattleHex(hex),true);
                    if(unit && std::find(sourceTargets.begin(),sourceTargets.end(),unit)==sourceTargets.end())
                        sourceTargets.push_back(unit);
                }
            }
            // Blind62 follows5A138F->444610 directly. Its already accepted
            // primary target receives no second resistance draw.
            for(const auto * unit:sourceTargets)
            {
                if(sourceMassTimed && unit->isHypnotized())continue; //before RNG at5A6A29.
                //5A8616..8634 rejects negative spells on the caster's ORIGINAL
                // side, but5A6A50 still consumes that candidate's RNG draw.
                const bool sourceOwnerAllowed=!eraArtifactMassHypnotize || unit->unitSide()!=casterSide;
                //5A86B6 rejects an active MagicMirror duration before the
                // general immunity wrapper, even when Orb93 negates immunity.
                const bool sourceMirrorAllowed=!eraArtifactMassHypnotize
                    || !unit->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36))));
                const int accuracy=(sourceOwnerAllowed && sourceMirrorAllowed && era_compat::sourceSpellContextAllows(*battle(),unit,getSpell()) && isReceptive(unit))?era_compat::statusRawAccuracy(*battle(),unit):0;
                if(rng.nextInt(1,100)>accuracy)resistantUnitIds.insert(unit->unitId());
            }
        }
        else
        {
            // Native behavior for every unregistered cast.
            for(const auto * unit:battle()->battleGetAllUnits(false))
            {
                const auto rod=era_compat::sourceLightningResistance(*battle(),getSpellIndex(),casterSide,*unit);
                const bool catalyst=era_compat::confluxCatalystNegates(*battle(),casterSide,isHeroCast());
                const int prob=rod?*rod:catalyst?100-era_compat::statusRawAccuracy(*battle(),unit,true):std::min(unit->magicResistance(),100);
                if(rng.nextInt(0,99)<prob)resistantUnitIds.insert(unit->unitId());
            }
        }
	}

	auto filterResisted = [&, this](const battle::Unit * unit) -> bool
	{
		return resistantUnitIds.contains(unit->unitId());
	};

	auto filterUnit = [&](const battle::Unit * unit)
	{
        // Original mass timed spell helper5A6A23 excludes hypnotized units.
        if(sourceMassTimed && unit->isHypnotized())
            return;
		if(filterResisted(unit))
			resisted.push_back(unit);
		else
			affectedUnits.push_back(unit);
	};

	if (!target.empty())
	{
		const battle::Unit * targetedUnit = battle()->battleGetUnitByPos(target.front().hexValue, true);
		if (isReflected(targetedUnit, rng)) {
			reflect(sc, rng, targetedUnit);
			return;
			}
	}

	//prepare targets
	effectsToApply = effects->prepare(this, target, spellTarget);

	std::set<const battle::Unit *> unitTargets = collectTargets();

    const bool oblivionRevival=era_compat::sourceOblivionActive(*battle())
        && (getSpellIndex()==38 || getSpellIndex()==39 || getSpellIndex()==40);
    if(oblivionRevival)
    {
        for(const auto * unit:unitTargets)
            if(getSpellIndex()!=40 || unit->isDead())resistantUnitIds.insert(unit->unitId());
    }

	//process them
	for(const auto * unit : unitTargets)
		filterUnit(unit);

	//and update targets
	for(auto & p : effectsToApply)
	{
		vstd::erase_if(p.second, [&](const Destination & d)
		{
			if(!d.unitValue)
				return false;
			return (sourceMassTimed && d.unitValue->isHypnotized()) || vstd::contains(resisted, d.unitValue);
		});
	}

	for(const auto * unit : resisted)
		sc.resistedCres.insert(unit->unitId());

    if(oblivionRevival)
    {
        // MR:F100 is reception failure after a real cast, not a targeting ban.
        // In particular Sacrifice must not consume its second (living) unit.
        effectsToApply.clear();affectedUnits.clear();
    }

	resistantUnitIds.clear();
}

bool BattleSpellMechanics::isReflected(const battle::Unit * unit, vstd::RNG & rng)
{
	if (unit == nullptr)
		return false;
	const std::vector<int> directSpellRange = { 0 };
	bool isDirectSpell = !isMassive() && owner -> getLevelInfo(getRangeLevel()).range == directSpellRange;
	bool spellIsReflectable = isDirectSpell && (mode == Mode::HERO || mode == Mode::MAGIC_MIRROR) && isNegativeSpell();
	bool targetCanReflectSpell = spellIsReflectable && unit->getAllBonuses(Selector::type()(BonusType::MAGIC_MIRROR))->size()>0;
	return targetCanReflectSpell && rng.nextInt(0, 99) < unit->valOfBonuses(BonusType::MAGIC_MIRROR);
}

void BattleSpellMechanics::reflect(BattleSpellCast & sc, vstd::RNG & rng, const battle::Unit * unit)
{
	auto otherSide = battle()->otherSide(unit->unitSide());
	auto newTarget = getRandomUnit(rng, otherSide);
	if (newTarget == nullptr)
		throw std::runtime_error("Failed to find random unit to reflect spell!");
	auto reflectedTo = newTarget->getPosition();

	mode = Mode::MAGIC_MIRROR;
	sc.reflectedCres.insert(unit->unitId());
	sc.tile = reflectedTo;

	if (!isReceptive(newTarget))
		sc.resistedCres.insert(newTarget->unitId());    //A spell can be reflected to then resisted by an immune unit. Consistent with the original game.

	beforeCast(sc, rng, { Destination(reflectedTo) });
}

const battle::Unit * BattleSpellMechanics::getRandomUnit(vstd::RNG & rng, const BattleSide & side)
{
	auto targets = battle()->getBattle()->getUnitsIf([&side](const battle::Unit * unit)
	{
		return unit->unitSide() == side && unit->isValidTarget(false) &&
			!unit->hasBonusOfType(BonusType::SIEGE_WEAPON);
	});
	return !targets.empty() ? (*RandomGeneratorUtil::nextItem(targets, rng)) : nullptr;
}

void BattleSpellMechanics::castEval(ServerCallback * server, const Target & target)
{
	affectedUnits.clear();
	//TODO: evaluate caster updates (mana usage etc.)
	//TODO: evaluate random values

	Target spellTarget = transformSpellTarget(target);

	effectsToApply = effects->prepare(this, target, spellTarget);

	std::set<const battle::Unit *> unitTargets = collectTargets();

	auto selector = std::bind(&BattleSpellMechanics::counteringSelector, this, _1);

	std::copy(std::begin(unitTargets), std::end(unitTargets), std::back_inserter(affectedUnits));
	doRemoveEffects(server, affectedUnits, selector);

	for(auto & p : effectsToApply)
		p.first->apply(server, this, p.second);
}

std::set<const battle::Unit *> BattleSpellMechanics::collectTargets() const
{
	std::set<const battle::Unit *> result;

	for(const auto & p : effectsToApply)
	{
		for(const Destination & d : p.second)
			if(d.unitValue)
				result.insert(d.unitValue);
	}

	return result;
}

void BattleSpellMechanics::doRemoveEffects(ServerCallback * server, const battle::Units & targets, const CSelector & selector)
{
	SetStackEffect sse;
	sse.battleID = battle()->getBattle()->getBattleID();

	for(const auto * unit : targets)
	{
		std::vector<Bonus> buffer;
		auto bl = unit->getBonuses(selector);

		for(const auto & item : *bl)
			buffer.emplace_back(*item);

		if(!buffer.empty())
			sse.toRemove.emplace_back(unit->unitId(), buffer);
	}

	if(!sse.toRemove.empty())
		server->apply(sse);
}

bool BattleSpellMechanics::counteringSelector(const Bonus * bonus) const
{
	if(bonus->source != BonusSource::SPELL_EFFECT)
		return false;

	for(const SpellID & id : owner->counteredSpells)
	{
		if(bonus->sid.as<SpellID>() == id)
			return true;
	}

	return false;
}

BattleHexArray BattleSpellMechanics::spellRangeInHexes(const BattleHex & centralHex) const
{
	using namespace SRSLPraserHelpers;

	BattleHexArray ret;
	std::vector<int> rng = owner->getLevelInfo(getRangeLevel()).range;

	for(auto & elem : rng)
	{
		std::set<ui16> curLayer = getInRange(centralHex.toInt(), elem, elem);
		//adding obtained hexes
		for(const auto & curLayer_it : curLayer)
			ret.insert(curLayer_it);
	}

	return ret;
}

Target BattleSpellMechanics::transformSpellTarget(const Target & aimPoint) const
{
	Target spellTarget;

	if(aimPoint.empty())
	{
		logGlobal->error("Aimed spell cast with no destination.");
	}
	else
	{
		const Destination & primary = aimPoint.at(0);
		BattleHex aimPointHex = primary.hexValue;

		//transform primary spell target with spell range (if it`s valid), leave anything else to effects

		if(aimPointHex.isValid())
		{
			auto spellRange = spellRangeInHexes(aimPointHex);
			for(const auto & hex : spellRange)
				spellTarget.push_back(Destination(hex));
		}
	}

	if(spellTarget.empty())
		spellTarget.push_back(Destination(BattleHex::INVALID));

	return spellTarget;
}

std::vector<AimType> BattleSpellMechanics::getTargetTypes() const
{
	auto ret = BaseMechanics::getTargetTypes();

	if(!ret.empty())
	{
		effects->forEachEffect(getEffectLevel(), [&](const effects::Effect * e, bool & stop)
		{
			e->adjustTargetTypes(ret);
			stop = ret.empty();
		});
	}

	return ret;
}

std::vector<Destination> BattleSpellMechanics::getPossibleDestinations(size_t index, AimType aimType, const Target & current, bool fast) const
{
	//TODO: BattleSpellMechanics::getPossibleDestinations

	if(index != 0)
		return std::vector<Destination>();

	std::vector<Destination> ret;

	switch(aimType)
	{
	case AimType::CREATURE:
	{
		auto stacks = battle()->battleGetAllStacks();

		for(auto stack : stacks)
		{
			Target tmp = current;
			tmp.emplace_back(stack->getPosition());

			if(canBeCastAt(tmp))
				ret.emplace_back(stack->getPosition());
		}

		break;
	}

	case AimType::LOCATION:
		if(fast)
		{
			auto stacks = battle()->battleGetAllStacks();
			BattleHexArray hexesToCheck;

			for(auto stack : stacks)
			{
				hexesToCheck.insert(stack->getPosition());
				hexesToCheck.insert(stack->getPosition().getNeighbouringTiles());
			}

			for(const auto & hex : hexesToCheck)
			{
				if(hex.isAvailable())
				{
					Target tmp = current;
					tmp.emplace_back(hex);

					if(canBeCastAt(tmp))
						ret.emplace_back(hex);
				}
			}
		}
		else
		{
			for(int i = 0; i < GameConstants::BFIELD_SIZE; i++)
			{
				BattleHex dest(i);
				if(dest.isAvailable())
				{
					Target tmp = current;
					tmp.emplace_back(dest);

					if(canBeCastAt(tmp))
						ret.emplace_back(dest);
				}
			}
		}
		break;
	case AimType::NO_TARGET:
		ret.emplace_back();
		break;
	default:
		break;
	}

	return ret;
}

bool BattleSpellMechanics::isReceptive(const battle::Unit * target) const
{
    if(target)if(const auto override=era_compat::sourceLightningReceptive(*battle(),getSpellIndex(),casterSide,*target))return *override;
	return targetCondition->isReceptive(this, target);
}

bool BattleSpellMechanics::isSmart() const
{
	return mode != Mode::MAGIC_MIRROR && BaseMechanics::isSmart();
}

bool BattleSpellMechanics::wouldResist(const battle::Unit * unit) const
{
	return resistantUnitIds.contains(unit->unitId());
}

BattleHexArray BattleSpellMechanics::rangeInHexes(const BattleHex & centralHex) const
{
	if(isMassive() || !centralHex.isValid())
		return BattleHexArray();

	Target aimPoint;
	aimPoint.push_back(Destination(centralHex));

	Target spellTarget = transformSpellTarget(aimPoint);

	BattleHexArray effectRange;

	effects->forEachEffect(getEffectLevel(), [&](const effects::Effect * effect, bool & stop)
	{
		if(!effect->indirect)
		{
			effect->adjustAffectedHexes(effectRange, this, spellTarget);
		}
	});

	return effectRange;
}

Target BattleSpellMechanics::canonicalizeTarget(const Target & aim) const
{
	return transformSpellTarget(aim);
}

const Spell * BattleSpellMechanics::getSpell() const
{
	return owner;
}


}


VCMI_LIB_NAMESPACE_END
