/*
 * BattleEffectsController.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/era/EraAdvancedArtifactPolicies.h"
#include "BattleEffectsController.h"

#include "BattleAnimationClasses.h"
#include "BattleFieldController.h"
#include "BattleInterface.h"
#include "BattleRenderer.h"
#include "BattleStacksController.h"
#include "BattleWindow.h"

#include "../CPlayerInterface.h"
#include "../GameEngine.h"
#include "../media/ISoundPlayer.h"
#include "../render/CAnimation.h"
#include "../render/Canvas.h"
#include "../render/Graphics.h"

#include "../../lib/CStack.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/era/EraConfluxPolicies.h"
#include "../../lib/battle/BattleAction.h"
#include "../../lib/battle/CPlayerBattleCallback.h"
#include "../../lib/filesystem/ResourcePath.h"
#include "../../lib/json/JsonUtils.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/texts/CGeneralTextHandler.h"

BattleEffectsController::BattleEffectsController(BattleInterface & owner):
	owner(owner)
{
	loadColorMuxers();
}

void BattleEffectsController::displayEffect(EBattleEffect effect, const BattleHex & destTile)
{
	displayEffect(effect, AudioPath(), destTile);
}

void BattleEffectsController::displayEffect(EBattleEffect effect, const AudioPath & soundFile, const BattleHex & destTile, float transparencyFactor)
{
	size_t effectID = static_cast<size_t>(effect);

	AnimationPath customAnim = AnimationPath::builtinTODO(graphics->battleACToDef[effectID][0]);

	ENGINE->sound().playSound( soundFile );

	owner.stacksController->addNewAnim(new EffectAnimation(owner, customAnim, destTile, 0, transparencyFactor));
}

void BattleEffectsController::battleTriggerEffect(const BattleTriggerEffect & bte)
{
	owner.checkForAnimations();

	const CStack * stack = owner.getBattle()->battleGetStackByID(bte.stackID);
	if(!stack)
	{
		logGlobal->error("Invalid stack ID %d", bte.stackID);
		return;
	}
	//don't show animation when no HP is regenerated
	switch(bte.effect)
	{
        case BonusType::SPELL_DAMAGE:
            if(bte.val!=220 || bte.additionalInfo!=37
                || !era_compat::AdvancedArtifactPolicies::get().lightningRod("tum-era:artifact220"))return;
            displayEffect(static_cast<EBattleEffect>(37),AudioPath(),stack->getPosition());
            break;
        case BonusType::GENERAL_DAMAGE_REDUCTION:
        {
            if(bte.val==30 && bte.additionalInfo==89
                && era_compat::Policies::get().sourceRangedResistance30(stack->creatureId().toCreature()->getJsonKey()))
            {
                if(stack->alive() && stack->getPosition().isValid())
                    pendingRangedResistances.emplace(stack->unitId(),stack->getPosition());
                break;
            }
            if(bte.val!=100 || bte.additionalInfo!=85
                || !era_compat::Policies::get().physicalBlock(stack->creatureId().toCreature()->getJsonKey()))
                return;
            if(stack->alive() && stack->getPosition().isValid())
                pendingFullBlocks.emplace(stack->unitId(),stack->getPosition());
            break;
        }
        case BonusType::MAGIC_MIRROR:
            displayEffect(EBattleEffect::MAGIC_MIRROR, AudioPath::builtin("BACKLASH"), stack->getPosition());
            break;
        case BonusType::MAGIC_RESISTANCE:
            displayEffect(EBattleEffect::RESISTANCE, AudioPath::builtin("MAGICRES"), stack->getPosition());
            break;
		case BonusType::HP_REGENERATION:
			displayEffect(EBattleEffect::REGENERATION, AudioPath::builtin("REGENER"), stack->getPosition(), 0.5);
			break;
        case BonusType::MANA_CHANNELING:
        {
            if(bte.val<=0 || (bte.additionalInfo!=0 && bte.additionalInfo!=1)
                || !era_compat::ConfluxPolicies::get().is356(stack->creatureId().toCreature()->getJsonKey()))return;
            // Server evaluates source356 after effects. checkForAnimations()
            // has completed that spell, so enqueue the original SP07 pair now.
            const bool defender=bte.additionalInfo==1;
            owner.stacksController->addNewAnim(new EffectAnimation(owner,
                AnimationPath::builtin(defender?"SP07_A.DEF":"SP07_B.DEF"),Point(15,30)));
            owner.stacksController->addNewAnim(new EffectAnimation(owner,
                AnimationPath::builtin(defender?"SP07_B.DEF":"SP07_A.DEF"),Point(755,30)));
            break;
        }
		case BonusType::MANA_DRAIN:
			displayEffect(EBattleEffect::MANA_DRAIN, AudioPath::builtin("MANADRAI"), stack->getPosition());
			break;
		case BonusType::POISON:
			displayEffect(EBattleEffect::POISON, AudioPath::builtin("POISON"), stack->getPosition());
			break;
		case BonusType::FEARFUL:
			displayEffect(EBattleEffect::FEAR, AudioPath::builtin("FEAR"), stack->getPosition(), 0.5);
			break;
		case BonusType::MORALE:
		{
			std::string hlp = LIBRARY->generaltexth->allTexts[33];
			boost::algorithm::replace_first(hlp,"%s",(stack->getName()));
			displayEffect(EBattleEffect::GOOD_MORALE, AudioPath::builtin("GOODMRLE"), stack->getPosition());
			owner.appendBattleLog(hlp);
			break;
		}
		default:
			return;
	}
	owner.waitForAnimations();
}

void BattleEffectsController::queueFullBlockAtHit(const CStack * defender)
{
    if(!defender) return;
    const auto ranged=pendingRangedResistances.find(defender->unitId());
    if(ranged!=pendingRangedResistances.end())
    {
        const auto position=ranged->second;
        pendingRangedResistances.erase(ranged);
        // Resistance89 is announced before casualties in the source and also
        // appears on a lethal hit; do not require post-packet alive state.
        if(position.isValid() && defender->getPosition()==position)
            owner.addToAnimationStage(EAnimationEvents::HIT,[this,position]()
            {
                displayEffect(static_cast<EBattleEffect>(89),AudioPath::builtin("tum-era/inferno-resistance/shotres"),position);
            });
    }
    const auto pending=pendingFullBlocks.find(defender->unitId());
    if(pending==pendingFullBlocks.end()) return;
    const auto position=pending->second;
    pendingFullBlocks.erase(pending); // Exactly one announcement per hit.
    if(!defender->alive() || !position.isValid() || defender->getPosition()!=position)
        return; // Do not replay a stale marker on a changed/removed stack.
    owner.addToAnimationStage(EAnimationEvents::HIT,[this,position]()
    {
        // MGblock2 in the source table is an IFC20 Immersion haptic effect,
        // not a sound. Preserve its no-device no-op on the web (4B6750).
        displayEffect(EBattleEffect::ERA_FULL_BLOCK,position);
    });
}

void BattleEffectsController::startAction(const BattleAction & action)
{
    pendingFullBlocks.clear(); // Any unconsumed prior-action announcement is stale.
    pendingRangedResistances.clear();
	owner.checkForAnimations();

	const CStack *stack = owner.getBattle()->battleGetStackByID(action.stackNumber);

	switch(action.actionType)
	{
	case EActionType::WAIT:
		owner.appendBattleLog(stack->formatGeneralMessage(136));
		break;
	case EActionType::BAD_MORALE:
		owner.appendBattleLog(stack->formatGeneralMessage(-34));
		displayEffect(EBattleEffect::BAD_MORALE, AudioPath::builtin("BADMRLE"), stack->getPosition());
		break;
	}

	owner.waitForAnimations();
}

void BattleEffectsController::collectRenderableObjects(BattleRenderer & renderer)
{
	for (auto & elem : battleEffects)
	{
		renderer.insert( EBattleFieldLayer::EFFECTS, elem.tile, [&elem](BattleRenderer::RendererRef canvas)
		{
			int currentFrame = static_cast<int>(floor(elem.currentFrame));
			currentFrame %= elem.animation->size();

			auto img = elem.animation->getImage(currentFrame, static_cast<size_t>(elem.type));
			img->setAlpha(255 * elem.transparencyFactor);

			if(canvas.hasMobileUprightImages())
			{
				// A screen effect is one upright tiled plane, rather than individually
				// rotated native tiles (which leave gaps for non-square animations).
				if(elem.screenFill && elem.pos != Point(0, 0))return;
				if(elem.mobileAnchors.size()>1){canvas.drawMobileUprightFootprint(img,elem.pos,elem.mobileAnchors);return;}
				if(!elem.screenFill && elem.hasMobileAnchor){
					canvas.drawMobileUprightAt(img, elem.pos, elem.mobileAnchor);return;
				}
				canvas.setMobileUprightImages(elem.screenFill ? 3 : elem.bottomAligned ? 1 : 2);
			}
			canvas.draw(img, elem.pos);
		});
	}
}

void BattleEffectsController::loadColorMuxers()
{
	const JsonNode config = JsonUtils::assembleFromFiles("config/battleEffects.json");

	for(auto & muxer : config["colorMuxers"].Struct())
	{
		ColorMuxerEffect effect;
		std::string identifier = muxer.first;

		for (const JsonNode & entry : muxer.second.Vector() )
		{
			effect.timePoints.push_back(entry["time"].Float());
			effect.effectColors.push_back(ColorRGBA(255*entry["color"][0].Float(), 255*entry["color"][1].Float(), 255*entry["color"][2].Float(), 255*entry["color"][3].Float()));
			effect.transparency.push_back(entry["alpha"].Float() * 255);
		}
		colorMuxerEffects[identifier] = effect;
	}
}

const ColorMuxerEffect & BattleEffectsController::getMuxerEffect(const std::string & name)
{
	static const ColorMuxerEffect emptyEffect;

	if (colorMuxerEffects.count(name))
		return colorMuxerEffects[name];

	logAnim->error("Failed to find color muxer effect named '%s'!", name);
	return emptyEffect;
}
