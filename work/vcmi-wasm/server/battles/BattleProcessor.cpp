/*
 * BattleProcessor.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "BattleProcessor.h"
#include "../era/SourceCampaignProcessor.h"

#include "BattleActionProcessor.h"
#include "BattleFlowProcessor.h"
#include "BattleResultProcessor.h"

#include "../CGameHandler.h"
#include "../queries/QueriesProcessor.h"
#include "../queries/BattleQueries.h"

#include "../../lib/CStack.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/TerrainHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/CObstacleInstance.h"
#include "../../lib/battle/BattleInfo.h"
#include "../../lib/battle/BattleLayout.h"
#include "../../lib/entities/building/TownFortifications.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/CPlayerState.h"
#include <vstd/RNG.h>

BattleProcessor::BattleProcessor(CGameHandler * gameHandler)
	: gameHandler(gameHandler)
	, actionsProcessor(std::make_unique<BattleActionProcessor>(this, gameHandler))
	, flowProcessor(std::make_unique<BattleFlowProcessor>(this, gameHandler))
	, resultProcessor(std::make_unique<BattleResultProcessor>(gameHandler))
{
}

BattleProcessor::~BattleProcessor() = default;

void BattleProcessor::engageIntoBattle(PlayerColor player)
{
	//notify interfaces
	PlayerBlocked pb;
	pb.player = player;
	pb.reason = PlayerBlocked::UPCOMING_BATTLE;
	pb.startOrEnd = PlayerBlocked::BLOCKADE_STARTED;
	gameHandler->sendAndApply(pb);
}

void BattleProcessor::restartBattle(const BattleID & battleID, const CArmedInstance *army1, const CArmedInstance *army2, int3 tile,
								const CGHeroInstance *hero1, const CGHeroInstance *hero2, const BattleLayout & layout, const CGTownInstance *town)
{
	auto battle = gameHandler->gameState().getBattle(battleID);

	auto lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(battle->getSide(BattleSide::ATTACKER).color));
	if(!lastBattleQuery)
		lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(battle->getSide(BattleSide::DEFENDER).color));

	assert(lastBattleQuery);

	//existing battle query for retying auto-combat
	if(lastBattleQuery)
	{
		BattleSideArray<const CGHeroInstance*> heroes{hero1, hero2};

		for(auto i : {BattleSide::ATTACKER, BattleSide::DEFENDER})
		{
			if(heroes[i])
			{
				SetMana restoreInitialMana;
				restoreInitialMana.val = battle->getSide(i).initialMana;
				restoreInitialMana.hid = heroes[i]->id;
				restoreInitialMana.mode = ChangeValueMode::ABSOLUTE;
				gameHandler->sendAndApply(restoreInitialMana);
			}
		}

		lastBattleQuery->result = std::nullopt;

		assert(lastBattleQuery->belligerents[BattleSide::ATTACKER] == battle->getSideArmy(BattleSide::ATTACKER));
		assert(lastBattleQuery->belligerents[BattleSide::DEFENDER] == battle->getSideArmy(BattleSide::DEFENDER));
	}

	BattleCancelled bc;
	bc.battleID = battleID;
	gameHandler->sendAndApply(bc);

	startBattle(army1, army2, tile, hero1, hero2, layout, town);
}

void BattleProcessor::startBattle(const CArmedInstance *army1, const CArmedInstance *army2, int3 tile,
 const CGHeroInstance *hero1, const CGHeroInstance *hero2, const BattleLayout & layout, const CGTownInstance *town)
{
 if(gameHandler->sourceCampaigns->battleEvent(0,army1->id,army2->id,hero1?hero1->id:ObjectInstanceID::NONE,hero2?hero2->id:ObjectInstanceID::NONE,
  [this,army1,army2,tile,hero1,hero2,layout,town](){startBattlePrepared(army1,army2,tile,hero1,hero2,layout,town);}))return;
 startBattlePrepared(army1,army2,tile,hero1,hero2,layout,town);
}

void BattleProcessor::startBattlePrepared(const CArmedInstance *army1, const CArmedInstance *army2, int3 tile,
								const CGHeroInstance *hero1, const CGHeroInstance *hero2, const BattleLayout & layout, const CGTownInstance *town)
{
	hero1=gameHandler->sourceCampaigns->battleHero(0,hero1);
	hero2=gameHandler->sourceCampaigns->battleHero(1,hero2);
	assert(gameHandler->gameState().getBattle(army1->getOwner()) == nullptr);
	assert(gameHandler->gameState().getBattle(army2->getOwner()) == nullptr);

	BattleSideArray<const CArmedInstance *> armies{army1, army2};
	BattleSideArray<const CGHeroInstance*>heroes{hero1, hero2};

	auto battleID = setupBattle(tile, armies, heroes, layout, town); //initializes stacks, places creatures on battlefield, blocks and informs player interfaces

	const auto * battle = gameHandler->gameState().getBattle(battleID);
	assert(battle);
	
	//add battle bonuses based from player state only when attacks neutral creatures
	const auto * attackerInfo = gameHandler->gameInfo().getPlayerState(army1->getOwner(), false);
	if(attackerInfo && !army2->getOwner().isValidPlayer())
	{
		for(const auto & bonus : attackerInfo->battleBonuses)
		{
			GiveBonus giveBonus(GiveBonus::ETarget::OBJECT);
			giveBonus.id = hero1->id;
			giveBonus.bonus = bonus;
			gameHandler->sendAndApply(giveBonus);
		}
	}

	auto lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(battle->getSide(BattleSide::ATTACKER).color));
	if(!lastBattleQuery)
		lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(battle->getSide(BattleSide::DEFENDER).color));

	if (lastBattleQuery)
	{
		lastBattleQuery->battleID = battleID;
	}
	else
	{
		auto newBattleQuery = std::make_shared<CBattleQuery>(gameHandler, battle);
		gameHandler->queries->addQuery(newBattleQuery);
	}

	flowProcessor->onBattleStarted(*battle);
}

void BattleProcessor::startBattle(const CArmedInstance *army1, const CArmedInstance *army2)
{
	startBattle(army1, army2, army2->visitablePos(),
		army1->ID == Obj::HERO ? dynamic_cast<const CGHeroInstance*>(army1) : nullptr,
		army2->ID == Obj::HERO ? dynamic_cast<const CGHeroInstance*>(army2) : nullptr,
		BattleLayout::createDefaultLayout(gameHandler->gameInfo(), army1, army2),
		nullptr);
}

BattleID BattleProcessor::setupBattle(int3 tile, BattleSideArray<const CArmedInstance *> armies, BattleSideArray<const CGHeroInstance *> heroes, const BattleLayout & layout, const CGTownInstance *town)
{
	const auto & t = *gameHandler->gameInfo().getTile(tile);
	TerrainId terrain = t.getTerrainID();
	if (town)
		terrain = town->getNativeTerrain();
	else if (gameHandler->gameState().getMap().isCoastalTile(tile)) //coastal tile is always ground
		terrain = ETerrainId::SAND;

	BattleField battlefieldType = gameHandler->gameState().battleGetBattlefieldType(tile, gameHandler->getRandomGenerator());

	if (town)
	{
		const TerrainType* terrainData = LIBRARY->terrainTypeHandler->getById(terrain);
		battlefieldType = BattleField(*RandomGeneratorUtil::nextItem(terrainData->battleFields, gameHandler->getRandomGenerator()));
	}
	else if (heroes[BattleSide::ATTACKER] && heroes[BattleSide::ATTACKER]->inBoat() && heroes[BattleSide::DEFENDER] && heroes[BattleSide::DEFENDER]->inBoat())
		battlefieldType = BattleField(*LIBRARY->identifiers()->getIdentifier("core", "battlefield.ship_to_ship"));

	if(gameHandler->sourceCampaigns->battleBackground()==12)
		battlefieldType=BattleField(*LIBRARY->identifiers()->getIdentifier("core","battlefield.subterranean"));
	//send info about battles
	BattleStart bs;
	bs.info = BattleInfo::setupBattle(&gameHandler->gameInfo(), tile, terrain, battlefieldType, armies, heroes, layout, town);
	bs.battleID = gameHandler->gameState().nextBattleID;

	engageIntoBattle(bs.info->getSide(BattleSide::ATTACKER).color);
	engageIntoBattle(bs.info->getSide(BattleSide::DEFENDER).color);

	auto lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(bs.info->getSide(BattleSide::ATTACKER).color));
	if(!lastBattleQuery)
		lastBattleQuery = std::dynamic_pointer_cast<CBattleQuery>(gameHandler->queries->topQuery(bs.info->getSide(BattleSide::DEFENDER).color));
	bool isDefenderHuman = bs.info->getSide(BattleSide::DEFENDER).color.isValidPlayer() && gameHandler->gameInfo().getPlayerState(bs.info->getSide(BattleSide::DEFENDER).color)->isHuman();
	bool isAttackerHuman = gameHandler->gameInfo().getPlayerState(bs.info->getSide(BattleSide::ATTACKER).color)->isHuman();

	bool onlyOnePlayerHuman = isDefenderHuman != isAttackerHuman;
	bs.info->replayAllowed = lastBattleQuery == nullptr && onlyOnePlayerHuman;

 // Only field battles against a non-human defender, with one StarCraft unit per creature.
 // Unsupported large armies, summons and town sieges keep native Heroes combat.
#ifdef __EMSCRIPTEN__
 bool eligible=crossoverPlayers.count(armies[BattleSide::ATTACKER]->getOwner()) && !town && !isDefenderHuman && isAttackerHuman;
 int totals[2]={0,0};
 for(const auto & stack:bs.info->stacks){
  const int side=stack->unitSide()==BattleSide::ATTACKER?0:1;
  if(stack->isTurret() || stack->summoned)eligible=false;
  totals[side]+=stack->getCount();
 }
 bs.crossover=eligible && bs.info->stacks.size()<=32 && totals[0]>0 && totals[1]>0 && totals[0]<=128 && totals[1]<=128;
 if(bs.crossover){bs.info->tacticDistance=0;bs.info->replayAllowed=false;}
#endif
 gameHandler->sendAndApply(bs);

	gameHandler->sourceCampaigns->battlePrepared();

	return bs.battleID;
}

bool BattleProcessor::checkBattleStateChanges(const CBattleInfoCallback & battle)
{
	//check if drawbridge state need to be changes
	if (battle.battleGetFortifications().wallsHealth > 0)
		updateGateState(battle);

	if (resultProcessor->battleIsEnding(battle))
		return true;

	//check if battle ended
	if (auto result = battle.battleIsFinished())
	{
		setBattleResult(battle, EBattleResult::NORMAL, *result);
		return true;
	}

	return false;
}

void BattleProcessor::updateGateState(const CBattleInfoCallback & battle)
{
	// GATE_BRIDGE - leftmost tile, located over moat
	// GATE_OUTER - central tile, mostly covered by gate image
	// GATE_INNER - rightmost tile, inside the walls

	// GATE_OUTER or GATE_INNER:
	// - if defender moves unit on these tiles, bridge will open
	// - if there is a creature (dead or alive) on these tiles, bridge will always remain open
	// - blocked to attacker if bridge is closed

	// GATE_BRIDGE
	// - if there is a unit or corpse here, bridge can't open (and can't close in fortress)
	// - if Force Field is cast here, bridge can't open (but can close, in any town)
	// - deals moat damage to attacker if bridge is closed (fortress only)

	bool hasForceFieldOnBridge = !battle.battleGetAllObstaclesOnPos(BattleHex(BattleHex::GATE_BRIDGE), true).empty();
	bool hasStackAtGateInner   = battle.battleGetUnitByPos(BattleHex(BattleHex::GATE_INNER), false) != nullptr;
	bool hasStackAtGateOuter   = battle.battleGetUnitByPos(BattleHex(BattleHex::GATE_OUTER), false) != nullptr;
	bool hasStackAtGateBridge  = battle.battleGetUnitByPos(BattleHex(BattleHex::GATE_BRIDGE), false) != nullptr;
	bool hasWideMoat           = vstd::contains_if(battle.battleGetAllObstaclesOnPos(BattleHex(BattleHex::GATE_BRIDGE), false), [](const std::shared_ptr<const CObstacleInstance> & obst)
	{
		return obst->obstacleType == CObstacleInstance::MOAT;
	});

	BattleUpdateGateState db;
	db.state = battle.battleGetGateState();
	db.battleID = battle.getBattle()->getBattleID();

	if (battle.battleGetWallState(EWallPart::GATE) == EWallState::DESTROYED)
	{
		db.state = EGateState::DESTROYED;
	}
	else if (db.state == EGateState::OPENED)
	{
		bool hasStackOnLongBridge = hasStackAtGateBridge && hasWideMoat;
		bool gateCanClose = !hasStackAtGateInner && !hasStackAtGateOuter && !hasStackOnLongBridge;

		if (gateCanClose)
			db.state = EGateState::CLOSED;
		else
			db.state = EGateState::OPENED;
	}
	else // CLOSED or BLOCKED
	{
		bool gateBlocked = hasForceFieldOnBridge || hasStackAtGateBridge;

		if (gateBlocked)
			db.state = EGateState::BLOCKED;
		else
			db.state = EGateState::CLOSED;
	}

	if (db.state != battle.battleGetGateState())
		gameHandler->sendAndApply(db);
}

bool BattleProcessor::makePlayerBattleAction(const BattleID & battleID, PlayerColor player, const BattleAction &ba)
{
	const auto * battle = gameHandler->gameState().getBattle(battleID);

	if (!battle)
		return false;

	if(battle->crossover)return false;
	bool result = actionsProcessor->makePlayerBattleAction(*battle, player, ba);
	if (gameHandler->gameState().getBattle(battleID) != nullptr && !resultProcessor->battleIsEnding(*battle))
		flowProcessor->onActionMade(*battle, ba);
	return result;
}

bool BattleProcessor::crossoverCommand(PlayerColor player,int operation,BattleID battleID,const std::vector<std::pair<uint32_t,int32_t>> & survivors,const std::string & resumeState,std::shared_ptr<SetStackEffect> resumeEffects)
{
#ifndef __EMSCRIPTEN__
 return false;
#else
 const auto state=gameHandler->gameInfo().getPlayerState(player,false);
 if(!state || !state->isHuman())return false;
 if(operation==0){
  // Configure only outside combat; never enable for multiplayer/hotseat teams.
  if(gameHandler->gameState().getBattle(player) || !survivors.empty())return false;
  int humans=0;for(int i=0;i<8;i++){const auto p=gameHandler->gameInfo().getPlayerState(PlayerColor(i),false);if(p&&p->isHuman())++humans;}
  if(humans!=1)return false;
  if(battleID.getNum()==1)crossoverPlayers.insert(player);else if(battleID.getNum()==0)crossoverPlayers.erase(player);else return false;
  return true;
 }
 auto battle=const_cast<BattleInfo*>(gameHandler->gameState().getBattle(battleID));
 if(!battle || battle->getSide(BattleSide::ATTACKER).color!=player)return false;
 if(operation==3 && survivors.empty()){
  if(battle->crossover||battle->townID!=ObjectInstanceID::NONE||battle->getRound()<1||battle->battleTacticDist()!=0)return false;
  const auto active=battle->battleActiveUnit();if(!active||battle->battleGetOwner(active)!=player)return false;
  int humans=0,totals[2]={0,0};for(int i=0;i<8;i++){const auto p=gameHandler->gameInfo().getPlayerState(PlayerColor(i),false);if(p&&p->isHuman())++humans;}if(humans!=1)return false;
  const auto defender=gameHandler->gameInfo().getPlayerState(battle->getSide(BattleSide::DEFENDER).color,false);if(defender&&defender->isHuman())return false;
  if(battle->stacks.size()>32)return false;for(const auto & stack:battle->stacks){if(stack->isTurret())return false;totals[stack->unitSide()==BattleSide::ATTACKER?0:1]+=stack->getCount();}if(totals[0]<1||totals[1]<1||totals[0]>128||totals[1]>128)return false;
  BattleUnitsChanged change;change.battleID=battleID;change.crossoverMode=2;gameHandler->sendAndApply(change);battle->replayAllowed=false;return true;
 }
 if(!battle->crossover)return false;
 if(operation==4&&survivors.empty()){
  const auto reject=[&](const char * reason){gameHandler->complain(std::string("Retour classique refusé : ")+reason);return false;};
  if(resumeState.empty()||resumeState.size()>2*1024*1024)return reject("état de combat manquant ou trop volumineux");
  const JsonNode snapshot(resumeState.data(),resumeState.size(),"crossover return");const auto & rows=snapshot["stacks"].Vector();
  const int mana=snapshot["mana"].Integer(),casts=snapshot["heroCasts"].Integer();const auto hero=battle->battleGetFightingHero(BattleSide::ATTACKER);
  if(rows.empty()||rows.size()>128||mana<0||(hero?mana>hero->mana:mana!=0)||casts<0||casts>128)return reject("mana ou nombre de groupes incohérent");
  std::set<uint32_t> seen;int totals[2]={0,0};BattleUnitsChanged additions,changes;additions.battleID=changes.battleID=battleID;SetStackEffect effects;effects.battleID=battleID;
  for(const auto & row:rows){const int id=row["id"].Integer(),side=row["side"].Integer(),count=row["count"].Integer(),hp=row["hp"].Integer(),maximum=row["maxHp"].Integer();
   if(id<0||id>100000||!seen.insert(id).second||side<0||side>1||count<0||count>128||maximum<1||maximum>10000||hp<0||hp>count*maximum||(count&&hp<=(count-1)*maximum))return reject("identifiant, effectif ou points de vie invalides");
   const auto & serialized=row["unitState"];const auto & state=serialized["state"];if(state["health"]["fullUnits"].Integer()!=(count?count-1:0)||state["health"]["firstHPleft"].Integer()!=(count?hp-(count-1)*maximum:0))return reject("blessure de groupe incohérente");
   const auto original=battle->getStack(id,false);if(original){if(row["type"].Integer()!=original->creatureId().getNum()||side!=(original->unitSide()==BattleSide::ATTACKER?0:1)||(!original->summoned&&!original->cloned&&count>std::max<int>(original->unitBaseAmount(),original->getCount())))return reject("le groupe ne correspond pas à l’armée de départ");}
   else {if(!row["temporary"].Bool()||(!row["info"]["newUnitInfo"]["summoned"].Bool()&&!state["cloned"].Bool())||count==0)continue;const CreatureID type(row["type"].Integer());if(type.getNum()<0||type.getNum()>=LIBRARY->creh->objects.size())return reject("créature invoquée inconnue");UnitChanges add(id,UnitChanges::EOperation::ADD);add.data=row["info"];additions.changedStacks.push_back(add);}
   if(count&&!BattleHex(state["position"].Integer()).isValid())return reject("position de combat invalide");totals[side]+=count;
   UnitChanges change(id,UnitChanges::EOperation::RESET_STATE);change.data=serialized;change.data["crossoverResume"].Bool()=true;change.healthDelta=hp-(original?original->getAvailableHealth():0);changes.changedStacks.push_back(change);
   std::vector<Bonus> remove;if(original)for(const auto & bonus:original->getExportedBonusList())if(bonus->source==BonusSource::SPELL_EFFECT)remove.push_back(*bonus);
   effects.toRemove.emplace_back(id,remove);
  }
  for(const auto & stack:battle->stacks)if(!seen.count(stack->unitId()))return reject("groupe initial absent du transfert");if(totals[0]>128||totals[1]>128)return reject("effectif trop élevé");
  if(!resumeEffects||resumeEffects->battleID!=battleID||!resumeEffects->toRemove.empty()||!resumeEffects->toUpdate.empty()||resumeEffects->toAdd.size()>128)return reject("état des sorts incohérent");
  std::set<uint32_t> effectIDs;for(const auto & entry:resumeEffects->toAdd){if(!seen.count(entry.first)||!effectIDs.insert(entry.first).second||entry.second.size()>256)return reject("effets de groupe incohérents");for(const auto & bonus:entry.second)if(bonus.source!=BonusSource::SPELL_EFFECT)return reject("source de sort invalide");if(battle->getStack(entry.first,false)||std::any_of(additions.changedStacks.begin(),additions.changedStacks.end(),[&](const UnitChanges & add){return add.id==entry.first;}))effects.toAdd.push_back(entry);}
  BattleObstaclesChanged removeObstacles,addObstacles;removeObstacles.battleID=addObstacles.battleID=battleID;std::set<int> obstacleIDs;
  for(const auto & obstacle:battle->obstacles)if(dynamic_cast<const SpellCreatedObstacle*>(obstacle.get()))removeObstacles.changes.emplace_back(obstacle->uniqueID,ObstacleChanges::EOperation::REMOVE);else obstacleIDs.insert(obstacle->uniqueID);
  if(snapshot["obstacles"].Vector().size()>512)return reject("trop d’obstacles");for(const auto & row:snapshot["obstacles"].Vector()){const int id=row["id"].Integer();if(id<0||id>100000||!obstacleIDs.insert(id).second)return reject("obstacle de sort invalide");ObstacleChanges change(id,ObstacleChanges::EOperation::ADD);change.data=row["data"];addObstacles.changes.push_back(change);}
  if(!removeObstacles.changes.empty())gameHandler->sendAndApply(removeObstacles);if(!addObstacles.changes.empty())gameHandler->sendAndApply(addObstacles);
  if(!additions.changedStacks.empty())gameHandler->sendAndApply(additions);gameHandler->sendAndApply(effects);changes.crossoverMode=0;changes.crossoverHeroCasts=casts;gameHandler->sendAndApply(changes);
  if(hero&&mana!=hero->mana){SetMana update(hero->id,mana,ChangeValueMode::ABSOLUTE);gameHandler->sendAndApply(update);}battle->replayAllowed=false;flowProcessor->resumeCrossover(*battle);return true;
 }
 if(operation==2 && survivors.empty()){
  BattleUnitsChanged change;change.battleID=battleID;change.crossoverMode=0;gameHandler->sendAndApply(change);flowProcessor->resumeCrossover(*battle);return true;
 }
 int manaSpent=0;std::vector<std::pair<uint32_t,int32_t>> survivorsOnly;
 for(const auto & row:survivors){if(row.first==2147483647u){if(row.second<0)return false;manaSpent=row.second;}else survivorsOnly.push_back(row);}
 if(operation!=1 || survivorsOnly.size()!=battle->stacks.size() || survivorsOnly.size()>32)return false;
 std::map<uint32_t,int32_t> counts;
 for(const auto & row:survivorsOnly)if(row.second<0 || !counts.emplace(row).second)return false;
 int totals[2]={0,0};
 for(const auto & stack:battle->stacks){
  const auto found=counts.find(stack->unitId());
  if(found==counts.end() || found->second>std::max<int>(stack->getCount(),stack->unitBaseAmount()))return false;
  totals[stack->unitSide()==BattleSide::ATTACKER?0:1]+=found->second;
 }
 if(totals[0]>0 && totals[1]>0)return false; // No fabricated mid-battle resolution.
 BattleUnitsChanged changes;changes.battleID=battleID;
 for(const auto & stack:battle->stacks){
  auto next=stack->acquireState();int64_t damage=int64_t(stack->getCount()-counts.at(stack->unitId()))*stack->getMaxHealth();
  if(damage>=0)next->damage(damage);else{int64_t healing=-damage;next->heal(healing,EHealLevel::RESURRECT,EHealPower::PERMANENT);}
  UnitChanges change(stack->unitId(),UnitChanges::EOperation::RESET_STATE);next->save(change.data);change.healthDelta=-damage;changes.changedStacks.push_back(std::move(change));
 }
 if(const auto hero=battle->battleGetFightingHero(BattleSide::ATTACKER);hero&&manaSpent>hero->mana)return false;
 gameHandler->sendAndApply(changes);
 if(const auto hero=battle->battleGetFightingHero(BattleSide::ATTACKER);hero&&manaSpent){SetMana mana(hero->id,-manaSpent,ChangeValueMode::RELATIVE);gameHandler->sendAndApply(mana);}
 battle->crossover=false;
 setBattleResult(*battle,EBattleResult::NORMAL,totals[0]>0?BattleSide::ATTACKER:totals[1]>0?BattleSide::DEFENDER:BattleSide::NONE);
 return true;
#endif
}

void BattleProcessor::setBattleResult(const CBattleInfoCallback & battle, EBattleResult resultType, BattleSide victoriusSide)
{
	resultProcessor->setBattleResult(battle, resultType, victoriusSide);
	resultProcessor->endBattle(battle);
}

bool BattleProcessor::makeAutomaticBattleAction(const CBattleInfoCallback & battle, const BattleAction &ba)
{
	return actionsProcessor->makeAutomaticBattleAction(battle, ba);
}

void BattleProcessor::endBattleConfirm(const BattleID & battleID)
{
	auto battle = gameHandler->gameState().getBattle(battleID);
	assert(battle);

	if (!battle)
		return;

	resultProcessor->endBattleConfirm(*battle);
}

void BattleProcessor::battleFinalize(const BattleID & battleID, const BattleResult &result)
{
	resultProcessor->battleFinalize(battleID, result);
}
