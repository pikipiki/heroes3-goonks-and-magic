/* Mobile presentation bridge for Heroes Goonk. Engine callbacks remain authoritative. */
#include "StdInc.h"
#include "../lib/era/EraCreaturePrices.h"
#include "../lib/era/EraRogueAmbushState.h"
#include "../lib/era/EraCommanderChoiceModel.h"
#include "../lib/era/EraEye278Native.h"
#include "../lib/era/EraCreatureSpecialists.h"
#include "../lib/era/EraAtmaStateNative.h"
#include "../lib/era/EraInterferenceState.h"
#include "../lib/era/EraCampaignDeployment.h"
#include "../lib/era/EraCampaignSlotCurseRule.h"
#include "../lib/era/EraCampaignAdmission.h"
#include "../lib/mapObjects/MiscObjects.h"
#include "../lib/mapObjects/CGPandoraBox.h"
#include "../lib/era/EraCampaignExperienceWord.h"
#include "../lib/era/EraSourceCreatureLevels.h"
#include "MobileBridge.h"
#include "MobileBattleRaster.h"
#include "../lib/gameState/CGameState.h"
#include "../lib/mapping/CMap.h"
#include "../lib/mapObjects/CGMysteriousCave.h"
#ifdef VCMI_EMSCRIPTEN
#include <emscripten/emscripten.h>
#include <SDL_timer.h>
#include <SDL_surface.h>
#include "render/Canvas.h"
#include "render/IImage.h"
#include "render/CAnimation.h"
#include "../lib/mapObjects/ObjectTemplate.h"
#include "render/IRenderHandler.h"
#include "windows/CSpellWindow.h"
#include "windows/CMarketWindow.h"
#include "lobby/RandomMapTab.h"
#include "lobby/CBonusSelection.h"
#include "mainmenu/CPrologEpilogVideo.h"
#include "../lib/campaign/CampaignState.h"
#include "widgets/TextControls.h"
#include "widgets/CComponent.h"
#include "../lib/rmg/CMapGenOptions.h"
#include "../lib/campaign/CampaignHandler.h"
#include "../lib/entities/artifact/CArtifact.h"
#include "../lib/entities/artifact/CArtifactInstance.h"
#include "../lib/battle/AccessibilityInfo.h"
#include "../lib/battle/IBattleState.h"
#include "../lib/spells/effects/UnitEffect.h"
#include "../include/vcmi/spells/Caster.h"
#include <atomic>
#include "GameEngine.h"
#include "globalLobby/GlobalLobbyClient.h"
#include "globalLobby/GlobalLobbyLoginWindow.h"
#include "globalLobby/GlobalLobbyRoomWindow.h"
#include "globalLobby/GlobalLobbyServerSetup.h"
#include "globalLobby/GlobalLobbyWindow.h"
#include "GameLibrary.h"
#include "media/ISoundPlayer.h"
#include "media/IMusicPlayer.h"
#include "../lib/StartInfo.h"
#include "GameInstance.h"
#include "CPlayerInterface.h"
#include "ArtifactsUIController.h"
#include "CServerHandler.h"
#include "PlayerLocalState.h"
#include "HeroMovementController.h"
#include "mapView/mapHandler.h"
#include "gui/WindowHandler.h"
#include "gui/EventDispatcher.h"
#include "gui/Shortcut.h"
#include "adventureMap/AdventureMapInterface.h"
#include "adventureMap/CMinimap.h"
#include "widgets/MiscWidgets.h"
#include "windows/CCreatureWindow.h"
#include "mainmenu/CMainMenu.h"
#include "lobby/CLobbyScreen.h"
#include "windows/CCastleInterface.h"
#include "windows/GUIClasses.h"
#include "windows/InfoWindows.h"
#include "windows/CSourceCampaignDialog.h"
#include "mainmenu/CHighScoreScreen.h"
#include "widgets/Buttons.h"
#include "windows/CHeroWindow.h"
#include "windows/CExchangeWindow.h"
#include "../lib/entities/artifact/ArtifactUtils.h"
#include "../lib/networkPacks/ArtifactLocation.h"
#include "battle/BattleInterface.h"
#include "battle/BattleActionsController.h"
#include "battle/BattleWindow.h"
#include "battle/BattleResultWindow.h"
#include "battle/BattleStacksController.h"
#include "battle/BattleFieldController.h"
#include "battle/BattleSiegeController.h"
#include "../lib/json/JsonNode.h"
#include "../lib/CConfigHandler.h"
#include "../lib/filesystem/Filesystem.h"
#include "../lib/CCreatureHandler.h"
#include "../lib/CBonusTypeHandler.h"
#include "../lib/mapObjects/army/CCommanderInstance.h"
#include "../lib/era/EraHenchmanModel.h"
#include "../lib/era/EraMithrilModel.h"
#include "../lib/networkPacks/HenchmanPacks.h"
#include "../lib/mapObjects/CRewardableObject.h"
#include "../lib/mapObjectConstructors/AObjectTypeHandler.h"
#include "../lib/IGameSettings.h"
#include "../lib/CSkillHandler.h"
#include "../lib/entities/hero/CHero.h"
#include "../lib/GameLibrary.h"
#include "../lib/entities/ResourceTypeHandler.h"
#include "../lib/CStack.h"
#include "../lib/gameState/UpgradeInfo.h"
#include "ArmyUpgradePath.h"
#include "../lib/gameState/SThievesGuildInfo.h"
#include "../lib/spells/CSpellHandler.h"
#include "../lib/battle/CPlayerBattleCallback.h"
#include "../lib/callback/CCallback.h"
#include "../lib/mapObjects/CGHeroInstance.h"
#include "../lib/mapObjects/CGTownInstance.h"
#include "../lib/mapObjects/IMarket.h"
#include "../lib/entities/faction/CTown.h"
#include "../lib/entities/faction/CFaction.h"
#include "../lib/networkPacks/PacksForLobby.h"
#include "../lib/entities/building/CBuilding.h"
#include "../lib/GameConstants.h"
#include "../lib/texts/CGeneralTextHandler.h"
#include "../lib/mapping/CMapInfo.h"
#include "../lib/mapping/CMapService.h"
#include "../lib/mapping/CMap.h"
#include "../lib/TerrainHandler.h"
#include "../lib/mapping/GoonkScenario.h"
#include "../lib/pathfinder/CGPathNode.h"

extern "C" void vcmiMobileCommand(int,int,int,int,int,int);
namespace {
bool mobileMithrilPanel=false;
// Read-only estimate, identical to the native attack tooltip. Melee envelopes
// cover all legal directions/occupied target hexes before a direction is chosen.
JsonNode mobileAttackLosses(const CPlayerBattleCallback & battle, const CStack * actor,
 const CStack * target, const BattleHexArray & reachable, const ReachabilityInfo::TDistances & distances)
{
 JsonNode result;
 if(!actor || !target || !battle.battleCanAttackUnit(actor, target))return result;
 bool found=false;
 int64_t minimum=0, maximum=0;
 const auto include=[&](const BattleAttackInfo & attack)
 {
  const auto estimate=battle.battleEstimateDamage(attack);
  const auto low=std::clamp<int64_t>(estimate.kills.min,0,target->getCount());
  const auto high=std::clamp<int64_t>(estimate.kills.max,low,target->getCount());
  minimum=found?std::min(minimum,low):low;
  maximum=found?std::max(maximum,high):high;
  found=true;
 };
 if(battle.battleCanShoot(actor,target->getPosition()))
  include(BattleAttackInfo(actor,target,0,true));
 else
 {
  for(const auto hex:target->getHexes())
   for(int direction=BattleHex::TOP_LEFT;direction<=BattleHex::BOTTOM;++direction)
   {
    const auto dir=static_cast<BattleHex::EDir>(direction);
    if(!battle.battleCanAttackHex(reachable,actor,hex,dir))continue;
    const auto from=battle.fromWhichHexAttack(actor,hex,dir);
    if(!from.isValid())continue;
    BattleAttackInfo attack(actor,target,distances[from.toInt()],false);
    attack.attackerPos=from;
    include(attack);
   }
 }
 if(found)
 {
  result["actor"].Integer()=actor->unitId();
  result["min"].Integer()=minimum;
  result["max"].Integer()=maximum;
 }
 return result;
}
JsonNode mobileHeroSpellPower(const CBattleInfoCallback & battle,const CGHeroInstance * caster)
{
 JsonNode value;if(!caster)return value;
 const auto power=era_compat::sourceInterferencePower(battle,caster);
 const int original=caster->getPrimSkillLevel(PrimarySkill::SPELL_POWER);
 value["original"].Integer()=power?power->original:original;
 value["effective"].Integer()=power?power->effective:original;
 value["interference"].Bool()=bool(power);
 return value;
}
std::optional<std::array<int,6>> deferredMapAction;
uint32_t mapReadySince=0;
std::string mobileVisitedName;bool mobileVisitShown=false;
ObjectInstanceID mobileVisitedID = ObjectInstanceID::NONE;
bool mobileEnabled=false,stateEnabled=false,audioMuted=false,mobileVerticalBattle=false;
uint32_t mobileVerticalGeneration=0;
std::vector<int3> exchangeMarkerTiles;
std::optional<int> mobileTownHall;
ui32 previousSoundVolume=75,previousMusicVolume=75;
std::vector<ResourcePath> pendingMobileMaps;size_t mobileMapCursor=0;
struct MobileScenario
{
 std::string file, name;
 int humanSeats;
 bool battleOnly, castleChoice, soloCastleChoice;
 int width, height, players, humanCastleChoices;
};
std::vector<MobileScenario> mobileMaps;
bool mobileWeeklyRecruits = false;
bool mapsListed=false,savesListed=false;std::set<int> portraitIds,artifactIconIds;std::vector<std::pair<std::string,std::string>> mobileCampaigns;
struct MobileSave
{
 std::string file, name, scenario;
};
std::vector<MobileSave> mobileSaves;
std::shared_ptr<CMapInfo> mobileLocalSaveSelection;
// A mobile local load starts with one client name. The native lobby remaps any
// further saved human colours to AI when it runs out of names. Restore only the
// original human roles to this local connection; keep saved AI colours as AI.
// Native hotseat supports several human colour interfaces on one connection.
void restoreMobileLocalSaveRoles(CServerHandler & server,const CMapInfo * save)
{
 if(server.inLobbyRoom() || server.serverMode!=EServerMode::LOCAL || !server.isHost()
    || server.screenType!=ESelectionScreen::loadGame || !save || !save->scenarioOptionsOfSave)
  return;
 const auto local=server.myFirstId();
 if(local==PlayerConnectionID::INVALID || local==PlayerConnectionID::PLAYER_AI)return;
 for(const auto & [color,saved]:save->scenarioOptionsOfSave->playerInfos)
 {
  if(!saved.isControlledByHuman() || saved.compOnly)continue;
  LobbyForceSetPlayer role;
  role.targetConnectedPlayer=local;
  role.targetPlayerColor=color;
  server.sendLobbyPack(role);
  server.setPlayerName(color,saved.name);
 }
}

uint32_t lastPublished=0,lastSent=0;
std::string lastSnapshot,pendingDefaultMap;
std::atomic_bool snapshotPending{false};
bool canToggleMobileAutocombat(BattleInterface & battle, bool tactics, bool canPlace)
{
 if(!battle.curInt || battle.openingPlaying() || battle.actionsController->heroSpellcastingModeActive())
  return false;
 const bool autoOn = battle.curInt->isAutoFightOn;
 const bool networked = GAME->server().inLobbyRoom();
 if(!autoOn && battle.curInt->autofightingAI)
  return false;
 if(tactics)
  return canPlace && (networked || !settings["battle"]["endWithAutocombat"].Bool());
 if(battle.round <= 0)
  return false;

 // During a network battle, wait for a local stack that can accept the first order.
 const bool ready = battle.makingTurn() && !battle.hasAnimations();
 if(networked)
  return autoOn || ready;
 return !settings["battle"]["endWithAutocombat"].Bool() || (!autoOn && ready);
}

JsonNode rect(const Rect & r){JsonNode n;n["x"].Integer()=r.x;n["y"].Integer()=r.y;n["w"].Integer()=r.w;n["h"].Integer()=r.h;return n;}
bool mobileCampaignBusy(const CPlayerInterface & player)
{
 const auto & state=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().sourceCampaignState;
 return state.isStruct()&&state["contract"].String()=="source-campaign-state-v1"&&
  (state["pending"].isStruct()||state["running"].Bool())&&state["player"].Integer()==player.playerID.getNum();
}
bool mobileCampaignBattleHook(const CPlayerInterface & player)
{
 const auto & state=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().sourceCampaignState;
 return state["battleHook"].Bool();
}
std::string mobileArtifactRewardPhase(const CPlayerInterface & player)
{
 const auto info=ENGINE->windows().topWindow<CInfoWindow>();if(!info||info->ID.getNum()<0)return {};
 const auto & journal=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().eraGameplayState["artifactGrants"];
 for(const auto & item:journal["jobs"].Struct())
  if(item.second["owner"].Integer()==player.playerID.getNum()&&
     (item.second["phase"].String()=="assembly"||item.second["phase"].String()=="summary"))return item.second["phase"].String();
 return {};
}
bool mobileRogueCheckpoint(const CPlayerInterface & player)
{
 const auto info=ENGINE->windows().topWindow<CInfoWindow>();
 if(!info||info->ID.getNum()<0)return false;
 const auto & game=static_cast<const IGameInfoCallback &>(*player.cb).gameState();
 return !game.getBattle(player.playerID)&&era_compat::rogues::checkpoint(game.getMap().eraGameplayState["mapRules"],player.playerID.getNum());
}
bool mobileCommanderChoiceCheckpoint(const CPlayerInterface & player)
{
 const auto window=ENGINE->windows().topWindow<CStackWindow>();
 if(!window || !window->isCommanderLevelUp())return false;
 const auto * commander=window->getMobileCommander();
 const auto * hero=commander?dynamic_cast<const CGHeroInstance *>(commander->getArmy()):nullptr;
 if(!hero || hero->getOwner()!=player.playerID || !commander->eraExperienceWord)return false;
 const auto & game=static_cast<const IGameInfoCallback &>(*player.cb).gameState();
 return !game.getBattle(player.playerID)&&era_compat::commander_choices::checkpoint(game.getMap().eraGameplayState["commanderChoices"],hero->getHeroTypeID().getNum(),player.playerID.getNum(),commander->getLevel());
}
bool mobileArtifactRewardCheckpoint(const CPlayerInterface & player)
{
 const auto & game=static_cast<const IGameInfoCallback &>(*player.cb).gameState();
 if(game.getBattle(player.playerID))return false;
 const auto & journal=game.getMap().eraGameplayState["artifactGrants"];
 if(const auto window=ENGINE->windows().topWindow<CLevelWindow>())
 {
  const auto * hero=window->getMobileHero();if(!hero||hero->getOwner()!=player.playerID)return false;
  const auto & choice=journal["levels"][std::to_string(hero->getHeroTypeID().getNum())]["choice"];
  return choice.isStruct()&&choice["level"].Integer()==hero->level;
 }
 return !mobileArtifactRewardPhase(player).empty();
}
bool mobileCampaignPrompt(const CPlayerInterface & player)
{
 const auto info=ENGINE->windows().topWindow<CInfoWindow>();
 const auto & state=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().sourceCampaignState;
 return info&&info->ID.getNum()>=0&&state["pending"]["kind"].String()!="battle"&&mobileCampaignBusy(player);
}
bool mobileCampaignExchange(const CPlayerInterface & player,const CGarrisonWindow * window)
{
 if(!window||!mobileCampaignBusy(player))return false;
 const auto & pending=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().sourceCampaignState["pending"];
 return pending["kind"].String()=="army-exchange"&&pending["army"].isNumber()&&pending["hero"].isNumber()
  &&window->getMobileArmy(0)->id.getNum()==pending["army"].Integer()&&window->getMobileArmy(1)->id.getNum()==pending["hero"].Integer();
}
bool mobileGarrisonExchange(const CPlayerInterface & player,const CGarrisonWindow * window)
{
 if(!window||!window->getMobileArmy(0))return false;
 const auto * hero=dynamic_cast<const CGHeroInstance *>(window->getMobileArmy(1));if(!hero||hero->getOwner()!=player.playerID)return false;
 // Mines and other owned adventure objects also open Leave Guards.
 // Campaign rewards retain their separate admission and ownership rules.
 const auto * upper=window->getMobileArmy(0);
 return dynamic_cast<const CGGarrison *>(upper)||upper->getOwner()==player.playerID;
}
bool mobileJoiningExchange(const CPlayerInterface & player,const CGarrisonWindow * window)
{
 if(!window||!window->getMobileArmy(0))return false;
 const auto * upper=window->getMobileArmy(0);
 const auto * hero=dynamic_cast<const CGHeroInstance *>(window->getMobileArmy(1));
 // Native creature/reward overflow armies are unflaggable. Keep actual
 // garrisons and hero exchanges on their existing ownership paths.
 return hero&&hero->getOwner()==player.playerID&&upper->getOwner()==PlayerColor::UNFLAGGABLE
  &&!dynamic_cast<const CGGarrison *>(upper)&&!dynamic_cast<const CGHeroInstance *>(upper);
}
bool mobileCampaignRewardExchange(const CPlayerInterface & player,const CGarrisonWindow * window)
{
 if(!window)return false;
 const auto * event=dynamic_cast<const CGEvent *>(window->getMobileArmy(0));
 const auto * hero=dynamic_cast<const CGHeroInstance *>(window->getMobileArmy(1));
 if(!event||!hero||hero->getOwner()!=player.playerID)return false;
 const auto & state=static_cast<const IGameInfoCallback &>(*player.cb).gameState().getMap().sourceCampaignState;
 // Native LE creature rewards use the visited event as the overflow army.
 // Keep their native query/ownership rules; expose only source-configured
 // events through the same tactile troop exchange as scripted army gifts.
 return state["contract"].String()=="source-campaign-state-v1"&&state["creatureRewards"][std::to_string(event->id.getNum())].isVector();
}
// Cache an ownerless, rank-zero world view. Attach map bonuses only while
// refreshing it, so cached previews never retain a destroyed game's node.
const JsonNode & mobileCreatureDefinition(const CCreature * creature)
{
 struct Entry {
  int version=-1,worldVersion=-1;const CGameState * game=nullptr;
  std::string language;JsonNode view;std::unique_ptr<CStackInstance> preview;
 };
 static std::map<const CCreature *,Entry> cache;
 auto & entry=cache[creature];
 if(!entry.preview)entry.preview=std::make_unique<CStackInstance>(nullptr,creature->getId(),1,true);
 const auto player=GAME?GAME->interface():nullptr;
 auto * callback=player?player->cb.get():nullptr;
 const auto * game=callback?&static_cast<IGameInfoCallback *>(callback)->gameState():nullptr;
 const auto worldVersion=game?game->globalEffects.getTreeVersion():-1;
 const auto language=LIBRARY->generaltexth->getPreferredLanguage();
 const auto version=creature->getTreeVersion();
 if(entry.version==version&&entry.worldVersion==worldVersion&&entry.game==game&&entry.language==language)return entry.view;
 struct Scope {
  CStackInstance & preview;const CBonusSystemNode * world;
  Scope(CStackInstance & value,IGameInfoCallback * cb,const CGameState * game):preview(value),world(game?&game->globalEffects:nullptr)
  {preview.cb=cb;if(world)preview.attachToSource(*world);}
  ~Scope(){if(world)preview.detachFromSource(*world);preview.cb=nullptr;}
 } scope(*entry.preview,callback,game);
 const auto & view=*entry.preview;JsonNode n;
 n["shooter"].Bool()=view.hasBonusOfType(BonusType::SHOOTER);
 n["name"].String()=creature->getNameSingularTranslated();n["id"].Integer()=creature->getId().getNum();
 n["icon"].String()=creature->largeIconName;n["key"].String()=creature->getJsonKey();n["description"].String()=creature->getDescriptionTranslated();
 for(const auto & ability:CStackWindow::getMobileCreatureAbilities(&view))n["abilities"].Vector().emplace_back(ability);
 n["attack"].Integer()=view.getAttack(false);n["defense"].Integer()=view.getDefense(false);
 n["health"].Integer()=view.getMaxHealth();n["speed"].Integer()=view.getMovementRange();
 n["damageMin"].Integer()=view.getMinDamage(false);n["damageMax"].Integer()=view.getMaxDamage(false);
 n["growth"].Integer()=creature->getGrowth();n["aiValue"].Integer()=creature->getAIValue();n["fightValue"].Integer()=creature->getFightValue();
 n["shots"].Integer()=view.valOfBonuses(BonusType::SHOTS);
 const auto flag=[&](const char * name,BonusType type){n["nativeFlags"][name].Bool()=view.hasBonusOfType(type);};
 flag("living",BonusType::LIVING);flag("undead",BonusType::UNDEAD);flag("nonLiving",BonusType::NON_LIVING);
 flag("mindImmune",BonusType::MIND_IMMUNITY);flag("noMorale",BonusType::NO_MORALE);flag("flying",BonusType::FLYING);
 flag("blocksRetaliation",BonusType::BLOCKS_RETALIATION);flag("attacksAllAdjacent",BonusType::ATTACKS_ALL_ADJACENT);flag("chargeImmune",BonusType::CHARGE_IMMUNITY);
 entry.view=std::move(n);entry.version=version;entry.worldVersion=worldVersion;entry.game=game;entry.language=language;return entry.view;
}
JsonNode creature(const CCreature * c,int count)
{
 const auto player=GAME?GAME->interface():nullptr;
 const auto prices=era_compat::creature_prices::get(player?player->cb.get():nullptr,*c);
 portraitIds.insert(c->getId().getNum());auto n=mobileCreatureDefinition(c);n["count"].Integer()=count;
 for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())n["cost"].Vector().push_back(JsonNode(double(prices[resource])));
 return n;
}

void mobileSpellEffects(JsonNode & result,const CStack & stack)
{
 result["spellEffects"].Vector();
 for(const auto id:stack.activeSpells())
 {
  const auto bonuses=stack.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(id)));
  const auto visible=std::find_if(bonuses->begin(),bonuses->end(),[](const auto & b){return !b->hidden && b->type!=BonusType::NONE;});
  if(visible==bonuses->end())continue;
  const auto * spell=id.toSpell();JsonNode effect;
  effect["id"].Integer()=id.getNum();effect["key"].String()=spell->getJsonKey();
  effect["name"].String()=spell->getNameTranslated();effect["turns"].Integer()=(*visible)->turnsRemain;
  result["spellEffects"].Vector().push_back(std::move(effect));
 }
}
bool mobileArtifactCombinationPending=false;
std::pair<bool,bool> mobileArtifactCombination(const CGHeroInstance & hero,ArtifactPosition position)
{
 const auto * art=hero.getArt(position,false);
 if(!art||hero.getSourceSlotLocks().count(position)||era_compat::eye278LockOwner(hero,position))return {false,false};
 if(const auto worn=hero.artifactsWorn.find(position);worn!=hero.artifactsWorn.end()&&worn->second.locked)return {false,false};
 const auto choices=ArtifactUtils::assemblyPossibilities(&hero,art->getTypeId());
 const bool assemble=std::any_of(choices.begin(),choices.end(),[&](const CArtifact * type)
 {return !era_compat::eye278Type(type)||era_compat::planEye278Assembly(hero,type,position).has_value();});
 const auto parts=art->getType()->getConstituents().size();
 const bool disassemble=art->hasParts()&&era_compat::eye278GuiUncombineAllowed(art->getType())
  &&(!ArtifactUtils::isSlotBackpack(position)||(parts>0&&ArtifactUtils::isBackpackFreeSlots(&hero,parts-1)));
 return {assemble,disassemble};
}
JsonNode recruitmentIdentity(CreatureID id)
{
 const auto creature = id.toCreature();
 JsonNode item;
 item["id"].Integer() = id.getNum();
 item["key"].String() = creature->getJsonKey();
 item["name"].String() = creature->getNameSingularTranslated();
 return item;
}

JsonNode weeklyRecruits(const CGTownInstance & town)
{
 JsonNode result;
 auto & rows = result.Vector();
 const auto & roster = town.getTown()->creatures;
 for(size_t level = 0; level < town.creatures.size(); ++level)
 {
  const auto & [stock, available] = town.creatures[level];
  const bool dwelling = level < roster.size();
  if(!dwelling && available.empty())
   continue;
  JsonNode row;
  row["count"].Integer() = available.empty() ? 0 : stock;
  if(dwelling && !available.empty())
   row["growth"].Integer() = town.creatureGrowth(level);
  if(!dwelling)
   row["summoned"].Bool() = true;
  const auto & forms = dwelling ? roster[level] : available;
  if(!forms.empty())
   portraitIds.insert(forms.front().getNum());
  for(const auto id : forms)
  {
   auto item = recruitmentIdentity(id);
   item["built"].Bool() = std::find(available.begin(), available.end(), id) != available.end();
   row["forms"].Vector().push_back(std::move(item));
  }
  rows.push_back(std::move(row));
 }
 return result;
}
void mobilePreviews(CIntObject * node,JsonNode & result){
 if(auto picture=dynamic_cast<CCreaturePic*>(node)){if(auto c=picture->getMobileCreature()){auto item=creature(c,1);item["preview"]=rect(picture->pos);item["previewAtlas"].Bool()=true;item["previewKey"].Integer()=reinterpret_cast<uintptr_t>(picture);result.Vector().push_back(item);}return;}
 for(auto child:node->children)mobilePreviews(child,result);
}
// Presentation data only: selection and confirmation still use native callbacks.
void mobileDialogContent(CIntObject * node, JsonNode & result, CStackWindow * commander, unsigned & skillIndex)
{
 if(auto component=dynamic_cast<CComponent *>(node))
 {
  JsonNode item;
  item["label"].String()=component->getSubtitle();
  item["description"].String()=component->getDescription();
  if(component->data.type==ComponentType::RESOURCE)
  {
   const auto name=LIBRARY->resourceTypeHandler->getById(component->data.subType.as<GameResID>())->getNameTranslated();
   item["label"].String()+=" "+name;
   item["description"].String().clear();
  }
  if(component->data.type==ComponentType::EXPERIENCE)item["label"].String()+=" experience";
  item["rect"]=rect(component->image ? component->image->pos : component->pos);
  if(auto choice=dynamic_cast<CSelectableComponent *>(component))
  {
   item["selectable"].Bool()=true;
   item["selected"].Bool()=choice->selected;
  }
  result["choices"].Vector().push_back(std::move(item));
  return;
 }
 if(auto icon=dynamic_cast<CCommanderSkillIcon *>(node);icon && commander)
 {
  const auto available=commander->getMobileSkillChoices();
  ++skillIndex;
  const int index=icon->mobileSkillID;
  if(index<0)return;
  const bool levelUp=commander->isCommanderLevelUp();
  const bool allowed=index<6 ? !levelUp || std::find(available.begin(),available.end(),index)!=available.end() : icon->getIsMasterAbility();
  if(!allowed)return;
  static const std::array names={"Attack","Defense","Health","Damage","Speed","Magic"};
  JsonNode item;
  item["skillId"].Integer()=index;
  item["label"].String()=index<6?names[index]:"Special ability";
  item["description"].String()=icon->text;
  item["rect"]=rect(icon->pos);
  item["selectable"].Bool()=levelUp;
  item["inspectable"].Bool()=!levelUp;
  item["selected"].Bool()=commander->isMobileSelectedSkill(icon);
  result["choices"].Vector().push_back(std::move(item));
  return;
 }
 if(auto label=dynamic_cast<CLabel *>(node))
 {
  if(!label->getText().empty())result["lines"].Vector().emplace_back(label->getText());
  return;
 }
 for(auto child:node->children)mobileDialogContent(child,result,commander,skillIndex);
}
void publishPortraits()
{
 static std::set<int> previous;
 if(portraitIds.empty()||std::includes(previous.begin(),previous.end(),portraitIds.begin(),portraitIds.end()))return;
 if(previous.size()+portraitIds.size()>96)previous=portraitIds;
 else{previous.insert(portraitIds.begin(),portraitIds.end());if(previous.size()>96)previous=portraitIds;}
 std::vector<int> ids;for(int id:previous)if(ids.size()<96)ids.push_back(id);
 const int width=768,height=((ids.size()+7)/8)*96;const size_t prefix=ids.size()*4,bytes=width*height*4;
 auto surface=SDL_CreateRGBSurfaceWithFormat(0,width,height,32,SDL_PIXELFORMAT_ARGB8888);if(!surface)return;SDL_FillRect(surface,nullptr,0);
 {auto canvas=Canvas::createFromSurface(surface,CanvasScalingPolicy::IGNORE);for(size_t i=0;i<ids.size();i++)try{auto c=CreatureID(ids[i]).toCreature();auto image=ENGINE->renderHandler().loadImage(AnimationPath::builtin("TWCRPORT"),c->getIconIndex(),0,EImageBlitMode::SIMPLE);if(image){const auto dims=image->dimensions();auto icon=SDL_CreateRGBSurfaceWithFormat(0,dims.x,dims.y,32,SDL_PIXELFORMAT_ARGB8888);if(icon){SDL_FillRect(icon,nullptr,0);{auto iconCanvas=Canvas::createFromSurface(icon,CanvasScalingPolicy::IGNORE);iconCanvas.draw(image,Point(0,0));}const double scale=std::min(92.0/dims.x,92.0/dims.y);SDL_Rect target{int(i%8)*96+(96-int(dims.x*scale))/2,int(i/8)*96+(96-int(dims.y*scale))/2,int(dims.x*scale),int(dims.y*scale)};SDL_SetSurfaceBlendMode(icon,SDL_BLENDMODE_NONE);SDL_BlitScaled(icon,nullptr,surface,&target);SDL_FreeSurface(icon);}}}catch(const std::exception &){} }
 auto rgba=SDL_ConvertSurfaceFormat(surface,SDL_PIXELFORMAT_RGBA32,0);SDL_FreeSurface(surface);if(!rgba)return;
 auto packet=static_cast<uint8_t*>(malloc(prefix+bytes));if(packet){for(size_t i=0;i<ids.size();i++){int32_t id=ids[i];memcpy(packet+i*4,&id,4);}memcpy(packet+prefix,rgba->pixels,bytes);
 MAIN_THREAD_ASYNC_EM_ASM({try{const ptr=$0;const n=$3;window.goonkPortraitIds=new Map(Array.from(HEAP32.subarray(ptr/4,ptr/4+n),(id,i)=>[id,i]));const c=window.goonkPortraitAtlas||(window.goonkPortraitAtlas=document.createElement('canvas'));c.width=$1;c.height=$2;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice(ptr+n*4,ptr+n*4+$1*$2*4)), $1,$2),0,0);window.dispatchEvent(new Event('goonk-portraits'));}finally{_free($0);}},packet,width,height,ids.size());}
 SDL_FreeSurface(rgba);
}
void publishArtifactIcons()
{
 static std::set<int> previous;
 if(artifactIconIds.empty()||std::includes(previous.begin(),previous.end(),artifactIconIds.begin(),artifactIconIds.end()))return;
 if(previous.size()+artifactIconIds.size()>96)previous=artifactIconIds;
 else{previous.insert(artifactIconIds.begin(),artifactIconIds.end());if(previous.size()>96)previous=artifactIconIds;}
 std::vector<int> ids;for(int id:previous)if(ids.size()<96)ids.push_back(id);
 const int width=768,height=((ids.size()+7)/8)*96;const size_t prefix=ids.size()*4,bytes=width*height*4;
 auto surface=SDL_CreateRGBSurfaceWithFormat(0,width,height,32,SDL_PIXELFORMAT_ARGB8888);if(!surface)return;SDL_FillRect(surface,nullptr,0);
 {auto canvas=Canvas::createFromSurface(surface,CanvasScalingPolicy::IGNORE);for(size_t i=0;i<ids.size();i++)try{auto image=ENGINE->renderHandler().loadImage(AnimationPath::builtin("ARTIFACT"),ids[i],0,EImageBlitMode::SIMPLE);if(image){const auto dims=image->dimensions();auto icon=SDL_CreateRGBSurfaceWithFormat(0,dims.x,dims.y,32,SDL_PIXELFORMAT_ARGB8888);if(icon){SDL_FillRect(icon,nullptr,0);{auto iconCanvas=Canvas::createFromSurface(icon,CanvasScalingPolicy::IGNORE);iconCanvas.draw(image,Point(0,0));}const double scale=std::min(92.0/dims.x,92.0/dims.y);SDL_Rect target{int(i%8)*96+(96-int(dims.x*scale))/2,int(i/8)*96+(96-int(dims.y*scale))/2,int(dims.x*scale),int(dims.y*scale)};SDL_SetSurfaceBlendMode(icon,SDL_BLENDMODE_NONE);SDL_BlitScaled(icon,nullptr,surface,&target);SDL_FreeSurface(icon);}}}catch(const std::exception &){} }
 auto rgba=SDL_ConvertSurfaceFormat(surface,SDL_PIXELFORMAT_RGBA32,0);SDL_FreeSurface(surface);if(!rgba)return;
 auto packet=static_cast<uint8_t*>(malloc(prefix+bytes));if(packet){for(size_t i=0;i<ids.size();i++){int32_t id=ids[i];memcpy(packet+i*4,&id,4);}memcpy(packet+prefix,rgba->pixels,bytes);
 MAIN_THREAD_ASYNC_EM_ASM({try{const ptr=$0;const n=$3;window.goonkArtifactIds=new Map(Array.from(HEAP32.subarray(ptr/4,ptr/4+n),(id,i)=>[id,i]));const c=window.goonkArtifactAtlas||(window.goonkArtifactAtlas=document.createElement('canvas'));c.width=$1;c.height=$2;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice(ptr+n*4,ptr+n*4+$1*$2*4)), $1,$2),0,0);window.dispatchEvent(new Event('goonk-artifacts'));}finally{_free($0);}},packet,width,height,ids.size());}
 SDL_FreeSurface(rgba);
}
// Keep the mobile sheet on the same animation frames as CHeroWindow.
using HeroIconFrames = std::vector<std::pair<std::string, int>>;

void addHeroIcon(HeroIconFrames & frames, JsonNode & index, const char * resource, int frame = -1)
{
 index.Integer() = frames.size();
 frames.emplace_back(resource, frame);
}

void publishHeroIcons(const HeroIconFrames & frames)
{
 static HeroIconFrames previous;
 if(frames.empty() || frames == previous)
  return;

 constexpr int cell = 48, columns = 8, width = cell * columns;
 const int height = ((frames.size() + columns - 1) / columns) * cell;
 auto surface = SDL_CreateRGBSurfaceWithFormat(0, width, height, 32, SDL_PIXELFORMAT_RGBA32);
 if(!surface)
  return;
 SDL_FillRect(surface, nullptr, 0);
 {
  auto canvas = Canvas::createFromSurface(surface, CanvasScalingPolicy::IGNORE);
  for(size_t i = 0; i < frames.size(); ++i)
  {
   const auto & [resource, frame] = frames[i];
   auto & renderer = ENGINE->renderHandler();
   auto image = frame < 0 ? renderer.loadImage(ImagePath::builtin(resource), EImageBlitMode::COLORKEY)
                          : renderer.loadImage(AnimationPath::builtin(resource), frame, 0, EImageBlitMode::COLORKEY);
   if(!image)
    continue;
   auto size = image->dimensions();
   const int longest = std::max(size.x, size.y);
   if(longest > cell)
   {
    size = Point(std::max(1, size.x * cell / longest), std::max(1, size.y * cell / longest));
    image->scaleTo(size, EScalingAlgorithm::BILINEAR);
   }
   canvas.draw(image, Point(int(i % columns) * cell + (cell - size.x) / 2, int(i / columns) * cell + (cell - size.y) / 2));
  }
 }

 const size_t bytes = width * height * 4;
 auto pixels = malloc(bytes);
 if(pixels)
 {
  memcpy(pixels, surface->pixels, bytes);
  MAIN_THREAD_ASYNC_EM_ASM({
   try {
    const canvas = document.createElement('canvas');
    canvas.width = $1;
    canvas.height = $2;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice($0, $0 + $1 * $2 * 4)), $1, $2), 0, 0);
    window.goonkHeroIconAtlas = canvas;
   } finally {
    _free($0);
   }
  }, pixels, width, height);
  previous = frames;
 }
 SDL_FreeSurface(surface);
}

void mobileStackExperience(JsonNode & node,const CStackInstance * stack)
{
 if(!stack)return;
 node["experience"].Integer()=static_cast<si64>(stack->getTotalExperience());
 node["experiencePerUnit"].Integer()=static_cast<si64>(stack->getAverageExperience());
 node["experienceRank"].Integer()=stack->getExpRank();
}
JsonNode troopEquipmentSnapshot(const CGHeroInstance & hero, bool canAct)
{
 JsonNode result;result["heroId"].Integer()=hero.id.getNum();result["heroName"].String()=hero.getNameTranslated();result["canAct"].Bool()=canAct;
 auto describe=[](const CArtifactInstance * art){JsonNode item;const auto type=art->getType();item["id"].Integer()=art->getId().getNum();item["typeId"].Integer()=type->getId().getNum();item["name"].String()=type->getNameTranslated();item["description"].String()=type->getDescriptionTranslated();item["icon"].Integer()=type->getIconIndex();artifactIconIds.insert(type->getIconIndex());return item;};
 const auto backpackSlot=ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(hero.artifactsInBackpack.size()));
 for(int slot=0;slot<7;++slot)if(hero.hasStackAtSlot(SlotID(slot)))
 {
  const auto & stack=hero.getStack(SlotID(slot));const auto equipped=stack.getArt(ArtifactPosition::CREATURE_SLOT);
  auto entry=creature(stack.getCreature(),stack.getCount());entry["nativeFlags"]["flying"].Bool()=stack.hasBonusOfType(BonusType::FLYING);entry["slot"].Integer()=slot;
  entry["attack"].Integer()=stack.getAttack(stack.hasBonusOfType(BonusType::SHOOTER));entry["defense"].Integer()=stack.getDefense(false);entry["health"].Integer()=stack.getMaxHealth();entry["speed"].Integer()=stack.getMovementRange();entry["damageMin"].Integer()=stack.getMinDamage(stack.hasBonusOfType(BonusType::SHOOTER));entry["damageMax"].Integer()=stack.getMaxDamage(stack.hasBonusOfType(BonusType::SHOOTER));entry["magicDamageReduction"].Integer()=stack.valOfBonuses(BonusType::SPELL_DAMAGE_REDUCTION,BonusSubtypeID(SpellSchool::ANY));entry["physicalDamageBonus"].Integer()=stack.valOfBonuses(BonusType::GENERAL_DAMAGE_PREMY);entry["rangedDamageBonus"].Integer()=stack.valOfBonuses(BonusType::PERCENTAGE_DAMAGE_BOOST,BonusCustomSubtype::damageTypeRanged);
  if(equipped){entry["equipped"]=describe(equipped);entry["canRemove"].Bool()=canAct&&equipped->canBePutAt(&hero,backpackSlot);}
  for(size_t i=0;i<hero.artifactsInBackpack.size();++i)
  {
   const auto art=hero.getArt(ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(i)));if(!art)continue;
   const auto & slots=art->getType()->getPossibleSlots();
   if(!slots.count(ArtBearer::CREATURE)||slots.at(ArtBearer::CREATURE).empty())continue;
   auto item=describe(art);item["backpackSlot"].Integer()=int(ArtifactPosition::BACKPACK_START)+i;
   item["allowed"].Bool()=canAct&&art->canBePutAt(&stack,ArtifactPosition::CREATURE_SLOT,true)&&(!equipped||equipped->canBePutAt(&hero,ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(i)),true));
   entry["inventory"].Vector().push_back(std::move(item));
  }
  result["troops"].Vector().push_back(std::move(entry));
 }
 return result;
}
struct MobileArmyUpgradeStep {SlotID slot;CreatureID source,target;int count;ResourceSet cost;};
struct MobileArmyUpgradePlan {std::weak_ptr<CCallback> owner;ObjectInstanceID army;std::vector<MobileArmyUpgradeStep> steps;ResourceSet cost;JsonNode view;int hash=0;};
std::optional<MobileArmyUpgradePlan> mobileArmyUpgradeRun;
size_t mobileArmyUpgradeNext=0;bool mobileArmyUpgradeWaiting=false;uint32_t mobileArmyUpgradeSent=0;
JsonNode mobileArmyUpgradeQuote,mobileArmyUpgradeOperation;
MobileArmyUpgradePlan mobilePlanArmyUpgrades(CPlayerInterface * player,const CArmedInstance * object)
{
 MobileArmyUpgradePlan plan;plan.owner=player->cb;plan.army=object->id;plan.view["armyId"].Integer()=object->id.getNum();plan.view["units"].Vector();
 for(int slot=0;slot<7;++slot)if(object->hasStackAtSlot(SlotID(slot)))
 {
  const auto & actual=object->getStack(SlotID(slot));
  CStackInstance proposed(player->cb.get(),BonusNodeType::STACK_INSTANCE,true);proposed.setArmy(const_cast<CArmedInstance *>(object));proposed.setCount(actual.getCount());
  const auto path=mobile_army_upgrade::maximumPath(actual.getCreature()->getId().getNum(),[&](int id){
   UpgradeInfo info{CreatureID(id)};
   if(id==actual.getCreature()->getId().getNum())player->cb->fillUpgradeInfo(object,SlotID(slot),info);
   else{proposed.setType(CreatureID(id));player->cb->fillUpgradeInfo(object,proposed,info);}
   std::vector<mobile_army_upgrade::Edge> result;
   for(const auto target:info.getAvailableUpgrades()){std::vector<int64_t> cost;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())cost.push_back(info.getUpgradeTotalCostsFor(target, actual.getCount())[resource]);result.push_back({target.getNum(),cost});}
   return result;
  },[](int id){return int64_t(CreatureID(id).toCreature()->getFightValue());});
  if(path.empty())continue;
  auto unit=creature(CreatureID(path.back().upgrade.target).toCreature(),actual.getCount());unit["slot"].Integer()=slot;unit["fromName"].String()=actual.getCreature()->getNameSingularTranslated();unit["fromId"].Integer()=actual.getCreature()->getId().getNum();
  for(const auto & step:path){ResourceSet cost;size_t at=0;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects()){
   const int64_t value=step.upgrade.cost[at++];
   if(value<0||value>std::numeric_limits<TResource>::max()-int64_t(plan.cost[resource])){plan.steps.clear();plan.view["units"].Vector().clear();plan.view["error"].String()="costTooLarge";return plan;}
   cost[resource]=value;
  }plan.cost+=cost;plan.steps.push_back({SlotID(slot),CreatureID(step.source),CreatureID(step.upgrade.target),actual.getCount(),cost});}
  plan.view["units"].Vector().push_back(std::move(unit));
 }
 // Explain an empty quote without changing the native upgrade eligibility.
 if(plan.view["units"].Vector().empty())
 {
  const auto hero=dynamic_cast<const CGHeroInstance *>(object);
  const auto town=hero?hero->getVisitedTown():dynamic_cast<const CGTownInstance *>(object);
  bool hasEvolution=false,matchingFaction=false;
  for(const auto & entry:object->Slots())
   if(!entry.second->getCreature()->upgrades.empty())
   {
    hasEvolution=true;
    if(town&&entry.second->getCreature()->getFactionID()==town->getFactionID())matchingFaction=true;
   }
  plan.view["unavailableReason"].String()=!hasEvolution?"noEvolution":!town?"noTown":!matchingFaction?"wrongTown":"requiredBuilding";
 }
 for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())plan.view["cost"].Vector().push_back(JsonNode(int64_t(plan.cost[resource])));
 JsonNode signature=plan.view;
 for(const auto & step:plan.steps){JsonNode item;for(const int value:{step.slot.getNum(),step.source.getNum(),step.target.getNum(),step.count})item.Vector().push_back(JsonNode(value));for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())item.Vector().push_back(JsonNode(int64_t(step.cost[resource])));signature["steps"].Vector().push_back(item);}
 uint32_t hash=2166136261u;for(const unsigned char c:signature.toCompactString())hash=(hash^c)*16777619u;plan.hash=int(hash&0x7fffffffu);plan.view["hash"].Integer()=plan.hash;return plan;
}
void mobileAdvanceArmyUpgrades(CPlayerInterface * player)
{
 if(!mobileArmyUpgradeRun)return;
 const auto & plan=*mobileArmyUpgradeRun;
 const auto object=dynamic_cast<const CArmedInstance *>(player->cb->getObj(plan.army));
 const auto finish=[&](const std::string & status){mobileArmyUpgradeOperation["status"].String()=status;mobileArmyUpgradeRun.reset();mobileArmyUpgradeWaiting=false;};
 if(plan.owner.lock()!=player->cb||!object||object->getOwner()!=player->playerID||!player->makingTurn||CPlayerInterface::battleInt){finish("failed");return;}
 if(mobileArmyUpgradeNext>=plan.steps.size()){finish("done");return;}
 const auto & step=plan.steps[mobileArmyUpgradeNext];
 if(!object->hasStackAtSlot(step.slot)||object->getStackCount(step.slot)!=step.count){finish("failed");return;}
 const auto current=object->getCreature(step.slot)->getId();
 if(mobileArmyUpgradeWaiting){
  if(current==step.target){++mobileArmyUpgradeNext;mobileArmyUpgradeOperation["completedSteps"].Integer()=mobileArmyUpgradeNext;mobileArmyUpgradeWaiting=false;if(mobileArmyUpgradeNext==plan.steps.size())finish("done");return;}
  if(current!=step.source||SDL_GetTicks()-mobileArmyUpgradeSent>10000)finish("failed");return;
 }
 if(current!=step.source){finish("failed");return;}
 UpgradeInfo available(current);player->cb->fillUpgradeInfo(object,step.slot,available);
 ResourceSet remaining;for(size_t i=mobileArmyUpgradeNext;i<plan.steps.size();++i)remaining+=plan.steps[i].cost;
 const auto & ids=available.getAvailableUpgrades();
 if(std::find(ids.begin(),ids.end(),step.target)==ids.end()||available.getUpgradeTotalCostsFor(step.target,step.count)!=step.cost||!player->cb->getResourceAmount().canAfford(remaining)){finish("failed");return;}
 player->cb->upgradeCreature(object,step.slot,step.target);mobileArmyUpgradeWaiting=true;mobileArmyUpgradeSent=SDL_GetTicks();
}
JsonNode army(const CArmedInstance * a,const std::string & name){JsonNode n;n["id"].Integer()=a->id.getNum();n["name"].String()=name;n["needsLastStack"].Bool()=a->needsLastStack();for(int i=0;i<7;i++){auto c=a->getCreature(SlotID(i));auto item=c?creature(c,a->getStackCount(SlotID(i))):JsonNode();if(c){item["canDismiss"].Bool()=(!a->needsLastStack()||a->stacksCount()>1)&&era_bridge::sourceCreatureIdForLevel(c->getJsonKey()).value_or(-1)!=340;mobileStackExperience(item,&a->getStack(SlotID(i)));item["shooter"].Bool()=a->getStack(SlotID(i)).hasBonusOfType(BonusType::SHOOTER);item["shots"].Integer()=a->getStack(SlotID(i)).valOfBonuses(BonusType::SHOTS);item["nativeFlags"]["flying"].Bool()=a->getStack(SlotID(i)).hasBonusOfType(BonusType::FLYING);}n["slots"].Vector().push_back(item);}return n;}
// Resolve army exchange from the persisted town/hero relationship, not from
// whether the castle window has been opened since loading the saved game.
const CGTownInstance * mobileResidentTown(const CGHeroInstance * hero){
 if(!hero)return nullptr;const auto town=hero->getVisitedTown();
 return town&&(town->getVisitingHero()==hero||town->getGarrisonHero()==hero)?town:nullptr;
}
// A map shortcut either opens the existing town exchange or orders a real
// hero visit. On the map only the server's visit query authorizes transfers.
std::vector<const CGHeroInstance *> mobileExchangePartners(CPlayerInterface & player, const CGHeroInstance * hero)
{
 std::vector<const CGHeroInstance *> partners;
 if(!hero || hero->getOwner()!=player.playerID || !player.makingTurn || player.mobileHeroMoving())
  return partners;
 if(const auto town=mobileResidentTown(hero))
 {
  const auto other=town->getVisitingHero()==hero ? town->getGarrisonHero() : town->getVisitingHero();
  if(other && other->getOwner()==player.playerID)
   partners.push_back(other);
 }
 const auto origin=hero->visitablePos();
 std::shared_ptr<const CPathsInfo> paths;
 for(const auto & offset:int3::getDirs())
 {
  const auto destination=origin+offset;
  const auto objects=player.cb->getVisitableObjs(destination,false);
  const auto other=objects.empty()?nullptr:dynamic_cast<const CGHeroInstance *>(objects.back());
  if(!other || other==hero || other->isGarrisoned() ||
     player.cb->getPlayerRelations(hero->getOwner(),other->getOwner())==PlayerRelations::ENEMIES)
   continue;
  if(!paths)
   paths=player.getPathsInfo(hero);
  const auto node=paths->getPathInfo(destination);
  if(node && node->turns==0 && (node->action==EPathNodeAction::BLOCKING_VISIT || node->action==EPathNodeAction::VISIT))
   partners.push_back(other);
 }
 return partners;
}

bool mobileExchangeSlot(const CGHeroInstance & hero, ArtifactPosition slot)
{
 return slot.getNum()>=0 && slot!=ArtifactPosition::MACH4 && slot!=ArtifactPosition::SPELLBOOK &&
  (slot.getNum()<19 || (ArtifactUtils::isSlotBackpack(slot) &&
   slot.getNum()<=int(ArtifactPosition::BACKPACK_START)+int(hero.artifactsInBackpack.size())));
}

bool canMobileTransfer(PlayerColor player, const CGHeroInstance & from, ArtifactPosition source,
                       const CGHeroInstance & to, ArtifactPosition destination)
{
 if(from.getOwner()!=player || !mobileExchangeSlot(from,source) || !mobileExchangeSlot(to,destination))
  return false;
 const auto art=from.getArt(source);
 const auto targetSlot=to.getSlot(destination);
 if(!art || (targetSlot && targetSlot->locked && !era_compat::canMoveIntoEye278(to,destination,*art)))
  return false;
 if(ArtifactUtils::isSlotBackpack(destination))
  return destination.getNum()==int(ArtifactPosition::BACKPACK_START)+int(to.artifactsInBackpack.size()) &&
   !art->getType()->isBig() && ArtifactUtils::isBackpackFreeSlots(&to);
 const auto target=to.getArt(destination);
 return art->canBePutAt(&to,destination,true) &&
  (!target || (to.getOwner()==player && target->canBePutAt(&from,source,true)));
}

JsonNode mobileExchange(const CExchangeWindow & window, const CPlayerInterface & player)
{
 JsonNode result;
 result["classicOnly"].Bool()=window.getPickedArtifact()!=nullptr;
 for(size_t i=0;i<2;i++)
 {
  const auto & hero=*window.getExchangeHero(i);
  const auto & other=*window.getExchangeHero(1-i);
  JsonNode entry;
  entry["id"].Integer()=hero.id.getNum();
  entry["name"].String()=hero.getNameTranslated();
  entry["portrait"]=rect(window.getExchangePortrait(i));
  entry["owned"].Bool()=hero.getOwner()==player.playerID;
  entry["army"]=army(&hero,hero.getNameTranslated());
  const auto appendSlot=[&](ArtifactPosition slot)
  {
   JsonNode item;
   item["slot"].Integer()=slot.getNum();
   item["backpack"].Bool()=ArtifactUtils::isSlotBackpack(slot);
   if(const auto art=era_compat::eye278LockOwner(hero,slot)?nullptr:hero.getArt(slot,false))
   {
    const auto type=art->getType();
    item["id"].Integer()=art->getId().getNum();
    item["name"].String()=type->getNameTranslated();
    item["description"].String()=type->getDescriptionTranslated();
    item["icon"].Integer()=type->getIconIndex();
    artifactIconIds.insert(type->getIconIndex());
    if(player.makingTurn && !result["classicOnly"].Bool())
    {
     const auto addDestination=[&](ArtifactPosition target)
     {
      if(canMobileTransfer(player.playerID,hero,slot,other,target))
       item["destinations"].Vector().emplace_back(double(target.getNum()));
     };
     for(int index=0;index<19;index++)
      addDestination(ArtifactPosition(index));
     addDestination(ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(other.artifactsInBackpack.size())));
    }
   }
   entry["slots"].Vector().push_back(std::move(item));
  };
  for(int index=0;index<19;index++)
   appendSlot(ArtifactPosition(index));
  for(size_t index=0;index<=hero.artifactsInBackpack.size();index++)
   appendSlot(ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(index)));
  result["heroes"].Vector().push_back(std::move(entry));
 }
 return result;
}

bool visitingHeroHasGrail(const CGTownInstance * town)
{
 const auto visitor=town->getVisitingHero();
 return visitor&&visitor->hasArt(ArtifactID::GRAIL);
}
void mobileTownArmies(JsonNode & n,const CGTownInstance * town){
 n["armyTownId"].Integer()=town->id.getNum();n["armies"].Vector().clear();
 const auto upper=town->getUpperArmy();const auto defender=town->getGarrisonHero();
 n["armies"].Vector().push_back(army(upper,defender?defender->getNameTranslated():"Garnison"));
 if(const auto visitor=town->getVisitingHero())if(visitor!=upper)n["armies"].Vector().push_back(army(visitor,visitor->getNameTranslated()));
}
void shortcut(EShortcut key){ENGINE->events().dispatchShortcutPressed({key});ENGINE->events().dispatchShortcutReleased({key});}
}
void publishMobileVisitedObject(const CGObjectInstance * object){
 mobileVisitedName.clear();mobileVisitShown=false;
 mobileVisitedID=object?object->id:ObjectInstanceID::NONE;
 if(!mobileEnabled||!object||!object->appearance||object->appearance->animationFile.empty())return;
 const auto animation=ENGINE->renderHandler().loadAnimation(object->appearance->animationFile,EImageBlitMode::SIMPLE);
 const auto image=animation?animation->getImage(0):nullptr;if(!image)return;
 auto surface=SDL_CreateRGBSurfaceWithFormat(0,image->width(),image->height(),32,SDL_PIXELFORMAT_ARGB8888);if(!surface)return;SDL_FillRect(surface,nullptr,0);
 {auto canvas=Canvas::createFromSurface(surface,CanvasScalingPolicy::IGNORE);canvas.draw(image,Point(0,0));}
 auto rgba=SDL_ConvertSurfaceFormat(surface,SDL_PIXELFORMAT_RGBA32,0);SDL_FreeSurface(surface);if(!rgba)return;
 const int w=rgba->w,h=rgba->h;auto bytes=malloc(w*h*4);if(bytes){memcpy(bytes,rgba->pixels,w*h*4);MAIN_THREAD_ASYNC_EM_ASM({const c=document.createElement('canvas');c.width=$1;c.height=$2;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice($0,$0+$1*$2*4)),$1,$2),0,0);window.goonkVisitedObjectAtlas=c;_free($0);},bytes,w,h);mobileVisitedName=object->getObjectName();}SDL_FreeSurface(rgba);
}
// Export CPU ground/effect layers only for the portrait trial. No framebuffer
// reads or preselected creature catalogue are needed.
void publishMobileSiegeAtlas(BattleInterface & battle){
 static uintptr_t previous=0;
 if(!battle.siegeController){if(previous){previous=0;MAIN_THREAD_ASYNC_EM_ASM({window.goonkSiegeAtlas=null;window.goonkSiegePieces=[];});}return;}
 const auto revision=battle.siegeController->mobileWallRevision();if(revision==previous)return;previous=revision;
 constexpr int count=18,width=1024,height=1280;
 auto atlas=SDL_CreateRGBSurfaceWithFormat(0,width,height,32,SDL_PIXELFORMAT_ARGB8888);
 auto scratch=SDL_CreateRGBSurfaceWithFormat(0,1024,600,32,SDL_PIXELFORMAT_ARGB8888);
 if(!atlas||!scratch){if(atlas)SDL_FreeSurface(atlas);if(scratch)SDL_FreeSurface(scratch);return;}
 SDL_FillRect(atlas,nullptr,0);std::vector<int32_t> geometry;
 for(int i=0;i<count;++i){SDL_FillRect(scratch,nullptr,0);Point position,dimensions;
  {auto canvas=Canvas::createFromSurface(scratch,CanvasScalingPolicy::IGNORE);if(!battle.siegeController->drawMobileWall(canvas,i,position,dimensions))continue;}
  const double scale=std::min(248.0/dimensions.x,248.0/dimensions.y);SDL_Rect from{0,0,dimensions.x,dimensions.y},to{(i%4)*256+int((256-dimensions.x*scale)/2),(i/4)*256+int((256-dimensions.y*scale)/2),int(dimensions.x*scale),int(dimensions.y*scale)};
  SDL_SetSurfaceBlendMode(scratch,SDL_BLENDMODE_NONE);SDL_BlitScaled(scratch,&from,atlas,&to);geometry.insert(geometry.end(),{i,position.x,position.y,dimensions.x,dimensions.y});
 }
 auto rgba=SDL_ConvertSurfaceFormat(atlas,SDL_PIXELFORMAT_RGBA32,0);SDL_FreeSurface(atlas);SDL_FreeSurface(scratch);if(!rgba)return;
 const size_t prefix=geometry.size()*4,bytes=width*height*4;auto packet=static_cast<uint8_t*>(malloc(prefix+bytes));if(packet){memcpy(packet,geometry.data(),prefix);memcpy(packet+prefix,rgba->pixels,bytes);
 MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;const n=$1;const w=$2;const h=$3;try{window.goonkSiegePieces=Array.from({length:n},(_,i)=>{const row=Array.from(HEAP32.subarray(ptr/4+i*5,ptr/4+i*5+5));return {index:row[0],x:row[1],y:row[2],w:row[3],h:row[4]};});const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice(ptr+n*20,ptr+n*20+w*h*4)),w,h),0,0);window.goonkSiegeAtlas=c;}finally{_free(ptr);}},packet,geometry.size()/5,width,height);}
 SDL_FreeSurface(rgba);
}
void publishMobileVerticalPlanes(BattleInterface & battle){
 if(!mobileVerticalBattle)return;
 publishMobileSiegeAtlas(battle);
 constexpr int width=400,height=300;
 static SDL_Surface * scratch=SDL_CreateRGBSurfaceWithFormat(0,800,600,32,SDL_PIXELFORMAT_ARGB8888);
 if(!scratch)return;
 static uintptr_t previousBackground=0;static uint32_t previousGeneration=~uint32_t(0);const auto revision=battle.fieldController->mobileBackgroundRevision();const int layers=revision==previousBackground&&previousGeneration==mobileVerticalGeneration?2:3;
 const size_t bytes=width*height*4;auto packet=static_cast<uint8_t*>(malloc(bytes*layers));if(!packet)return;previousBackground=revision;previousGeneration=mobileVerticalGeneration;
 for(int layer=0;layer<layers;++layer){memset(scratch->pixels,0,scratch->pitch*scratch->h);{auto canvas=Canvas::createFromSurface(scratch,CanvasScalingPolicy::IGNORE);if(layer==2)battle.fieldController->renderMobileBackground(canvas);else battle.fieldController->renderMobilePlane(canvas,layer==1);}mobile_raster::packCreature(static_cast<const uint32_t*>(scratch->pixels),scratch->pitch/4,0,0,800,600,reinterpret_cast<uint32_t*>(packet+layer*bytes),width,0,0,width,height);}
 MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;const w=$1;const h=$2;const n=w*h*4;try{const planes=window.goonkBattlePlanes||(window.goonkBattlePlanes={});for(let i=0;i<$3;i++){const key=i===0?'ground':i===1?'effects':'background';const c=planes[key]||(planes[key]=document.createElement('canvas'));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}let image=c.goonkPixels;if(!image||image.width!==w||image.height!==h)image=c.goonkPixels=new ImageData(w,h);image.data.set(HEAPU8.subarray(ptr+i*n,ptr+(i+1)*n));c.getContext('2d').putImageData(image,0,0);}planes.version=(planes.version||0)+1;}finally{_free(ptr);}},packet,width,height,layers);
}
std::atomic_bool atlasPending{false};
void publishMobileBattleAtlas(){
 static uint32_t last=0;
 if(!mobileEnabled||!ENGINE||!GAME||atlasPending.load()||SDL_GetTicks()-last<(mobileVerticalBattle?50:83))return;
 const auto battle=CPlayerInterface::battleInt;
 if(!battle||!ENGINE->windows().topWindow<BattleWindow>())return;
 last=SDL_GetTicks();
 publishMobileVerticalPlanes(*battle);
 std::vector<const CStack *> units;size_t total=0;for(const auto stack:battle->getBattle()->battleGetAllStacks())if(stack->getPosition().isValid()){++total;if(units.size()<64)units.push_back(stack);}std::vector<std::array<int32_t,7>> geometry(units.size());
 if(units.empty())return;
 const int width=1024,height=((units.size()+7)/8)*128;
 static SDL_Surface * scratch=nullptr;
 if(!scratch){scratch=SDL_CreateRGBSurfaceWithFormat(0,512,512,32,SDL_PIXELFORMAT_ARGB8888);if(scratch)memset(scratch->pixels,0,scratch->pitch*scratch->h);}
 const size_t prefix=units.size()*7*sizeof(int32_t),bytes=width*height*4;
 auto packet=static_cast<uint8_t*>(calloc(1,prefix+bytes));
 if(!scratch||!packet){free(packet);return;}
 auto * atlasPixels=reinterpret_cast<uint32_t*>(packet+prefix);
 {auto canvas=Canvas::createFromSurface(scratch,CanvasScalingPolicy::IGNORE);
 SDL_Rect dirtyScratch{0,0,0,0};
 for(size_t i=0;i<units.size();i++){
  geometry[i][0]=units[i]->unitId();
  if(dirtyScratch.w>0&&dirtyScratch.h>0)memset(scratch->pixels,0,scratch->pitch*dirtyScratch.h);
  Point bounds;if(!battle->stacksController->drawIsolatedStack(canvas,units[i],bounds)){dirtyScratch={0,0,0,0};continue;}
  const int maxX=std::min(512,bounds.x),maxY=std::min(512,bounds.y);
  dirtyScratch={0,0,maxX,maxY};
  int left=512,top=512,right=-1,bottom=-1;
  for(int y=0;y<maxY;y++){
   const auto * row=reinterpret_cast<const uint32_t*>(static_cast<const uint8_t*>(scratch->pixels)+y*scratch->pitch);
   for(int x=0;x<maxX;x++){if((row[x]>>24)>32){if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;}}
  }
  if(right<left)continue;
  const auto position=battle->stacksController->getStackPositionAtHex(units[i]->getPosition(),units[i])+battle->stacksController->mobileAnimationOffset(units[i]);
  const auto center=battle->fieldController->hexPositionAbsolute(units[i]->getPosition()).center()+battle->stacksController->mobileAnimationOffset(units[i]);
  geometry[i]={int32_t(units[i]->unitId()),position.x+left,position.y+top,right-left+1,bottom-top+1,center.x,center.y};
  SDL_Rect src{left,top,right-left+1,bottom-top+1};double scale=std::min(110.0/src.w,110.0/src.h);
  SDL_Rect dst{int(i%8)*128+(128-int(src.w*scale))/2,int(i/8)*128+(128-int(src.h*scale))/2,int(src.w*scale),int(src.h*scale)};
  mobile_raster::packCreature(static_cast<const uint32_t*>(scratch->pixels),scratch->pitch/4,
   src.x,src.y,src.w,src.h,atlasPixels,width,dst.x,dst.y,dst.w,dst.h);
 }
 if(dirtyScratch.w>0&&dirtyScratch.h>0)memset(scratch->pixels,0,scratch->pitch*dirtyScratch.h);
 }
 for(size_t i=0;i<units.size();i++)memcpy(packet+i*7*sizeof(int32_t),geometry[i].data(),7*sizeof(int32_t));
 atlasPending.store(true);
 MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;const w=$1;const h=$2;const n=$3;try{const rows=Array.from({length:n},(_,i)=>Array.from(HEAP32.subarray(ptr/4+i*7,ptr/4+i*7+7)));const ids=rows.map(row=>row[0]);window.goonkBattleSpriteBounds=rows.map(row=>({stackId:row[0],x:row[1],y:row[2],w:row[3],h:row[4],renderX:row[5],renderY:row[6]}));window.goonkBattleSpriteBoundsComplete=!!$4;const canvas=window.goonkBattleAtlas||document.createElement('canvas');if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}let image=canvas.goonkPixels;if(!image||image.width!==w||image.height!==h)image=canvas.goonkPixels=new ImageData(w,h);image.data.set(HEAPU8.subarray(ptr+n*28,ptr+n*28+w*h*4));canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'}).putImageData(image,0,0);window.goonkBattleAtlas=canvas;window.goonkBattleAtlasIds=new Map(ids.map((id,i)=>[id,i]));}finally{_free(ptr);Module._vcmiMobileAtlasAck();}},packet,width,height,units.size(),total<=64);
}
// Version of native ERA services actually linked into this engine.
extern "C" int EMSCRIPTEN_KEEPALIVE vcmiEraBridgeVersion(){return 2;}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileAtlasAck(){atlasPending.store(false);}
static const CMarketBase * mobileResourceMarket()
{
 if(auto window=ENGINE->windows().topWindow<CMarketWindow>())
  return window->mobileResourceMarket();
 return nullptr;
}

static bool mobileMarketQuote(const CMarketBase & widget,GameResID from,GameResID to,int & give,int & receive)
{
 return from!=to&&widget.market->getOffer(from.getNum(),to.getNum(),give,receive,EMarketMode::RESOURCE_RESOURCE)&&give>0&&receive>0;
}

static JsonNode mobileOnlineRoom(const GlobalLobbyRoom & room)
{
 JsonNode result;
 result["id"].String()=room.gameRoomID;
 result["host"].String()=room.hostAccountDisplayName;
 result["name"].String()=room.description;
 result["size"].Integer()=room.participants.size();
 result["limit"].Integer()=room.playerLimit;
 return result;
}

static const GlobalLobbyRoom * mobileInvitedRoom(GlobalLobbyClient & lobby)
{
 for(const auto & room : lobby.getActiveRooms())
  if(room.statusID == "private" && room.participants.size() < room.playerLimit && lobby.isInvitedToRoom(room.gameRoomID))
   return &room;
 return nullptr;
}

static const GlobalLobbyRoom * mobileCurrentRoom(GlobalLobbyClient & lobby)
{
 const auto & rooms=lobby.getActiveRooms();
 const auto room=std::find_if(rooms.begin(),rooms.end(),[&](const auto & entry){return entry.gameRoomID==lobby.getCurrentGameRoomID();});
 return room==rooms.end()?nullptr:&*room;
}

static void publishMobileScenarios(JsonNode & state, int roomLimit = 0, const CMapInfo * selected = nullptr)
{
 if(!mapsListed){
  mapsListed=true;
  const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){
   return path.getType()==EResType::MAP&&path.getName().starts_with("MAPS/")&&!isGoonkShowcaseMap(path);
  });
  pendingMobileMaps.assign(files.begin(),files.end());
  std::sort(pendingMobileMaps.begin(),pendingMobileMaps.end());
 }
 const auto start=SDL_GetTicks();
 for(int loaded=0;mobileMapCursor<pendingMobileMaps.size()&&loaded<4;++loaded){
  const auto & file=pendingMobileMaps[mobileMapCursor++];
  try{
   CMapInfo info;
   info.mapInit(file.getOriginalName());
   if(info.amountOfHumanControllablePlayers>0)
   {
    const auto & players=info.mapHeader->players;
    const int humanCastleChoices=std::count_if(players.begin(),players.end(),[](const auto & player){
     return player.canHumanPlay&&allowsCastleChoice(player);
    });
    const bool castleChoice=humanCastleChoices==info.amountOfHumanControllablePlayers;
    mobileMaps.push_back({file.getOriginalName(),info.getNameForList(),static_cast<int>(info.amountOfHumanControllablePlayers),
                          info.mapHeader->battleOnly,castleChoice,players.front().canHumanPlay&&allowsCastleChoice(players.front()),
                          info.mapHeader->width,info.mapHeader->height,static_cast<int>(info.amountOfPlayersOnMap),humanCastleChoices});
   }
  }catch(const std::exception &){}
  if(SDL_GetTicks()-start>=8)break;
 }
 state["mapsLoading"].Bool()=mobileMapCursor<pendingMobileMaps.size();
 state["mapsScanned"].Integer()=mobileMapCursor;
 state["mapsTotal"].Integer()=pendingMobileMaps.size();
 auto & maps=state[roomLimit?"onlineScenarios":"maps"].Vector();
 for(size_t i=0;i<mobileMaps.size();++i){
  const auto & map=mobileMaps[i];
  if(roomLimit&&(map.humanSeats<roomLimit||map.battleOnly))continue;
  JsonNode entry;
  entry["index"].Integer()=i;
  entry["name"].String()=map.name;entry["path"].String()=map.file;
  entry["width"].Integer()=map.width;
  entry["height"].Integer()=map.height;
  entry["players"].Integer()=map.players;
  entry["castleChoice"].Bool()=roomLimit?map.castleChoice:map.soloCastleChoice;
  entry["humanSeats"].Integer()=map.humanSeats;
  entry["humanCastleChoices"].Integer()=map.humanCastleChoices;
  if(roomLimit){
   if(selected&&ResourcePath(map.file,EResType::MAP)==ResourcePath(selected->fileURI,EResType::MAP))
    state["onlineScenarioIndex"].Integer()=i;
  }
  maps.push_back(std::move(entry));
 }
}

namespace {
std::atomic_bool previewAtlasPending{false};
void collectPreviewPictures(CIntObject * node, std::vector<CCreaturePic *> & pictures)
{
 if(auto picture=dynamic_cast<CCreaturePic *>(node)){if(pictures.size()<8)pictures.push_back(picture);return;}
 for(auto child:node->children)collectPreviewPictures(child,pictures);
}
void publishMobileMinimap(CMinimap & mini)
{
 static uint32_t last=0;static std::vector<uint8_t> previous;static int previousLevel=-1;
 if(!mobileEnabled || !mini.hasMobileTerrain() || SDL_GetTicks()-last<400)return;
 last=SDL_GetTicks();
 auto surface=SDL_CreateRGBSurfaceWithFormat(0,240,240,32,SDL_PIXELFORMAT_RGBA32);
 if(!surface)return;
 SDL_FillRect(surface,nullptr,0);
 {auto target=Canvas::createFromSurface(surface,CanvasScalingPolicy::IGNORE);mini.drawMobile(target);}
 const size_t bytes=240*240*4;
 const auto pixels=static_cast<uint8_t *>(surface->pixels);
 if(previousLevel!=mini.mobileLevel() || previous.size()!=bytes || memcmp(previous.data(),pixels,bytes)!=0)
 {
  previous.assign(pixels,pixels+bytes);previousLevel=mini.mobileLevel();
  auto packet=static_cast<uint8_t *>(malloc(bytes));
  if(packet){memcpy(packet,pixels,bytes);MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;try{
   const canvas=window.goonkMinimapAtlas||(window.goonkMinimapAtlas=document.createElement('canvas'));
   if(canvas.width!==240||canvas.height!==240){canvas.width=240;canvas.height=240;}
   canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice(ptr,ptr+240*240*4)),240,240),0,0);
   window.goonkMinimapLevel=$1;window.goonkMinimapVersion=(window.goonkMinimapVersion||0)+1;
  }finally{_free(ptr);}},packet,previousLevel);}
 }
 SDL_FreeSurface(surface);
}
void publishMobilePreviewAtlas()
{
 static uint32_t last=0;
 if(!mobileEnabled||!ENGINE||!GAME||previewAtlasPending.load()||SDL_GetTicks()-last<(mobileVerticalBattle?50:33))return;
 std::vector<CCreaturePic *> pictures;
 if(const auto fort=ENGINE->windows().topWindow<CFortScreen>()){
  if(const auto picture=fort->getMobilePreviewPicture())pictures.push_back(picture);
 }else if(ENGINE->windows().topWindow<CRecruitmentWindow>()||ENGINE->windows().topWindow<CStackWindow>()){
  if(const auto top=ENGINE->windows().topWindow<CIntObject>())collectPreviewPictures(top.get(),pictures);
 }
 if(pictures.empty())return;
 last=SDL_GetTicks();
 const int width=256,height=256*pictures.size();
 auto surface=SDL_CreateRGBSurfaceWithFormat(0,width,height,32,SDL_PIXELFORMAT_ARGB8888);
 if(!surface)return;
 SDL_FillRect(surface,nullptr,0);
 std::vector<int32_t> geometry;
 for(size_t i=0;i<pictures.size();++i){
  auto scratch=SDL_CreateRGBSurfaceWithFormat(0,256,256,32,SDL_PIXELFORMAT_ARGB8888);
  if(!scratch){SDL_FreeSurface(surface);return;}
  SDL_FillRect(scratch,nullptr,0);
  {auto canvas=Canvas::createFromSurface(scratch,CanvasScalingPolicy::IGNORE);pictures[i]->drawMobilePreview(canvas);}
  SDL_Rect destination{0,int(i)*256,256,256};SDL_SetSurfaceBlendMode(scratch,SDL_BLENDMODE_NONE);SDL_BlitSurface(scratch,nullptr,surface,&destination);SDL_FreeSurface(scratch);
  geometry.insert(geometry.end(),{int32_t(reinterpret_cast<uintptr_t>(pictures[i])),std::min(256,pictures[i]->pos.w),std::min(256,pictures[i]->pos.h)});
 }
 auto rgba=SDL_ConvertSurfaceFormat(surface,SDL_PIXELFORMAT_RGBA32,0);SDL_FreeSurface(surface);
 if(!rgba)return;
 const size_t prefix=geometry.size()*sizeof(int32_t),bytes=width*height*4;
 auto packet=static_cast<uint8_t *>(malloc(prefix+bytes));
 if(packet){
  memcpy(packet,geometry.data(),prefix);memcpy(packet+prefix,rgba->pixels,bytes);previewAtlasPending.store(true);
  MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;const w=$1;const h=$2;const n=$3;try{
   const entries=Array.from({length:n},(_,i)=>{const at=ptr/4+i*3;return [HEAPU32[at],{x:0,y:i*256,w:HEAP32[at+1],h:HEAP32[at+2]}];});
   let canvas=window.goonkCreaturePreviewAtlas;
   if(!canvas||canvas.width!==w||canvas.height!==h){canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;window.goonkCreaturePreviewImageData=new ImageData(w,h);}
   const pixels=window.goonkCreaturePreviewImageData;pixels.data.set(HEAPU8.subarray(ptr+n*12,ptr+n*12+w*h*4));
   canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'}).putImageData(pixels,0,0);
   window.goonkCreaturePreviewAtlas=canvas;window.goonkCreaturePreviewRects=new Map(entries);window.goonkCreaturePreviewVersion=(window.goonkCreaturePreviewVersion||0)+1;
  }finally{_free(ptr);Module._vcmiMobilePreviewAtlasAck();}},packet,width,height,pictures.size());
 }
 SDL_FreeSurface(rgba);
}
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePreviewAtlasAck(){previewAtlasPending.store(false);}

void publishMobileState(){
 if(ENGINE&&GAME){
  const auto player=GAME->interface();
  const bool ready=player&&ENGINE->windows().topWindow<AdventureMapInterface>()&&!player->mobileHeroMoving()&&!GAME->map().hasOngoingAnimations();
  if(!ready)mapReadySince=0;
  else if(!mapReadySince)mapReadySince=SDL_GetTicks();
 }
 if(deferredMapAction&&ENGINE&&GAME){
  const auto player=GAME->interface();
  if(!player||!ENGINE->windows().topWindow<AdventureMapInterface>())deferredMapAction.reset();
  else if(mapReadySince&&SDL_GetTicks()-mapReadySince>=100){
   const auto command=*deferredMapAction;deferredMapAction.reset();
   vcmiMobileCommand(command[0],command[1],command[2],command[3],command[4],command[5]);
  }
 }
 // Publish the window identity before throttled snapshots. The browser keeps
 // its last complete presentation until the matching window data arrives.
 if(mobileEnabled&&ENGINE){static uintptr_t previous=0;const auto top=ENGINE->windows().topWindow<CIntObject>();const auto token=reinterpret_cast<uintptr_t>(top.get());if(token!=previous){previous=token;MAIN_THREAD_ASYNC_EM_ASM({window.goonkNativeWindowToken=$0>>>0;},token);}}
 publishMobilePreviewAtlas();
 if(!stateEnabled||!ENGINE||!GAME||snapshotPending.load()||SDL_GetTicks()-lastPublished<180)return;lastPublished=SDL_GetTicks();
 exchangeMarkerTiles.clear();
 if(audioMuted){if(ENGINE->sound().getVolume()!=0)ENGINE->sound().setVolume(0);if(ENGINE->music().getVolume()!=0)ENGINE->music().setVolume(0);}
 portraitIds.clear();artifactIconIds.clear();JsonNode n;n["mapSettings"]["moveTime"].Integer()=settings["adventure"]["heroMoveTime"].Integer();n["mapSettings"]["enemyMoveTime"].Integer()=settings["adventure"]["enemyMoveTime"].Integer();n["audioMuted"].Bool()=audioMuted;n["soundVolume"].Integer()=ENGINE->sound().getVolume();n["musicVolume"].Integer()=ENGINE->music().getVolume();n["mode"].String()="menu";auto top=ENGINE->windows().topWindow<CIntObject>();if(top){n["rect"]=rect(top->pos);n["windowToken"].Integer()=reinterpret_cast<uintptr_t>(top.get());}
 auto p=GAME->interface();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battleWindow=ENGINE->windows().topWindow<BattleWindow>();auto recruitWindow=ENGINE->windows().topWindow<CRecruitmentWindow>();auto fortWindow=ENGINE->windows().topWindow<CFortScreen>();auto creatureWindow=ENGINE->windows().topWindow<CStackWindow>();auto spellWindow=ENGINE->windows().topWindow<CSpellWindow>();auto heroWindow=ENGINE->windows().topWindow<CHeroWindow>();
 if(p&&p->cb)mobileAdvanceArmyUpgrades(p);else{mobileArmyUpgradeRun.reset();mobileArmyUpgradeQuote=JsonNode();mobileArmyUpgradeOperation=JsonNode();}
 n["armyUpgradeQuote"]=mobileArmyUpgradeQuote;n["armyUpgradeOperation"]=mobileArmyUpgradeOperation;
 if(!heroWindow)mobileArtifactCombinationPending=false;
 const auto exchangeWindow=mobileEnabled?ENGINE->windows().topWindow<CExchangeWindow>():nullptr;
 const auto garrisonWindow=mobileEnabled?ENGINE->windows().topWindow<CGarrisonWindow>():nullptr;
 const bool sourceArmyWindow=p&&(mobileCampaignExchange(*p,garrisonWindow.get())||mobileGarrisonExchange(*p,garrisonWindow.get())||mobileCampaignRewardExchange(*p,garrisonWindow.get())||mobileJoiningExchange(*p,garrisonWindow.get()));
 const bool openTownHall=mobileEnabled&&townWindow&&mobileTownHall==townWindow->town->id.getNum();
 if(openTownHall)n["openTownHall"].Bool()=true;
 else if(townWindow||!p)mobileTownHall.reset();
 // Upgrade the native preview in place after the server changes this stack.
 // No map/town snapshot is published between the old and refreshed windows.
 if(creatureWindow&&!CPlayerInterface::battleInt)if(const auto stack=creatureWindow->getMobileStack())if(stack->getCreature()!=creatureWindow->getMobileCreature()||stack->getCount()!=creatureWindow->getMobileCount()){
  std::static_pointer_cast<CWindowObject>(creatureWindow)->close();ENGINE->windows().createAndPushWindow<CStackWindow>(stack,false);creatureWindow=ENGINE->windows().topWindow<CStackWindow>();top=creatureWindow;n["rect"]=rect(top->pos);
 }
 if(auto onlineLogin=ENGINE->windows().topWindow<GlobalLobbyLoginWindow>())
 {
  n["mode"].String()="online-login";
  n["dialogTitle"].String()="Online";
  n["onlineHasAccount"].Bool()=!GAME->server().getGlobalLobby().getAccountID().empty();
  n["onlinePending"].Bool()=onlineLogin->webLoginPending();
  n["onlineStatus"].String()=onlineLogin->webLoginStatus();
 }
 else if(ENGINE->windows().topWindow<GlobalLobbyWindow>()||ENGINE->windows().topWindow<GlobalLobbyServerSetup>()||ENGINE->windows().topWindow<GlobalLobbyRoomWindow>())
 {
  n["mode"].String()="online-lobby";
  n["dialogTitle"].String()="Online";
  auto & lobby=GAME->server().getGlobalLobby();
  if(mobileEnabled)
  {
   n["onlineAccount"].String()=lobby.getAccountDisplayName();
   if(auto setup=ENGINE->windows().topWindow<GlobalLobbyServerSetup>())
   {
    n["onlinePage"].String()="create";
    n["onlineCreating"].Bool()=setup->isCreating();
   }
   else if(auto preview=ENGINE->windows().topWindow<GlobalLobbyRoomWindow>())
   {
    n["onlinePage"].String()="preview";
    n["onlineJoinError"].String()=preview->getJoinError();
    for(const auto & room:lobby.getActiveRooms())
     if(room.gameRoomID==preview->getRoomID())n["onlinePreview"]=mobileOnlineRoom(room);
   }
   else if(!GAME->server().inGame())
   {
    n["onlinePage"].String()="browser";
    for(const auto & room:lobby.getActiveRooms())
    {
     if(room.participants.size()>=room.playerLimit)continue;
     if(room.statusID=="private"&&lobby.isInvitedToRoom(room.gameRoomID))
      n["onlineInvites"].Vector().push_back(mobileOnlineRoom(room));
     else if(room.statusID=="public")
      n["onlineRooms"].Vector().push_back(mobileOnlineRoom(room));
    }
   }
  }
  if(ENGINE->windows().topWindow<GlobalLobbyWindow>())
  {
   n["onlineCanCreate"].Bool()=!GAME->server().inGame();
   if(const auto room=mobileInvitedRoom(GAME->server().getGlobalLobby()))
    n["onlineInvitation"].String()=room->hostAccountDisplayName;
  }
 }
 else if(ENGINE->windows().topWindow<CLobbyScreen>())
 {
  auto & server=GAME->server();
  n["mode"].String()=server.inLobbyRoom()?"online-lobby":server.screenType==ESelectionScreen::loadGame?"load":server.screenType==ESelectionScreen::campaignList?"campaign":"lobby";
  if(server.si)
  {
   n["wogOptionsEditable"].Bool()=!server.inLobbyRoom()&&server.screenType==ESelectionScreen::newGame&&server.getState()==EClientState::LOBBY;
   for(const auto choice:server.si->extraOptionsInfo.wogOptions)
    n["wogOptions"].Vector().emplace_back(double(choice));
  }
  if(server.inLobbyRoom())
  {
   n["onlineMatch"].Bool()=true;
   n["onlineHost"].Bool()=server.isHost();
   if(mobileEnabled)
   {
    n["onlinePage"].String()="match";
    n["onlinePlayerCount"].Integer()=server.playerNames.size();
    auto & lobby=GAME->server().getGlobalLobby();
    const auto room=mobileCurrentRoom(lobby);
    if(room)
    {
     n["onlineRoomLimit"].Integer()=room->playerLimit;
     for(const auto & player:room->participants)n["onlinePlayers"].Vector().emplace_back(player.displayName);
     if(server.isHost()&&server.screenType==ESelectionScreen::newGame&&room->playerLimit>=2)
     {
      publishMobileScenarios(n,room->playerLimit,server.mi.get());
      n["onlineScenarioFits"].Bool()=server.mi&&server.mi->mapHeader&&!server.mi->mapHeader->battleOnly&&server.mi->amountOfHumanControllablePlayers>=room->playerLimit;
     }
    }
    if(server.isHost())
    {
     for(const auto & account:lobby.getActiveAccounts())
     {
      if(account.accountID==lobby.getAccountID())continue;
      JsonNode entry;
      entry["id"].String()=account.accountID;
      entry["name"].String()=account.displayName;
      if(room)entry["invited"].Bool()=std::any_of(room->invited.begin(),room->invited.end(),[&](const auto & player){return player.accountID==account.accountID;});
      n["onlineInviteCandidates"].Vector().push_back(std::move(entry));
     }
    }
   }
   n["onlineLoading"].Bool()=server.screenType==ESelectionScreen::loadGame;
   if(server.isHost()&&server.screenType==ESelectionScreen::loadGame)
    n["onlineSaveAvailable"].Bool()=CResourceHandler::get()->existsResource(ResourcePath("SAVES/GOONK-ONLINE-AUTO",EResType::SAVEGAME));
   if(server.si){n["onlineTurnMinutes"].Integer()=server.si->turnTimerInfo.turnTimer/60000;n["onlineCheatsAllowed"].Bool()=server.si->extraOptionsInfo.cheatsAllowed;}
   if(server.mi)
   {
    auto name=server.mi->getNameForList();
    if(name.empty()&&server.mi->scenarioOptionsOfSave)
     name=server.mi->fileURI.substr(server.mi->fileURI.find_last_of('/')+1);
    n["selectedMap"].String()=name;
    if(server.screenType==ESelectionScreen::newGame&&server.mi->mapHeader&&server.si)
    {
     const auto color=server.myFirstColor();
     if(server.si->playerInfos.count(color))
     {
      const auto & player=server.getPlayerInfo(color);
      n["onlineFaction"].Integer()=server.si->playerInfos.at(color).castle.getNum();
      n["onlineRandomFaction"].Bool()=player.isFactionRandom;
      for(const auto id:player.allowedFactions)
      {
       JsonNode faction;
       faction["id"].Integer()=id.getNum();
       faction["name"].String()=id.toFaction()->getNameTranslated();
       n["onlineFactions"].Vector().push_back(std::move(faction));
      }
     }
    }
    if(server.mi->scenarioOptionsOfSave)
     n["onlineCanResume"].Bool()=server.playerNames.size()>=server.mi->amountOfHumanPlayersInSave;
   }
  }
 }
 else if(ENGINE->windows().topWindow<CSimpleJoinScreen>())n["mode"].String()="connecting";
 else if(ENGINE->windows().topWindow<CBonusSelection>())n["mode"].String()="campaign-scenario";
 else if((ENGINE->windows().topWindow<CPrologEpilogVideo>()||ENGINE->windows().topWindow<VideoWindow>())&&GAME->server().si&&GAME->server().si->campState)n["mode"].String()="campaign-intro";
 else if(ENGINE->windows().topWindow<CLoadingScreen>()&&GAME->server().si&&GAME->server().si->campState)n["mode"].String()="campaign-loading";
 else if(ENGINE->windows().topWindow<CInfoWindow>()){n["mode"].String()="dialog";n["dialogTitle"].String()="Game message";}
 else if(const auto shipyard=ENGINE->windows().topWindow<CShipyardWindow>())
 {
  n["mode"].String()="dialog";n["dialogKind"].String()="shipyard";
  auto & presentation=n["dialogPresentation"];
  presentation["title"].String()=LIBRARY->generaltexth->jktexts[13];
  presentation["lines"].Vector().emplace_back(LIBRARY->generaltexth->jktexts[14]);
  presentation["cancel"].Bool()=true;presentation["confirmDisabled"].Bool()=!shipyard->canBuildMobile();
  for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())
  {
   const int amount=shipyard->getMobileCost()[resource];if(amount<=0)continue;
   JsonNode item;item["label"].String()=std::to_string(amount)+" "+LIBRARY->resourceTypeHandler->getById(resource)->getNameTranslated();
   item["rect"]=rect(shipyard->getMobileResourceRect(resource));
   presentation["choices"].Vector().push_back(std::move(item));
  }
 }
 else if(const auto market=mobileResourceMarket())
 {
  n["mode"].String()="market";
  const auto & resources=LIBRARY->resourceTypeHandler->getAllObjects();
  auto & quotes=n["marketQuotes"].Vector();
  for(const auto from:resources)
   for(const auto to:resources)
   {
    int give=0,receive=0;
    if(mobileMarketQuote(*market,from,to,give,receive))
    {
     JsonNode quote;
     quote.Vector()={JsonNode(double(from.getNum())),JsonNode(double(to.getNum())),JsonNode(double(give)),JsonNode(double(receive))};
     quotes.push_back(std::move(quote));
    }
   }
 }
 else if(const auto result=ENGINE->windows().topWindow<CHighScoreInputScreen>())
 {
  n["mode"].String()="dialog";n["dialogKind"].String()="high-score";
  n["highScore"]=result->mobilePresentation();
  auto & presentation=n["dialogPresentation"];
  presentation["queryId"]=n["highScore"]["queryId"];
  if(n["highScore"]["won"].Bool())
  {
   auto & form=presentation["scriptDialog"];
   form["kind"].String()="extended";form["queryId"]=presentation["queryId"];
   form["inputLabel"].String()="Name";form["initialText"]=n["highScore"]["playerName"];
   form["canCancel"].Bool()=true;form["selection"].Integer()=0;
  }
 }
 else if(const auto result=ENGINE->windows().topWindow<BattleResultWindow>()){
  n["mode"].String()="dialog";n["dialogKind"].String()="battle-result";n["battleResult"]=result->mobileResult;
 }
 else if(spellWindow){n["mode"].String()="spellbook";n["spellbook"]=spellWindow->mobileSnapshot();
  if(n["spellbook"]["inCombat"].Bool()&&CPlayerInterface::battleInt)
  {
   const auto battle=CPlayerInterface::battleInt;
   n["spellbook"]["heroSpellPower"]=mobileHeroSpellPower(*battle->getBattle(),battle->currentHero());
  }
 }
 else if(const auto guild=ENGINE->windows().topWindow<CMageGuildScreen>()){
  n["mode"].String()="mage-guild";
  n["mageGuild"]=guild->mobileSnapshot();
 }
 else if(const auto smith=ENGINE->windows().topWindow<CBlacksmithDialog>()){
  n["mode"].String()="dialog";n["dialogKind"].String()="blacksmith";
  auto & data=n["blacksmith"];
  data["unit"]=creature(smith->mobileCreature.toCreature(),1);
  data["cost"].Integer()=smith->mobileArtifact.toArtifact()->getPrice();
  data["canBuy"].Bool()=p&&p->makingTurn&&smith->mobileCanBuy;
  const auto hero=p?dynamic_cast<const CGHeroInstance*>(p->cb->getObj(smith->mobileHero)):nullptr;
  data["alreadyOwned"].Bool()=hero&&hero->hasArt(smith->mobileArtifact);
  data["preview"]=rect(smith->mobilePreview());
 }
 else if(const auto guild=ENGINE->windows().topWindow<CThievesGuildWindow>();guild&&p){
  n["mode"].String()="dialog";n["dialogKind"].String()="thieves-guild";
  SThievesGuildInfo info;p->cb->getThievesGuildInfo(info,guild->getMobileOwner());
  auto & data=n["thievesGuild"];
  HeroIconFrames guildIcons;
  for(int i=0;i<4;++i){JsonNode icon;addHeroIcon(guildIcons,icon,"PSKIL42",i==3?5:i);data["primaryIcons"].Vector().push_back(std::move(icon));}
  for(const auto color:info.playerColors){JsonNode player;player["color"].Integer()=color.getNum();
   static const std::array names={"Red","Blue","Tan","Green","Orange","Purple","Teal","Pink"};
   player["name"].String()=names.at(color.getNum());
   if(const auto it=info.colorToBestHero.find(color);it!=info.colorToBestHero.end()){
    player["hero"].String()=it->second.name;
    if(it->second.portraitSource.isValid()){
     addHeroIcon(guildIcons,player["heroPortrait"],"PortraitsSmall",it->second.getIconIndex());
     if(it->second.details)for(const auto value:it->second.details->primskills)player["primarySkills"].Vector().emplace_back(double(value));
    }
   }
   if(const auto it=info.bestCreature.find(color);it!=info.bestCreature.end()&&it->second!=CreatureID::NONE){
    player["creature"].String()=it->second.toCreature()->getNameSingularTranslated();
    player["creatureId"].Integer()=it->second.getNum();portraitIds.insert(it->second.getNum());
   }
   if(const auto it=info.personality.find(color);it!=info.personality.end()&&it->second!=EAiTactic::RANDOM)player["personality"].String()=LIBRARY->generaltexth->arraytxt[it->second==EAiTactic::NONE?172:168+int(it->second)];
   data["players"].Vector().push_back(player);
  }
  publishHeroIcons(guildIcons);
  const std::array rankings={&info.numOfTowns,&info.numOfHeroes,&info.gold,&info.woodOre,&info.mercSulfCrystGems,&info.obelisks,&info.artifacts,&info.army,&info.income};
  static const std::array labels={"Towns","Heroes","Gold","Wood and ore","Rare resources","Obelisks","Artifacts","Army strength","Daily income"};
  for(size_t i=0;i<rankings.size();++i){JsonNode row;row["label"].String()=labels[i];int rank=0;for(const auto & place:*rankings[i]){++rank;for(const auto color:place)row["ranks"][std::to_string(color.getNum())].Integer()=rank;}data["rows"].Vector().push_back(row);}
 }
 else if(recruitWindow)n["mode"].String()="recruit";
 else if(fortWindow)n["mode"].String()="fort";
 else if(creatureWindow&&creatureWindow->isCommanderLevelUp()){
  n["mode"].String()="dialog";
  n["dialogKind"].String()="commander-level-up";
 }
 else if(creatureWindow&&creatureWindow->isCommander()&&!CPlayerInterface::battleInt){
  n["mode"].String()="dialog";
  n["dialogKind"].String()="commander";
  n["dialogTitle"].String()=creatureWindow->getMobileCreature()->getNameSingularTranslated();
 }
 else if(creatureWindow)n["mode"].String()="creature";
 else if(townWindow)n["mode"].String()="town";
 else if(heroWindow)n["mode"].String()="hero";
 else if(exchangeWindow||sourceArmyWindow)n["mode"].String()="hero-exchange";
 else if(battleWindow)n["mode"].String()="battle";
 else if(const auto map=ENGINE->windows().topWindow<AdventureMapInterface>())
 {
  n["mode"].String()="map";
  n["worldView"].Bool()=map->isWorldView();
 }
 else if(p||ENGINE->windows().topWindow<CBonusSelection>())n["mode"].String()="dialog";
 if(top&&(fortWindow||recruitWindow||creatureWindow))mobilePreviews(top.get(),n["previewUnits"]);
 if(recruitWindow&&recruitWindow->dwelling)for(auto & unit:n["previewUnits"].Vector())
  for(const auto & family:recruitWindow->dwelling->creatures)for(size_t rank=0;rank<family.second.size();++rank)
   if(family.second.size()>1&&family.second[rank].getNum()==unit["id"].Integer())unit["upgradeRank"].Integer()=rank+1;
 if(creatureWindow && (n["mode"].String()=="creature" || n["dialogKind"].String()=="commander" || n["dialogKind"].String()=="commander-level-up") && creatureWindow->getMobileCreature()){
  auto item=creature(creatureWindow->getMobileCreature(),creatureWindow->getMobileCount());
  item["abilities"].Vector().clear();
  for(const auto & description : creatureWindow->getMobileAbilities())
   item["abilities"].Vector().emplace_back(description);
  if(auto stack=creatureWindow->getMobileStack()){mobileStackExperience(item,stack);const bool shooter=stack->hasBonusOfType(BonusType::SHOOTER);item["shooter"].Bool()=shooter;item["shots"].Integer()=stack->valOfBonuses(BonusType::SHOTS);item["attack"].Integer()=stack->getAttack(shooter);item["defense"].Integer()=stack->getDefense(shooter);item["health"].Integer()=stack->getMaxHealth();item["speed"].Integer()=stack->getMovementRange();item["damageMin"].Integer()=stack->getMinDamage(shooter);item["damageMax"].Integer()=stack->getMaxDamage(shooter);}
  if(n["mode"].String()=="creature"&&p&&p->cb&&!CPlayerInterface::battleInt)if(const auto stack=creatureWindow->getMobileStack())if(const auto armyObject=stack->getArmy())if(armyObject->getOwner()==p->playerID){
   const auto slot=armyObject->findStack(stack);UpgradeInfo upgrades(stack->getCreature()->getId());p->cb->fillUpgradeInfo(armyObject,slot,upgrades);
   for(const auto id:upgrades.getAvailableUpgrades()){
    auto upgrade=creature(id.toCreature(),stack->getCount());const auto total=upgrades.getUpgradeTotalCostsFor(id,stack->getCount());upgrade["cost"].Vector().clear();
    for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())upgrade["cost"].Vector().push_back(JsonNode(double(total[resource])));
    upgrade["affordable"].Bool()=p->makingTurn&&p->cb->getResourceAmount().canAfford(total);n["creatureUpgrades"].Vector().push_back(upgrade);
   }
  }
  if(const auto stack=creatureWindow->getMobileBattleStack())
  {
   const bool shooter=stack->hasBonusOfType(BonusType::SHOOTER);item["shooter"].Bool()=shooter;item["inCombat"].Bool()=true;item["stackId"].Integer()=stack->unitId();item["count"].Integer()=stack->getCount();
   item["attack"].Integer()=stack->getAttack(shooter);item["defense"].Integer()=stack->getDefense(shooter);item["health"].Integer()=stack->getMaxHealth();item["speed"].Integer()=stack->getMovementRange();item["damageMin"].Integer()=stack->getMinDamage(shooter);item["damageMax"].Integer()=stack->getMaxDamage(shooter);
   item["currentHealth"].Integer()=stack->getFirstHPleft();item["remainingShots"].Integer()=stack->shots.available();item["remainingRetaliations"].Integer()=stack->counterAttacks.available();mobileSpellEffects(item,*stack);
  }
  n["creatureUnit"]=item;
 }
 if(top && n["mode"].String()=="dialog" && (ENGINE->windows().topWindow<CInfoWindow>() || ENGINE->windows().topWindow<CLevelWindow>() || n["dialogKind"].String()=="commander-level-up" || n["dialogKind"].String()=="commander"))
 {
  auto & presentation=n["dialogPresentation"];
  unsigned skillIndex=0;
  mobileDialogContent(top.get(),presentation,creatureWindow.get(),skillIndex);
  const bool level=bool(ENGINE->windows().topWindow<CLevelWindow>());
  if(creatureWindow)presentation["unit"]=n["creatureUnit"];
  if(creatureWindow)if(const auto commander=creatureWindow->getMobileCommander())
  {
   auto & tree=presentation["commanderTree"];
   tree["level"].Integer()=commander->getLevel();
   tree["selectedSkill"].Integer()=creatureWindow->getMobileSelectedSkill();
   tree["masterRank"].Integer()=ECommander::MAX_SKILL_LEVEL-1;
   tree["maxRank"].Integer()=ECommander::MAX_SKILL_LEVEL;
   const auto available=creatureWindow->getMobileSkillChoices();
   static const std::array names={"Attack","Defense","Health","Damage","Speed","Magic"};
   for(int id=0;id<=ECommander::SPELL_POWER;++id)
   {
    JsonNode skill;skill["id"].Integer()=id;skill["name"].String()=names[id];
    skill["rank"].Integer()=commander->secondarySkills.at(id);
    skill["selectable"].Bool()=creatureWindow->isCommanderLevelUp()&&vstd::contains(available,ui32(id));
    skill["description"].String()=creatureWindow->getCommanderSkillDescription(id,commander->secondarySkills.at(id));
    tree["skills"].Vector().push_back(std::move(skill));
   }
   int id=100;
   for(const auto & requirement:LIBRARY->creh->skillRequirements)
   {
    JsonNode ability;ability["id"].Integer()=id;
    ability["requires"].Vector()={JsonNode(double(requirement.second.first)),JsonNode(double(requirement.second.second))};
    ability["learned"].Bool()=commander->specialSkills.count(id)>0;
    ability["selectable"].Bool()=creatureWindow->isCommanderLevelUp()&&vstd::contains(available,ui32(id));
    std::string description;
    for(const auto & bonus:requirement.first){if(!description.empty())description+="\n";description+=LIBRARY->bth->bonusToString(bonus);}
    ability["description"].String()=description;
    tree["abilities"].Vector().push_back(std::move(ability));++id;
   }
  }
  presentation["title"].String()=n["dialogKind"].String()=="commander"?"Commander":level?"Level up":n["dialogKind"].String()=="commander-level-up"?"Commander level up":"Game message";
  if(auto info=ENGINE->windows().topWindow<CInfoWindow>()){
   if(p&&p->cb){const auto phase=mobileArtifactRewardPhase(*p);if(!phase.empty())presentation["artifactGrantPhase"].String()=phase;}
   if(p&&p->cb&&mobileCampaignPrompt(*p))n["dialogKind"].String()="source-campaign";
   else if(info->text&&info->text->label)
   {
    const auto & text=info->text->label->getText();
    if(text==LIBRARY->generaltexth->translate("tum-era.henchmen.offerBeforeBattle"))
     n["dialogKind"].String()="henchman-offer";
    else if(text==LIBRARY->generaltexth->translate("tum-era.henchmen.chooseBeforeBattle"))
     n["dialogKind"].String()="henchman-choice";
    else if(text==LIBRARY->generaltexth->translate("tum-era.henchmen.resurrection.offer"))
     n["dialogKind"].String()="henchman-resurrection";
    if(n["dialogKind"].String()=="henchman-offer"||n["dialogKind"].String()=="henchman-choice"
        ||n["dialogKind"].String()=="henchman-resurrection")
     presentation["queryId"].Integer()=info->ID.getNum();
   }
   if(p&&p->cb&&mobileVisitedID!=ObjectInstanceID::NONE)
    if(const auto object=dynamic_cast<const CRewardableObject*>(p->cb->getObj(mobileVisitedID)))
     if(info->text&&info->text->label&&info->text->label->getText()==object->configuration.onSelect.toString())
      if(const auto hero=p->localState->getCurrentHero())
      {
       const auto rewards=object->getAvailableRewards(hero,Rewardable::EEventType::EVENT_FIRST_VISIT);
       auto & choices=presentation["choices"].Vector();
       if(rewards.size()==choices.size()&&std::all_of(choices.begin(),choices.end(),[](const JsonNode & choice){return choice["selectable"].Bool();}))
        for(size_t i=0;i<rewards.size();++i){const auto description=object->configuration.info.at(rewards[i]).description.toString();if(!description.empty()){choices[i]["label"].String()=description;choices[i]["description"].String()=description;}}
      }
   presentation["queryId"].Integer()=info->ID.getNum();
   if(const auto scripted=std::dynamic_pointer_cast<CSourceCampaignDialog>(info))
   {
    presentation["scriptDialog"]=scripted->presentation();
    presentation["lines"].Vector()={JsonNode(scripted->model["text"].String())};
    presentation["choices"].Vector().clear();
   }
   if(p&&p->cb&&mobileVisitedID!=ObjectInstanceID::NONE)
    if(const auto object=dynamic_cast<const CRewardableObject*>(p->cb->getObj(mobileVisitedID)))
     if(info->text&&info->text->label&&info->text->label->getText()==object->configuration.onSelect.toString())
      if(const auto hero=p->localState->getCurrentHero())
      {
       const auto objectKey=object->getObjectHandler()->getJsonKey();
       if(objectKey=="goonk:emeraldTower" || objectKey=="goonk:bannerOutfitter")
       {
        const auto rewards=object->getAvailableRewards(hero,Rewardable::EEventType::EVENT_FIRST_VISIT);
        auto & choices=presentation["choices"].Vector();
        if(rewards.size()==choices.size()&&choices.size()>1)
        {
         presentation["progression"].String()=objectKey=="goonk:emeraldTower"?"tower":"banners";
         for(size_t i=0;i<rewards.size();++i)
         {
          const auto & reward=object->configuration.info.at(rewards[i]).reward;
          if(!reward.heroBonuses.empty())if(const auto limiter=std::dynamic_pointer_cast<const CCreatureTypeLimiter>(reward.heroBonuses.front()->limiter))
          {choices[i]["familyId"].Integer()=limiter->creatureID.getNum();choices[i]["familyName"].String()=limiter->creatureID.toCreature()->getNameSingularTranslated();}
          if(!reward.grantedArtifacts.empty()){const auto type=reward.grantedArtifacts.front().toArtifact();choices[i]["icon"].Integer()=type->getIconIndex();artifactIconIds.insert(type->getIconIndex());}
         }
        }
       }
      }
   presentation["cancel"].Bool()=info->buttons.size()>1;if(!mobileVisitedName.empty()){presentation["visitedObject"].String()=mobileVisitedName;mobileVisitShown=true;}
  }
 }
 if(n["mode"].String()=="map"&&mobileVisitShown){mobileVisitedName.clear();mobileVisitShown=false;mobileVisitedID=ObjectInstanceID::NONE;}
 n["sessionState"].Integer()=static_cast<int>(GAME->server().getState());if(n["mode"].String()=="connecting")n["launchAction"].Integer()=GAME->server().screenType==ESelectionScreen::loadGame?23:GAME->server().screenType==ESelectionScreen::campaignList?47:20;
 if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>()){
  n["dialogKind"].String()="tavern";n["dialogTitle"].String()="Taverne";
  auto & details=n["tavern"];
  details["cost"].Integer()=GameConstants::HERO_GOLD_COST;
  details["canRecruit"].Bool()=p&&p->makingTurn&&tavern->recruit&&!tavern->recruit->isBlocked();
  details["recruitReason"].String()=tavern->recruitBlockReason;
  if(tavern->rumor&&tavern->rumor->label)details["rumor"].String()=tavern->rumor->label->getText();
  if(tavern->thiefGuild)details["thievesGuild"]=rect(tavern->thiefGuild->pos);
  if(tavern->inviteHeroImageArea)details["invite"]=rect(tavern->inviteHeroImageArea->pos);
  const std::array portraits={tavern->h1,tavern->h2};
  for(int index=0;index<int(portraits.size());index++)
  {
   const auto & portrait=portraits[index];
   if(!portrait||!portrait->h)continue;
   auto & candidate=n["tavernHeroes"][std::to_string(index)];
   candidate["name"].String()=portrait->h->getNameTranslated();
   candidate["className"].String()=portrait->h->getClassNameTranslated();
   candidate["level"].Integer()=portrait->h->level;
   candidate["id"].Integer()=portrait->h->getHeroTypeID().getNum();
   candidate["rect"]=rect(portrait->pos);
  }
 }

 if(auto fort=ENGINE->windows().topWindow<CFortScreen>()){
  n["dialogKind"].String()="fort";n["dialogTitle"].String()="Créatures du château";
  for(const auto & area:fort->mobileRecruitAreas())n["fortAreas"].Vector().push_back(rect(area));
 }
 if(n["mode"].String()=="lobby"){
  n["lobbyReady"].Bool()=GAME->server().getState()==EClientState::LOBBY;
  // Keep the engine responsive while cataloguing hundreds of installed maps.
  // Append-only indices stay valid while the remaining headers are read.
  publishMobileScenarios(n);
  if(GAME->server().mi){
   auto & server=GAME->server();n["customMap"].Bool()=server.mi->isRandomMap;n["selectedMap"].String()=server.mi->getNameForList();n["difficulty"].Integer()=server.si->difficulty;
   n["lobbyHumanCount"].Integer()=server.playerNames.size();
   if(server.mi->isRandomMap && server.si->mapGenOptions){
    const auto & options=*server.si->mapGenOptions;
    auto & config=n["customMapOptions"];
    config["players"].Integer()=options.getMaxPlayersCount();
    config["humans"].Integer()=options.getHumanOrCpuPlayerCount();
    config["size"].Integer()=options.getWidth();
    config["levels"].Integer()=options.getLevels();
   }
   const auto color=server.myFirstColor();
   if(server.si->playerInfos.count(color)){
    const auto & allowed=server.getPlayerInfo(color).allowedFactions;
    n["selectedFaction"].Integer()=server.si->playerInfos.at(color).castle.getNum();n["allowRandomFaction"].Bool()=server.getPlayerInfo(color).isFactionRandom;
    for(const auto id:allowed){const auto faction=id.toFaction();JsonNode item;item["id"].Integer()=id.getNum();item["name"].String()=faction->getNameTranslated();item["key"].String()=faction->getJsonKey();n["factions"].Vector().push_back(item);}
    if(!pendingDefaultMap.empty()&&server.mi->getNameForList()==pendingDefaultMap){pendingDefaultMap.clear();server.setDifficulty(1);for(const auto id:allowed)if(id.toFaction()->getJsonKey()=="goonk:goonk")server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,id.getNum(),color);}
   }
  }
 }
 if(n["mode"].String()=="lobby"&&GAME->server().mi&&GAME->server().si){auto & server=GAME->server();for(const auto & player:server.si->playerInfos){JsonNode row;row["color"].Integer()=player.first.getNum();row["name"].String()=player.second.name;row["faction"].Integer()=player.second.castle.getNum();row["incomePercent"].Integer()=player.second.handicap.percentIncome;for(auto id:server.getPlayerInfo(player.first).allowedFactions){auto faction=id.toFaction();JsonNode item;item["id"].Integer()=id.getNum();item["name"].String()=faction->getNameTranslated();item["key"].String()=faction->getJsonKey();row["factions"].Vector().push_back(item);}n["players"].Vector().push_back(row);}}
 if(auto selection=ENGINE->windows().topWindow<CBonusSelection>()){
  const auto campaign=selection->getCampaign();auto & data=n["campaignScenario"];
  data["name"].String()=campaign->getNameTranslated();data["description"].String()=campaign->getDescriptionTranslated();data["selected"].Integer()=GAME->server().campaignMap.getNum();data["bonus"].Integer()=GAME->server().campaignBonus;data["difficulty"].Integer()=GAME->server().si->difficulty;data["chooseDifficulty"].Bool()=campaign->playerSelectedDifficulty();
  data["scenarioName"].String()=GAME->server().mi?GAME->server().mi->getNameTranslated():"";data["scenarioDescription"].String()=GAME->server().mi?GAME->server().mi->getDescriptionTranslated():"";
  data["canStart"].Bool()=selection->buttonStart->isActive()&&!selection->buttonStart->isBlocked();data["mapRect"]=rect(Rect(selection->pos.x,selection->pos.y,456,600));data["scenarios"].Vector();data["bonuses"].Vector();
  for(const auto id:campaign->allScenarios()){JsonNode item;item["id"].Integer()=id.getNum();item["name"].String()=campaign->scenario(id).scenarioName.toString();item["available"].Bool()=campaign->isAvailable(id);item["completed"].Bool()=campaign->isConquered(id);data["scenarios"].Vector().push_back(item);}
  for(const auto & entry:selection->groupBonuses->buttons){JsonNode item;item["id"].Integer()=entry.first;if(entry.first>=0&&entry.first<int(selection->mobileBonusDescriptions.size()))item["description"].String()=selection->mobileBonusDescriptions[entry.first];if(auto button=std::dynamic_pointer_cast<CToggleButton>(entry.second))item["rect"]=rect(button->pos);data["bonuses"].Vector().push_back(item);}
 }
 if(n["mode"].String()=="campaign"){
 n["lobbyReady"].Bool()=GAME->server().getState()==EClientState::LOBBY;
 if(mobileCampaigns.empty()){for(const auto & file:CResourceHandler::get()->getFilteredFiles([](const ResourcePath & p){return p.getType()==EResType::CAMPAIGN;}))try{CMapInfo info;info.fileURI=file.getOriginalName();info.campaign=CampaignHandler::getHeader(info.fileURI);mobileCampaigns.emplace_back(file.getOriginalName(),info.getNameForList());}catch(const std::exception &){} }
 for(size_t i=0;i<mobileCampaigns.size();i++){JsonNode row;row["index"].Integer()=i;row["name"].String()=mobileCampaigns[i].second;n["campaigns"].Vector().push_back(row);}
 }
 if(n["mode"].String()=="load"){
  n["lobbyReady"].Bool()=GAME->server().getState()==EClientState::LOBBY;
  if(!savesListed)
  {
   savesListed=true;
   mobileSaves.clear();
   const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){return path.getType()==EResType::SAVEGAME;});
   for(const auto & file:files)
   {
    try
    {
     CMapInfo info;
     info.saveInit(file);
     const auto name=info.getNameForList();
     const auto resource=ResourcePath(file.getOriginalName(),EResType::SAVEGAME).getName();
     const bool automatic=resource=="SAVES/GOONK-AUTO"||resource=="SAVES/GOONK-ONLINE-AUTO";
     mobileSaves.push_back({file.getOriginalName(),name,automatic?info.getNameTranslated():std::string{}});
    }
    catch(const std::exception &){}
   }
   std::sort(mobileSaves.begin(),mobileSaves.end(),[](const auto & a,const auto & b){return a.file<b.file;});
  }
  const auto selected=GAME->server().mi?ResourcePath(GAME->server().mi->fileURI,EResType::SAVEGAME).getName():std::string{};
  for(size_t i=0;i<mobileSaves.size();i++)
  {
   const auto & save=mobileSaves[i];
   JsonNode entry;
   entry["index"].Integer()=i;
   entry["name"].String()=save.name;
   entry["file"].String()=save.file;
   if(!save.scenario.empty())entry["scenario"].String()=save.scenario;
   n["maps"].Vector().push_back(entry);
   if(ResourcePath(save.file,EResType::SAVEGAME).getName()==selected)
   {
    n["selectedMap"].String()=save.name;
    n["selectedIndex"].Integer()=i;
   }
  }
 }else savesListed=false;
 if(recruitWindow){
  if(const auto c=recruitWindow->getRecruitCreature())n["recruitUnit"]=creature(c,recruitWindow->getRecruitAvailable());
  n["recruitAmount"].Integer()=recruitWindow->getRecruitAmount();n["recruitMaximum"].Integer()=recruitWindow->getRecruitMaximum();
 }
 if(p&&p->cb&&p->localState){n["day"].Integer()=p->cb->getDate(Date::DAY);
  n["campaignPending"].Bool()=mobileCampaignBusy(*p);
  n["currentPlayer"].Integer()=p->playerID.getNum();
  n["players"].Vector();
  for(const auto & [color,player]:p->cb->getStartInfo()->playerInfos){JsonNode row;row["color"].Integer()=color.getNum();row["name"].String()=player.name;row["human"].Bool()=player.isControlledByHuman();n["players"].Vector().push_back(std::move(row));}

  n["heroMoving"].Bool()=p->mobileHeroMoving()||(adventureInt&&GAME->map().hasOngoingAnimations());n["turn"].Bool()=p->makingTurn; const auto & server=GAME->server();n["onlineGame"].Bool()=server.inLobbyRoom();
  if(p->makingTurn&&p->cb->getStartInfo()->turnTimerInfo.turnTimer>0)
   n["turnRemainingMs"].Integer()=p->cb->getPlayerTurnTime(p->playerID).valueMs();
  const bool sourceCheckpoint=mobileCampaignPrompt(*p)||mobileCampaignExchange(*p,garrisonWindow.get())||mobileArtifactRewardCheckpoint(*p)||mobileCommanderChoiceCheckpoint(*p)||mobileRogueCheckpoint(*p);
  n["autosaveAllowed"].Bool()=!mobileCampaignBattleHook(*p)&&(!server.inLobbyRoom()||server.isHost())&&(p->makingTurn||sourceCheckpoint)&&!n["heroMoving"].Bool()&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>()||sourceCheckpoint);
  n["cheatsAllowed"].Bool()=p->cb->getStartInfo()->extraOptionsInfo.cheatsAllowed;
  n["cheatReady"].Bool()=p->makingTurn&&(n["mode"].String()=="map"||n["mode"].String()=="town");
  if(p->localState->getCurrentTown())n["selectedTownName"].String()=p->localState->getCurrentTown()->getNameTranslated();
  for(const auto resourceId:LIBRARY->resourceTypeHandler->getAllObjects()){
   const auto resource=LIBRARY->resourceTypeHandler->getById(resourceId);JsonNode type;
   type["id"].Integer()=resourceId.getNum();type["key"].String()=resource->getJsonKey();type["scope"].String()=resource->getModScope();type["name"].String()=resource->getNameTranslated();
   resource->registerIcons([&type](int32_t,int32_t,const std::string & list,const std::string & image){if(list=="SMALRES")type["icon"].String()=image;});
   n["resourceTypes"].Vector().push_back(type);n["resources"].Vector().push_back(JsonNode(double(p->cb->getResourceAmount(resourceId))));
  }
  if(n["mode"].String()=="map"&&adventureInt){auto mini=adventureInt->getMobileMinimap();if(mini){auto size=p->cb->getMapSize();auto & m=n["mapOverview"];m["rect"]=rect(mini->pos);m["view"]=rect(adventureInt->getMobileMapRect());m["viewport"]=rect(mini->mobileVisibleArea());m["width"].Integer()=size.x;m["height"].Integer()=size.y;m["level"].Integer()=mini->mobileLevel();publishMobileMinimap(*mini);}}
  const bool mithrilEnhancements=era_compat::mithril::enabled(*p->cb);
  const bool mithrilDisplay=era_compat::mithril::displayEnabled(*p->cb);
  n["mithrilEnabled"].Bool()=mithrilEnhancements;
  n["mithrilDisplayEnabled"].Bool()=mithrilDisplay;
  if(mithrilEnhancements||mithrilDisplay)
  {
   if(mobileMithrilPanel&&n["mode"].String()=="map")
   {
    auto & panel=n["mithril"];panel["revision"].Integer()=era_compat::mithril::revision(*p->cb);
    const auto currency=era_compat::mithril::resource();
    const auto amount=currency==GameResID::NONE?0:p->cb->getResourceAmount(currency);
    panel["amount"].Integer()=amount;
    if(mithrilDisplay)
    {
     auto & info=panel["information"];
     const auto text=[](const std::string & key){return LIBRARY->generaltexth->translate("tum-era.mithril.display."+key);};
     auto total=text("total");
     boost::replace_first(total,"%d",std::to_string(amount));
     boost::replace_first(total,"%s",text(era_bridge::mithril::displayPlural(amount)?"plural":"singular"));
     info["total"].String()=total;
     if(mithrilEnhancements)
     {
      info["title"].String()=text("title");info["help"].String()=text("help");
      for(int row=0;row<11;++row)info["prices"].Vector().emplace_back(text("price."+std::to_string(row)));
     }
    }
    for(const auto & object:static_cast<const IGameInfoCallback &>(*p->cb).gameState().getMap().objects)
    {
     if(!mithrilEnhancements)break;
     if(!object||!p->cb->getObj(object->id,false))continue;
     if(object->ID!=Obj::MINE&&object->ID!=Obj::CREATURE_GENERATOR1&&object->ID!=Obj::CREATURE_GENERATOR4
      &&object->ID!=Obj::WINDMILL&&object->ID!=Obj::WATER_WHEEL&&object->ID!=Obj::UNIVERSITY
      &&object->ID!=Obj::WITCH_HUT&&object->ID!=Obj::SHRINE_OF_MAGIC_INCANTATION
      &&object->ID!=Obj::SHRINE_OF_MAGIC_GESTURE&&object->ID!=Obj::SHRINE_OF_MAGIC_THOUGHT
      &&object->ID!=Obj::MONOLITH_ONE_WAY_ENTRANCE&&object->ID!=Obj::MONOLITH_TWO_WAY
      &&object->ID!=Obj::SHIPYARD&&object->ID!=Obj::TOWN)continue;
     const int choices=object->ID==Obj::TOWN?9:1;
     for(int choice=0;choice<choices;++choice)
     {
     const auto offer=era_compat::mithril::offer(*p->cb,*object,p->playerID,choice);
     const bool activeMine=era_compat::mithril::mineActive(*p->cb,object->id);
     const bool protectedMine=era_compat::mithril::mineProtected(*p->cb,object->id);
     const bool activeMill=era_compat::mithril::millActive(*p->cb,object->id);
     const bool activeUniversity=era_compat::mithril::universityActive(*p->cb,object->id);
     if(!offer.available()&&!activeMine&&!protectedMine&&!activeMill&&!activeUniversity)continue;
     JsonNode row;row["id"].Integer()=object->id.getNum();row["name"].String()=object->getObjectName();
     row["kind"].Integer()=activeMine||protectedMine?era_compat::mithril::MINE:activeMill?era_compat::mithril::MILL:activeUniversity?era_compat::mithril::UNIVERSITY:offer.kind;
     row["choice"].Integer()=choice;
     row["cost"].Integer()=offer.cost;row["available"].Bool()=p->makingTurn&&offer.available()&&amount>=offer.cost;
     row["active"].Bool()=activeMine||protectedMine||activeMill||activeUniversity;
     row["protection"].Bool()=object->ID==Obj::MINE&&era_compat::map_rules::weeklyMines(*p->cb);
     row["days"].Integer()=protectedMine?7-(p->cb->getDate(Date::DAY)-1)%7:activeMine?era_compat::mithril::mineMarker(*p->cb,object->id):0;
     row["x"].Integer()=object->visitablePos().x;row["y"].Integer()=object->visitablePos().y;
     if(const auto * mine=dynamic_cast<const CGMine *>(object.get()))
     {
      if(mine->getOwner().isValidPlayer())
      {
       row["dailyIncome"].Integer()=mine->dailyIncomeBeforeHandicap()[mine->producedResource];
       row["incomePercent"].Integer()=p->cb->getPlayerSettings(mine->getOwner())->handicap.percentIncome;
      }
      row["resource"].String()=LIBRARY->resourceTypeHandler->getById(mine->producedResource)->getNameTranslated();
     }
     if(!offer.upgrades.empty()&&offer.upgrades.front().hasValue())row["upgrade"].String()=offer.upgrades.front().toCreature()->getNamePluralTranslated();
     for(const auto upgraded:offer.upgrades)if(upgraded.hasValue())row["upgrades"].Vector().emplace_back(upgraded.toCreature()->getNamePluralTranslated());
     if(offer.kind==era_compat::mithril::SHRINE&&offer.current>=0)
      row["current"].String()=SpellID(offer.current).toSpell()->getNameTranslated();
     if(offer.kind==era_compat::mithril::HUT&&offer.current>=0)
      row["current"].String()=LIBRARY->skillh->getById(SecondarySkill(offer.current))->getNameTranslated();
     panel["offers"].Vector().push_back(std::move(row));
     }
    }
   }
  }
  const auto hero=heroWindow?heroWindow->curHero:p->localState->getCurrentHero();
  if(hero){n["heroName"].String()=hero->getNameTranslated();n["heroMana"].Integer()=hero->mana;n["heroManaLimit"].Integer()=hero->manaLimit();n["heroHasSpellbook"].Bool()=hero->hasSpellbook();n["movement"].Integer()=hero->movementPointsRemaining();n["heroId"].Integer()=hero->id.getNum();n["armies"].Vector().push_back(army(hero,hero->getNameTranslated()));if(p->localState->hasPath(hero)){n["hasPath"].Bool()=true;n["pathTurns"].Integer()=p->localState->getPath(hero).lastNode().turns;}}
  if(hero&&hero->getOwner()==p->playerID&&!hero->isGarrisoned()&&!hero->inBoat()&&(heroWindow||n["mode"].String()=="map"))
  {
   const auto & saved=static_cast<const IGameInfoCallback &>(*p->cb).gameState().getSourceCampaignState();
   if(saved.isNull()||era_campaign_deployment::admitted(saved))
   {
    const auto & deployment=era_campaign_deployment::admitted(saved)?saved:static_cast<const IGameInfoCallback &>(*p->cb).gameState().getMap().sourceCampaignWorld["troopDeployment"];
    auto & deploy=n["troopDeployment"];deploy["heroId"].Integer()=hero->id.getNum();deploy["revision"].Integer()=deployment["lastTroopDeployment"]["revision"].Integer();
    const auto origin=hero->visitablePos();deploy["origin"].Vector()={JsonNode(origin.x),JsonNode(origin.y),JsonNode(origin.z)};std::int64_t army=0;for(const auto & entry:hero->stacks)army+=entry.second->getCount();
    for(int slot=0;slot<7;++slot)if(hero->hasStackAtSlot(SlotID(slot)))
    {
     const auto & stack=hero->getStack(SlotID(slot));const auto source=era_bridge::sourceCreatureIdForLevel(stack.getCreature()->getJsonKey());auto unit=creature(stack.getCreature(),stack.getCount());unit["slot"].Integer()=slot;
     unit["maximum"].Integer()=era_campaign_deployment_rule::maximum(stack.getCount(),army,source.value_or(stack.getId().getNum()),stack.getCreature()->warMachine!=ArtifactID::NONE);deploy["troops"].Vector().push_back(unit);
    }
    for(std::size_t index=0;index<era_campaign_deployment_rule::directions.size();++index)
    {
     const auto offset=era_campaign_deployment_rule::directions[index];const int3 target=origin+int3(offset[0],offset[1],0);JsonNode cell;cell["direction"].Integer()=index;cell["x"].Integer()=target.x;cell["y"].Integer()=target.y;
     cell["available"].Bool()=era_campaign_deployment::emptyLand(static_cast<const IGameInfoCallback &>(*p->cb).gameState().getMap(),target,saved)&&p->cb->isVisibleFor(target,p->playerID);deploy["targets"].Vector().push_back(cell);
    }
   }
  }
  if(n["mode"].String()=="map"&&hero)
  {
   if(const auto town=mobileResidentTown(hero);town&&town->getOwner()==p->playerID)
   {
    mobileTownArmies(n,town);
    const auto machine=town->getWarMachineInBuilding(BuildingID::BLACKSMITH);
    if(machine.hasValue())n["townWarMachine"]=creature(machine.toArtifact()->getWarMachine().toCreature(),1);
   }
  }
  if(exchangeWindow)
   n["heroExchange"]=mobileExchange(*exchangeWindow,*p);
  else if(sourceArmyWindow)
  {
   auto & exchange=n["heroExchange"];exchange["classicOnly"].Bool()=false;exchange["troopsOnly"].Bool()=true;const bool nativeGarrison=mobileGarrisonExchange(*p,garrisonWindow.get());exchange["garrison"].Bool()=nativeGarrison;exchange["joining"].Bool()=mobileJoiningExchange(*p,garrisonWindow.get());
   for(int side=0;side<2;++side)
   {
    const auto * current=garrisonWindow->getMobileArmy(side);JsonNode entry;
    const auto * currentHero=dynamic_cast<const CGHeroInstance *>(current);
    entry["id"].Integer()=current->id.getNum();entry["name"].String()=currentHero?currentHero->getNameTranslated():current->getObjectName();entry["owned"].Bool()=!nativeGarrison||current->getOwner()==p->playerID;const auto * fixed=dynamic_cast<const CGGarrison *>(current);entry["withdrawAllowed"].Bool()=!fixed||fixed->removableUnits;
    if(side==1)entry["portrait"]=rect(garrisonWindow->getMobilePortrait());
    entry["army"]=army(current,entry["name"].String());entry["slots"].Vector();exchange["heroes"].Vector().push_back(entry);
   }
  }
  if(mobileEnabled && n["mode"].String()=="map" && !n["worldView"].Bool())
  {
   for(const auto partner:mobileExchangePartners(*p,hero))
   {
    JsonNode item;
    item["id"].Integer()=partner->id.getNum();
    item["name"].String()=partner->getNameTranslated();
    n["exchangePartners"].Vector().push_back(std::move(item));
    if(!partner->isGarrisoned() && partner->visitablePos()!=hero->visitablePos())
     exchangeMarkerTiles.push_back(partner->visitablePos());
   }
   if(!exchangeMarkerTiles.empty() && !hero->isGarrisoned())
    exchangeMarkerTiles.push_back(hero->visitablePos());
  }
  if(heroWindow&&hero){auto & h=n["heroWindow"];h["owned"].Bool()=hero->getOwner()==p->playerID;h["name"].String()=hero->getNameTranslated();h["className"].String()=hero->getClassNameTranslated();h["level"].Integer()=hero->level;h["mana"].Integer()=hero->mana;h["manaLimit"].Integer()=hero->manaLimit();h["portrait"]=rect(Rect(heroWindow->pos.x+19,heroWindow->pos.y+19,58,64));
   h["id"].Integer()=hero->id.getNum();
   h["canRebalanceSourceArtifacts"].Bool()=h["owned"].Bool()&&p->makingTurn&&!CPlayerInterface::battleInt&&!heroWindow->getPickedArtifact()&&era_compat::hasEquippedAtma(*hero);
   if(h["owned"].Bool()&&p->cb->getSettings().getBoolean(EGameSettings::MODULE_STACK_ARTIFACT))
    n["troopEquipment"]=troopEquipmentSnapshot(*hero,p->makingTurn&&!heroWindow->getPickedArtifact());
   HeroIconFrames icons;
   for(int i = 0; i < 4; ++i)
   {
    h["primarySkills"].Vector().push_back(JsonNode(double(hero->getPrimSkillLevel(static_cast<PrimarySkill>(i)))));
    JsonNode icon;
    addHeroIcon(icons, icon, "PSKIL42", i == 3 ? 5 : i);
    h["primaryIcons"].Vector().push_back(std::move(icon));
   }
   h["experience"].Integer()=era_campaign_experience_word::active(*hero)?static_cast<si64>(era_campaign_chest::signedWord(hero->exp)):static_cast<si64>(hero->exp);
   addHeroIcon(icons, h["experienceIcon"], "PSKIL42", 4);
   addHeroIcon(icons, h["manaIcon"], "PSKIL42", 3);
   addHeroIcon(icons, h["specialty"]["icon"], "UN44", hero->getHeroType()->imageIndex);
   const int morale = hero->hasBonusOfType(BonusType::NO_MORALE) ? 0 : hero->moraleVal();
   const int luck = hero->luckVal();
   h["morale"]["value"].Integer() = morale;
   h["luck"]["value"].Integer() = luck;
   addHeroIcon(icons, h["morale"]["icon"], "IMRL42", std::clamp(morale + 3, 0, 6));
   addHeroIcon(icons, h["luck"]["icon"], "ILCK42", std::clamp(luck + 3, 0, 6));
   if(const auto progression=era_compat::sourceCreatureSpecialty(*hero))
   {
    auto & growth=h["specialty"]["sourceProgression"];growth["family"].String()=progression->family.toCreature()->getNameSingularTranslated();
    growth["attackDefense"].Integer()=progression->attackDefense;growth["damage"].Integer()=progression->damage;growth["healthPercent"].Integer()=progression->healthPercent;growth["warMachines"].Bool()=progression->warMachines;
   }
   h["specialty"]["name"].String()=hero->getHeroType()->getSpecialtyNameTranslated();
   h["specialty"]["description"].String()=hero->getHeroType()->getSpecialtyDescriptionTranslated();
   h["caveEffects"].String()=CGMysteriousCave::describeHeroEffects(hero);
   auto & campaignEffects=h["campaignEffects"].Vector();
   const auto & campaignGame=static_cast<const IGameInfoCallback &>(*p->cb).gameState();
   const auto & campaignState=campaignGame.getMap().sourceCampaignState;
   for(const auto & row:campaignState["slotCurses"].Vector())
   {
    if(row["hero"].Integer()!=hero->getHeroTypeID().getNum()||row["kind"].isNull())continue;
    const auto kind=row["kind"].Integer();if(kind!=4&&kind!=65)continue;
    const int remaining=era_campaign_slot_curse::subtract(era_campaign_slot_curse::add(int(row["start"].Integer()),int(row["length"].Integer())),int(campaignGame.day));if(remaining<0)continue;
    JsonNode effect;effect["kind"].Integer()=kind;effect["delta"].Integer()=kind==4?era_campaign_slot_curse::subtract(0,int(row["value"].Integer())):int(row["value"].Integer());effect["remainingDays"].Integer()=remaining;effect["permanent"].Bool()=row["length"].Integer()==9999;campaignEffects.push_back(std::move(effect));
   }

   if(CGMysteriousCave::isBuilder(hero)){h["specialty"]["name"].String()="Bâtisseur";h["specialty"]["description"].String()="Démolit et reconstruit les villes pendant la durée du don de la Grotte.";}
   auto & skills=h["skills"].Vector();
   for(const auto & [id, level]:hero->secSkills)
   {
    if(id==SecondarySkill::NONE||level<1||level>3)
     continue;
    const auto skill=id.toSkill();
    if(!skill)
     continue;
    JsonNode entry;
    entry["name"].String()=skill->getNameTranslated();
    entry["mastery"].String()=LIBRARY->generaltexth->levels[level-1];
    entry["description"].String()=skill->getDescriptionTranslated(level);
    addHeroIcon(icons, entry["icon"], "SECSKILL", skill->getIconIndex(level - 1));
    skills.push_back(std::move(entry));
   }
   if(hero->getCommander())
    addHeroIcon(icons, h["commanderIcon"], "heroWindow/commanderButtonIcon");
   if(era_compat::henchmen::enabled(*p->cb))
   {
    auto & companion=h["henchman"];
    const auto rules=era_compat::henchmen::settings(*p->cb);
    companion["reviveAnywhere"].Bool()=rules.reviveAnywhere;
    companion["returnToArmy"].Bool()=rules.returnToArmy;
    companion["replacementLossPercent"].Integer()=rules.replacementLossPercent;
    companion["revision"].Integer()=hero->henchman.revision;
    companion["bannerEnabled"].Bool()=rules.banner;
    companion["stackExperienceEnabled"].Bool()=rules.stackExperience;
    companion["bannerStyle"].Integer()=era_compat::henchmen::bannerStyle(*hero);
    companion["canEquipHeldBanner"].Bool()=rules.banner&&hero->henchman.stack
     &&era_compat::henchmen::bannerStyle(*hero)<0&&era_compat::henchmen::hasHeldBanner(*hero);
    companion["canEquipBanner"].Bool()=rules.banner&&hero->henchman.stack
     &&era_compat::henchmen::bannerStyle(*hero)<0
     &&(hero->henchman.alive||!rules.reviveAnywhere)
     &&era_compat::henchmen::availableBanner(*hero)!=ArtifactPosition::PRE_FIRST;
    companion["canReturnBanner"].Bool()=rules.banner&&hero->henchman.stack
     &&era_compat::henchmen::bannerStyle(*hero)>=0
     &&ArtifactUtils::getArtBackpackPosition(hero,era_compat::henchmen::bannerArtifact())!=ArtifactPosition::PRE_FIRST;
    for(const auto & [slot,stack]:hero->Slots())
    {
     if(!slot.validSlot())continue;
     auto candidate=creature(stack->getCreatureID().toCreature(),1);
     candidate["slot"].Integer()=slot.getNum();
     candidate["available"].Bool()=era_compat::henchmen::canSelect(*hero,slot.getNum());
     companion["candidates"].Vector().push_back(std::move(candidate));
    }
    if(hero->henchman.stack)
    {
     companion["unit"]=creature(hero->henchman.stack->getCreatureID().toCreature(),1);
     companion["alive"].Bool()=hero->henchman.alive;
     const auto growth=era_compat::henchmen::progress(*hero,p->cb->getDate(Date::DAY));
     companion["level"].Integer()=growth.level;companion["experience"].Integer()=growth.experience;
     companion["nextLevel"].Integer()=growth.nextLevel;
     companion["rank"].Integer()=hero->henchman.stack->getExpRank();
     companion["stackExperience"].Integer()=hero->henchman.stack->getAverageExperience();
     const auto extra=era_compat::henchmen::stats(*hero,p->cb->getDate(Date::DAY));
     auto & unit=companion["unit"];
     unit["attack"].Integer()+=extra.attack;unit["defense"].Integer()+=extra.defence;
     unit["damageMin"].Integer()+=extra.minimumDamage;unit["damageMax"].Integer()+=extra.maximumDamage;
     unit["health"].Integer()+=extra.health;unit["speed"].Integer()+=extra.speed;
     const auto cost=era_bridge::henchmen::resurrectionCost(era_compat::creature_prices::gold(p->cb.get(),*hero->henchman.stack->getType()),growth.level);
     companion["resurrectionCost"].Integer()=cost;
     const auto * town=hero->getVisitedTown();
     companion["canResurrect"].Bool()=!hero->henchman.alive&&(rules.reviveAnywhere||(town&&town->getOwner()==hero->getOwner()))
      &&cost>=0&&p->cb->getResource(hero->getOwner(),GameResID::GOLD)>=cost;
    }
   }
   publishHeroIcons(icons);
   const auto picked=heroWindow->getPickedArtifact();if(picked){h["picked"]["name"].String()=picked->getType()->getNameTranslated();h["picked"]["icon"].Integer()=picked->getType()->getIconIndex();artifactIconIds.insert(picked->getType()->getIconIndex());}
   auto addSlot=[&](int index,bool backpack){const auto position=ArtifactPosition(index);const auto art=era_compat::eye278LockOwner(*hero,position)?nullptr:hero->getArt(position,false);JsonNode item;item["slot"].Integer()=index;bool locked=false;for(const auto & set:heroWindow->artSets)if(set)if(auto place=set->getArtPlace(position)){locked=place->isLocked();break;}if(picked&&era_compat::canMoveIntoEye278(*hero,position,*picked))locked=false;locked=locked||hero->getSourceSlotLocks().count(position);item["locked"].Bool()=locked;item["movable"].Bool()=art&&!locked&&index!=int(ArtifactPosition::SPELLBOOK)&&index!=int(ArtifactPosition::MACH4);item["allowed"].Bool()=picked&&!locked&&picked->canBePutAt(hero,position,true);if(art){const auto type=art->getType();item["name"].String()=type->getNameTranslated();item["description"].String()=type->getDescriptionTranslated();item["icon"].Integer()=type->getIconIndex();artifactIconIds.insert(type->getIconIndex());if(!picked&&!locked&&hero->getOwner()==p->playerID&&p->makingTurn){const auto combination=mobileArtifactCombination(*hero,position);item["canAssemble"].Bool()=combination.first;item["canDisassemble"].Bool()=combination.second;}}h[backpack?"backpack":"slots"].Vector().push_back(item);};
   for(int i=0;i<19;i++)addSlot(i,false);for(size_t i=0;i<=hero->artifactsInBackpack.size();i++)addSlot(int(ArtifactPosition::BACKPACK_START)+int(i),true);
  }
  if(hero){for(const auto & slot:hero->artifactsWorn){auto artifact=slot.second.getArt();if(!artifact||(slot.second.locked&&era_compat::eye278LockOwner(*hero,slot.first)))continue;auto type=artifact->getType();JsonNode item;item["slot"].Integer()=slot.first.getNum();item["name"].String()=type->getNameTranslated();item["description"].String()=type->getDescriptionTranslated();item["icon"].Integer()=type->getIconIndex();n["equipment"].Vector().push_back(item);}n["backpackCount"].Integer()=hero->artifactsInBackpack.size();}
  int index=0;for(auto h:p->localState->getWanderingHeroes()){JsonNode item;item["name"].String()=h->getNameTranslated();item["index"].Integer()=index++;item["id"].Integer()=h->id.getNum();item["movement"].Integer()=h->movementPointsRemaining();item["movementLimit"].Integer()=h->movementPointsLimit();item["mana"].Integer()=h->mana;item["manaLimit"].Integer()=h->manaLimit();item["hasSpellbook"].Bool()=h->hasSpellbook();if(h->movementPointsRemaining()>0)n["anyHeroCanMove"].Bool()=true;n["heroes"].Vector().push_back(item);}
  index = 0;
  const bool showWeekly = mobileWeeklyRecruits && mobileEnabled &&
   (n["mode"].String() == "map" || townWindow || fortWindow);
  if(showWeekly)
   n["weeklyRecruitsReady"].Bool() = true;
  for(const auto town : p->localState->getOwnedTowns())
  {
   JsonNode item;
   item["name"].String() = town->getNameTranslated();
   item["id"].Integer() = town->id.getNum();
   item["index"].Integer() = index++;
   if(showWeekly)
    item["weeklyRecruits"] = weeklyRecruits(*town);
   n["towns"].Vector().push_back(std::move(item));
  }
  if(townWindow||fortWindow){const auto town=townWindow?townWindow->town:fortWindow->getMobileTown();n["townName"].String()=town->getNameTranslated();n["townFaction"].String()=town->getFaction()->getJsonKey();mobileTownArmies(n,town);const auto machine=town->getWarMachineInBuilding(BuildingID::BLACKSMITH);if(machine.hasValue())n["townWarMachine"]=creature(machine.toArtifact()->getWarMachine().toCreature(),1);
   const auto builder=CGMysteriousCave::canDemolish(town->getVisitingHero())?town->getVisitingHero():town->getGarrisonHero();
   if(builder&&builder->getOwner()==p->playerID&&CGMysteriousCave::canDemolish(builder)){n["caveBuilder"]=CGMysteriousCave::builderSnapshot(builder,town);n["caveBuilder"]["hero"].Integer()=builder->id.getNum();n["caveBuilder"]["canAct"].Bool()=p->makingTurn&&!n["caveBuilder"]["combatPending"].Bool();}
   for(const auto & level:town->spells){JsonNode row;row.Vector();for(const auto spell:level)row.Vector().push_back(JsonNode(double(spell.getNum())));n["townSpells"].Vector().push_back(row);}
   std::map<BuildingID, CreatureID> dwellingCreatures;
   const auto & roster = town->getTown()->creatures;
   for(size_t level = 0; level < roster.size(); ++level)
    for(size_t rank = 0; rank < roster[level].size(); ++rank)
     dwellingCreatures.emplace(BuildingID::getDwellingFromLevel(level, rank), roster[level][rank]);
   for(const auto & [id,building]:town->getTown()->buildings)
   {
    if(!building||id.getNum()<0)continue;
    JsonNode b;
    b["id"].Integer()=id.getNum();
    b["name"].String()=building->getNameTranslated();
    b["key"].String()=building->getJsonKey();
    b["baseId"].Integer()=building->getBase().getNum();
    b["upgradeId"].Integer()=building->upgrade.getNum();
    b["description"].String()=building->getDescriptionTranslated();
    b["built"].Bool()=town->hasBuilt(id);
    if(townWindow&&townWindow->builds)for(const auto & area:townWindow->builds->getMobileBuildings())
     if(area->getBuilding()&&area->getBuilding()->bid==id){b["rect"]=rect(area->pos);break;}
    if(!town->hasBuilt(id))
     if(const auto creature = dwellingCreatures.find(id); creature != dwellingCreatures.end())
     {
      b["unlocksCreature"] = recruitmentIdentity(creature->second);
      portraitIds.insert(creature->second.getNum());
     }
    const auto buildState=p->cb->canBuildStructure(town,id);
    const bool needsGrail=id==BuildingID::GRAIL&&!visitingHeroHasGrail(town);
    b["allowed"].Bool()=buildState==EBuildingState::ALLOWED&&!needsGrail;
    b["state"].Integer()=static_cast<int>(buildState);
    if(!town->hasBuilt(id) && (fortWindow || buildState == EBuildingState::PREREQUIRES || buildState == EBuildingState::MISSING_BASE))
    {
     auto & missing = b["missingPrerequisites"].Vector();
     const auto requirements = town->genBuildingRequirements(id, true);
     for(const auto prerequisite : requirements.getFulfillmentCandidates([town](BuildingID candidate){return town->hasBuilt(candidate);}))
      missing.emplace_back(double(prerequisite.getNum()));
    }
    if(id==BuildingID::GRAIL)b["needsGrail"].Bool()=needsGrail;
    for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())
     b["cost"].Vector().push_back(JsonNode(double(town->getBuildingCost(id)[resource])));
    n["buildings"].Vector().push_back(b);
   }
   if(fortWindow){
    if(const auto selected=fortWindow->getMobilePreviewCreature())n["fortSelectedId"].Integer()=selected->getId().getNum();
    for(size_t level=0;level<town->creatures.size();level++){
     const auto & available=town->creatures[level].second;
     const bool portal=level==town->getTown()->creatures.size();
     const auto portalBuilding=portal?town->getTown()->getSpecialBuilding(BuildingSubID::PORTAL_OF_SUMMONING):nullptr;
     if(portal&&(!portalBuilding||available.empty()))continue;
     if(level>town->getTown()->creatures.size())continue;
     const auto & roster=portal?available:town->getTown()->creatures[level];
     JsonNode family;family["level"].Integer()=level;family["count"].Integer()=town->creatures[level].first;
     if(portal)family["label"].String()=portalBuilding->getNameTranslated();
     for(size_t rank=0;rank<roster.size();rank++){
      const auto id=roster[rank];auto variant=creature(id.toCreature(),town->creatures[level].first);variant["rank"].Integer()=rank;variant["level"].Integer()=level;variant["built"].Bool()=std::find(available.begin(),available.end(),id)!=available.end();
      const auto bid=portal?portalBuilding->bid:BuildingID(BuildingID::getDwellingFromLevel(level,rank));
      if(town->getTown()->buildings.count(bid)){
       variant["requiredBuilding"].String()=town->getTown()->buildings.at(bid)->getNameTranslated();
       variant["requiredBuildingId"].Integer()=bid.getNum();
      }
      family["variants"].Vector().push_back(variant);
     }
     n["fortFamilies"].Vector().push_back(family);
     if(!roster.empty()){
      auto c=(!available.empty()?available.back():roster.front()).toCreature();
      auto row=creature(c,town->creatures[level].first);row["level"].Integer()=level;row["built"].Bool()=!available.empty();n["fortRows"].Vector().push_back(row);
     }
    }
   }
   for(size_t level=0;level<town->creatures.size();level++)for(size_t variant=0;variant<town->creatures[level].second.size();variant++){auto c=town->creatures[level].second[variant].toCreature();JsonNode item=creature(c,town->creatures[level].first);item["level"].Integer()=level;item["variant"].Integer()=variant;n["recruits"].Vector().push_back(item);}
  }
  if(battleWindow&&CPlayerInterface::battleInt){const auto b=CPlayerInterface::battleInt;n["battleLossEstimatesVersion"].Integer()=2;n["battleCamera"]=b->mobileCameraSnapshot();const bool targeting=b->actionsController->heroSpellcastingModeActive()||b->actionsController->creatureSpellcastingModeActive();n["spellTargeting"].Bool()=targeting;n["creatureSpellTargeting"].Bool()=b->actionsController->creatureSpellcastingModeActive();const bool tactics=b->tacticsMode||b->getBattle()->battleTacticDist()!=0;
   const bool ownsTactics=b->getBattle()->battleTacticDist()>0&&b->getBattle()->sideToPlayer(b->getBattle()->battleGetTacticsSide())==p->playerID;
   n["tacticsMode"].Bool()=tactics;n["canEndTactics"].Bool()=b->tacticsMode&&ownsTactics&&!b->openingPlaying()&&!b->hasAnimations();
   const bool autoOn=b->curInt&&b->curInt->isAutoFightOn;
   const bool manualControl=b->curInt&&!autoOn&&!b->curInt->autofightingAI;n["manualControl"].Bool()=manualControl;
   const bool canPlace=ownsTactics&&b->tacticsMode&&!b->hasAnimations();
   n["autoCombat"].Bool()=autoOn;n["canAutoCombat"].Bool()=canToggleMobileAutocombat(*b,tactics,canPlace);
   n["canQueueAutoCombat"].Bool()=server.inLobbyRoom()&&b->openingPlaying()&&manualControl&&!tactics;
   n["canRetreat"].Bool()=!tactics&&b->round>0&&b->makingTurn()&&!b->hasAnimations()&&b->getBattle()->battleCanFlee();
   n["canUseMagic"].Bool()=manualControl&&!tactics&&b->round>0&&b->makingTurn()&&!b->openingPlaying()&&!b->hasAnimations();
   const auto caster=b->currentHero();n["heroHasSpellbook"].Bool()=caster&&caster->hasSpellbook();if(caster)n["heroMana"].Integer()=caster->mana;
   if(caster)n["heroSpellPower"]=mobileHeroSpellPower(*b->getBattle(),caster);
   const auto spellProblem=caster?b->getBattle()->battleCanCastSpell(caster,spells::Mode::HERO):ESpellCastProblem::NO_HERO_TO_CAST_SPELL;
   n["heroSpellCastLimitReached"].Bool()=spellProblem==ESpellCastProblem::CASTS_PER_TURN_LIMIT;
   n["heroCanCast"].Bool()=manualControl&&!tactics&&caster&&(spellProblem==ESpellCastProblem::OK||spellProblem==ESpellCastProblem::MAGIC_IS_BLOCKED);
   n["canAct"].Bool()=manualControl&&b->makingTurn()&&!b->openingPlaying()&&!b->hasAnimations();n["round"].Integer()=b->round;n["battlePlayerAttacks"].Bool()=b->getBattle()->getBattle()->getSidePlayer(BattleSide::ATTACKER)==p->playerID;const auto active=b->stacksController->getActiveStack();if(active)n["canWait"].Bool()=!active->waitedThisTurn;n["creatureCanCast"].Bool()=!tactics&&active&&active->hasBonusOfType(BonusType::SPELLCASTER)&&active->canCast();if(active){n["activeUnit"]=creature(active->unitType(),active->getCount());n["activeUnit"]["stackId"].Integer()=active->unitId();n["activeUnit"]["nativeFlags"]["flying"].Bool()=active->hasBonusOfType(BonusType::FLYING);n["activeUnit"]["nativeFlags"]["attacksAllAdjacent"].Bool()=active->hasBonusOfType(BonusType::ATTACKS_ALL_ADJACENT);n["activeUnit"]["controlled"].Bool()=b->getBattle()->battleGetOwner(active)==p->playerID;n["activeUnit"]["commander"].Bool()=active->unitSlot()==SlotID::COMMANDER_SLOT_PLACEHOLDER;n["activeUnit"]["remainingShots"].Integer()=active->shots.available();n["activeUnit"]["canShoot"].Bool()=b->getBattle()->battleCanShoot(active);n["activeStack"].Integer()=active->unitId();const auto center=b->fieldController->hexPositionAbsolute(active->getPosition()).center();n["focus"]["x"].Integer()=center.x;n["focus"]["y"].Integer()=center.y;}
   for(const auto stack:b->getBattle()->battleGetAllStacks()){if(!stack->getPosition().isValid())continue;const bool corpse=stack->getCount()<=0;if(corpse&&(!targeting||!manualControl||!b->actionsController->canPreviewSpellTargets()||!b->actionsController->canTargetSpellHex(stack->getPosition())))continue;auto item=creature(stack->unitType(),stack->getCount());if(corpse)item["spellCorpse"].Bool()=true;mobileSpellEffects(item,*stack);item["nativeFlags"]["flying"].Bool()=stack->hasBonusOfType(BonusType::FLYING);item["nativeFlags"]["attacksAllAdjacent"].Bool()=stack->hasBonusOfType(BonusType::ATTACKS_ALL_ADJACENT);mobileStackExperience(item,stack->base);item["stackId"].Integer()=stack->unitId();item["eraSlot"].Integer()=stack->sourceMassSlot();item["armySlot"].Integer()=stack->unitSlot().getNum();item["currentHealth"].Integer()=stack->getFirstHPleft();item["maximumHealth"].Integer()=stack->getMaxHealth();item["cloned"].Bool()=stack->isClone();item["remainingCasts"].Integer()=stack->casts.available();item["remainingShots"].Integer()=stack->shots.available();item["speed"].Integer()=stack->getMovementRange();item["remainingRetaliations"].Integer()=stack->counterAttacks.available();item["attack"].Integer()=stack->getAttack(false);item["defense"].Integer()=stack->getDefense(false);item["damageMin"].Integer()=stack->getMinDamage(stack->hasBonusOfType(BonusType::SHOOTER));item["damageMax"].Integer()=stack->getMaxDamage(stack->hasBonusOfType(BonusType::SHOOTER));item["morale"].Integer()=stack->moraleVal();item["luck"].Integer()=stack->luckVal();item["magicResistance"].Integer()=stack->magicResistance();for(const auto hex:stack->getHexes())item["occupied"].Vector().push_back(JsonNode(double(hex.toInt())));const auto center=b->fieldController->hexPositionAbsolute(stack->getPosition()).center();item["x"].Integer()=center.x;item["y"].Integer()=center.y;item["enemy"].Bool()=stack->getOwner()!=p->playerID;auto countBox=b->stacksController->mobileAmountBoxBounds(stack);countBox+=b->fieldController->hexPositionAbsolute(stack->getPosition()).topLeft()-b->fieldController->hexPositionLocal(stack->getPosition()).topLeft();item["countBounds"]=rect(countBox);n["battleUnits"].Vector().push_back(item);}const auto accessibility=b->getBattle()->getAccessibility();const auto reachable=active?b->getBattle()->battleGetAvailableHexes(active,false):BattleHexArray();
   const bool previewSpellTargets=targeting&&manualControl;
   if(!targeting)if(const auto spell=b->actionsController->targetedSpell())n["creatureSpellName"].String()=spell->getNameTranslated();
   if(targeting)
   {
    if(const auto spell=b->actionsController->targetedSpell())
    {n["selectedSpell"].String()=spell->getNameTranslated();n["selectedSpellId"].Integer()=spell->id.getNum();}
   }
   for(int row=0;row<11;row++)for(int col=1;col<16;col++){const BattleHex hex(col+17*row);const auto center=b->fieldController->hexPositionAbsolute(hex).center();JsonNode cell;cell["hex"].Integer()=hex.toInt();cell["x"].Integer()=center.x;cell["y"].Integer()=center.y;cell["kind"].Integer()=int(accessibility[hex.toInt()]);if(b->siegeController){const auto part=b->getBattle()->battleHexToWallPart(hex);if(part!=EWallPart::INVALID){cell["siegeWall"].Bool()=true;cell["wallPart"].Integer()=int(part);cell["wallState"].Integer()=int(part)<0?2:int(b->getBattle()->battleGetWallState(part));}}if(active&&active->hasBonusOfType(BonusType::CATAPULT)&&b->siegeController&&b->siegeController->isAttackableByCatapult(hex)){cell["siegeTarget"].Bool()=true;}cell["reachable"].Bool()=active&&reachable.contains(hex);if(previewSpellTargets)cell["spellTarget"].Bool()=b->actionsController->canTargetSpellHex(hex);if(manualControl&&!tactics&&!targeting&&b->makingTurn()&&!b->hasAnimations())cell["actionLabel"].String()=b->actionsController->mobileActionLabel(hex,&reachable);n["battleCells"].Vector().push_back(cell);}
   // Reuse native effect simulations, including immunities, ERA rules, chained
   // target order and the acquired unit's real resurrection ceiling. No cast,
   // network command or live RNG is consumed by this preview.
   static std::string spellForecastKey;
   static JsonNode cachedSpellForecasts;
   if(previewSpellTargets&&n["canAct"].Bool()&&b->actionsController->canPreviewSpellTargets())
   {
    const auto * spell=b->actionsController->targetedSpell();
    const auto * spellCaster=b->actionsController->getCurrentSpellcaster();
    if(spell&&spellCaster)
    {
     const auto castMode=b->actionsController->getCurrentCastMode();
     const auto descriptor=std::to_string(spell->id.getNum())+":"+std::to_string(int(castMode))+":"+
      std::to_string(spellCaster->getEffectLevel(spell))+":"+std::to_string(spellCaster->getEffectPower(spell))+":"+
      std::to_string(n["battleCamera"]["sequence"].Integer())+":"+n["battleUnits"].toCompactString();
     if(descriptor!=spellForecastKey)
     {
      spellForecastKey=descriptor;cachedSpellForecasts=JsonNode();
      for(const auto & unit:n["battleUnits"].Vector())
      {
       const auto * target=b->getBattle()->battleGetStackByID(unit["stackId"].Integer(),false);
       if(!target||!b->actionsController->canTargetSpellHex(target->getPosition()))continue;
       const auto value=b->getBattle()->getSpellEffectValue(spell,spellCaster,castMode,target->getPosition(),true);
       const auto change=value->affectedUnits.find(target->unitId());
       if(change==value->affectedUnits.end())continue;
       auto & estimate=cachedSpellForecasts[std::to_string(target->unitId())];
       estimate["unitsDelta"].Integer()=change->second.unitsDelta;
       estimate["hpDelta"].Integer()=change->second.hpDelta;
       estimate["spellId"].Integer()=spell->id.getNum();
      }
     }
     for(auto & unit:n["battleUnits"].Vector())
     {
      const auto & estimate=cachedSpellForecasts[std::to_string(unit["stackId"].Integer())];
      if(!estimate.isNull())unit["spellEstimate"]=estimate;
     }
    }
   }
   else {spellForecastKey.clear();cachedSpellForecasts=JsonNode();}
   const bool forecastReady=n["canAct"].Bool()&&!tactics&&!targeting;
   const auto forecastDistances=forecastReady&&active?b->getBattle()->battleGetDistances(active,active->getPosition()):ReachabilityInfo::TDistances{};
   const auto hovered=b->fieldController->getHoveredStack();if(hovered)n["targetUnit"]=creature(hovered->unitType(),hovered->getCount());if(active)for(auto & unit:n["battleUnits"].Vector()){const BattleHex position(unit["occupied"].Vector().empty()?0:unit["occupied"].Vector()[0].Integer());unit["canShootAt"].Bool()=b->getBattle()->battleCanShoot(active,position);unit["canMeleeAt"].Bool()=std::any_of(unit["occupied"].Vector().begin(),unit["occupied"].Vector().end(),[&](const JsonNode & hex){return b->getBattle()->battleCanAttackHex(reachable,active,BattleHex(hex.Integer()));});
    if(forecastReady&&unit["enemy"].Bool())
    {
     const auto * target=b->getBattle()->battleGetStackByID(unit["stackId"].Integer());
     const auto estimate=mobileAttackLosses(*b->getBattle(),active,target,reachable,forecastDistances);
     if(!estimate.isNull())unit["attackLosses"]=estimate;
    }
   }}
 }
 publishPortraits();publishArtifactIcons();const auto text=n.toCompactString();
 if(!openTownHall&&text==lastSnapshot&&SDL_GetTicks()-lastSent<1000)return;
 auto * snapshot=static_cast<char *>(malloc(text.size()+1));if(!snapshot)return;
 memcpy(snapshot,text.c_str(),text.size()+1);lastSnapshot=text;lastSent=SDL_GetTicks();snapshotPending.store(true);
 if(openTownHall)mobileTownHall.reset();
 // Never wait for DOM handlers while holding GameEngine::interfaceMutex.
 // Keep at most one notification in flight if the browser is busy.
 MAIN_THREAD_ASYNC_EM_ASM({
  const snapshot=UTF8ToString($0);_free($0);
  try{window.dispatchEvent(new CustomEvent('goonk-state',{detail:JSON.parse(snapshot)}));}
  finally{Module._vcmiMobileStateAck();}
 },snapshot);
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileStateAck(){snapshotPending.store(false);}
const std::vector<int3> & mobileExchangeMarkers(){return exchangeMarkerTiles;}
bool isMobilePresentationActive(){return mobileEnabled;}
bool requestMobileTownHall(int townId)
{
 if(!mobileEnabled)return false;
 mobileTownHall=townId;
 lastPublished=0;
 return true;
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePreviewMap(const char * requested)
{
 if(!ENGINE||!requested)return;
 const std::string name(requested);
 ENGINE->dispatchMainThread([name](){
  try{
   CMapService service;auto map=service.loadMap(ResourcePath(name,EResType::MAP),nullptr);
   const int size=128,levels=map->levels(),bytes=size*size*4;
   auto pixels=static_cast<uint8_t *>(malloc(bytes*levels));auto key=strdup(name.c_str());
   if(!pixels||!key){free(pixels);free(key);return;}
   for(int level=0;level<levels;++level)for(int y=0;y<size;++y)for(int x=0;x<size;++x){
    const auto & tile=map->getTile(int3(x*map->width/size,y*map->height/size,level));
    const auto color=tile.blocked()&&!tile.visitable()?tile.getTerrain()->minimapBlocked:tile.getTerrain()->minimapUnblocked;
    auto at=pixels+level*bytes+(y*size+x)*4;at[0]=color.r;at[1]=color.g;at[2]=color.b;at[3]=255;
   }
   MAIN_THREAD_ASYNC_EM_ASM({const images=[];for(let z=0;z<$2;z++){const c=document.createElement('canvas');c.width=c.height=$1;const bytes=$1*$1*4;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(HEAPU8.slice($0+z*bytes,$0+(z+1)*bytes)),$1,$1),0,0);images.push(c.toDataURL());}const key=UTF8ToString($3);_free($0);_free($3);window.dispatchEvent(new CustomEvent('goonk-map-preview',{detail:{key,images}}));},pixels,size,levels,key);
  }catch(const std::exception &){auto key=strdup(name.c_str());if(key)MAIN_THREAD_ASYNC_EM_ASM({const key=UTF8ToString($0);_free($0);window.dispatchEvent(new CustomEvent('goonk-map-preview',{detail:{key,images:[]}}));},key);}
 });
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileEnable(int enabled){if(ENGINE)ENGINE->dispatchMainThread([enabled](){mobileEnabled=enabled==1;stateEnabled=enabled!=0;lastPublished=0;});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePointer(int x,int y,int action)
{
 if(!ENGINE)return;
 ENGINE->dispatchMainThread([x,y,action](){
  const Point point(x,y);
  if(action==5){
   // The minimap moves the camera locally, even when adventure orders are locked.
   if(GAME&&GAME->interface())if(const auto map=ENGINE->windows().topWindow<AdventureMapInterface>())
    if(const auto mini=map->getMobileMinimap();mini&&mini->pos.isInside(point))
     mini->moveAdvMapSelection(point);
   return;
  }
  if(action==4&&(!GAME||!GAME->interface()||!GAME->interface()->makingTurn||!ENGINE->windows().topWindow<AdventureMapInterface>()))return;
  ENGINE->events().dispatchMouseMoved(Point(0,0),point);
  if(action==1||action==4){
   if(GAME&&GAME->interface()&&GAME->interface()->makingTurn&&!CPlayerInterface::battleInt&&ENGINE->windows().topWindow<AdventureMapInterface>())
    GAME->interface()->cb->refreshConfluxTome(GAME->interface()->localState->getCurrentHero());
   ENGINE->events().dispatchMouseLeftButtonPressed(point,4);
   ENGINE->events().dispatchMouseLeftButtonReleased(point,4);
  }
  if(action==2)ENGINE->events().dispatchShowPopup(point,4);
  if(action==3)ENGINE->events().dispatchClosePopup(point);
 });
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePan(int dx,int dy){if(ENGINE)ENGINE->dispatchMainThread([dx,dy](){Point p(300,260),distance(dx,dy);ENGINE->events().dispatchGesturePanningStarted(p);ENGINE->events().dispatchGesturePanning(p,p+distance,distance);ENGINE->events().dispatchGesturePanningEnded(p,p+distance);});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiOnlineLogin(const char * name, int length)
{
 if(!ENGINE||!name||length<0||length>80)return;
 const std::string text(name,length);
 if(std::any_of(text.begin(),text.end(),[](unsigned char c){return c<32||c==127||c=='{'||c=='}';}))return;
 ENGINE->dispatchMainThread([text](){
  if(auto window=ENGINE->windows().topWindow<GlobalLobbyLoginWindow>())window->loginFromWeb(text);
 });
}

extern "C" void EMSCRIPTEN_KEEPALIVE vcmiJoinHostedMatch()
{
 if(!ENGINE||!GAME)return;
 ENGINE->dispatchMainThread([](){
  auto & server=GAME->server();
  if(!server.canJoinHostedMatch())return;
  server.resetStateForLobby(EStartMode::LOAD_GAME,ESelectionScreen::loadGame,EServerMode::HOSTED_GUEST,{});
  // The WebSocket URL and subprotocol are configured by the page. A numeric
  // address avoids DNS resolution in the browser socket shim.
  server.connectToServer("127.0.0.1",3030);
 });
}

extern "C" void EMSCRIPTEN_KEEPALIVE vcmiOnlineRoomAction(int action, const char * id, int length)
{
 if(!ENGINE||!id||length<1||length>128)return;
 const std::string key(id,length);
 ENGINE->dispatchMainThread([action,key](){
  auto & server=GAME->server();
  auto & lobby=server.getGlobalLobby();
  if(action==0)
  {
   auto window=ENGINE->windows().topWindow<GlobalLobbyWindow>();
   if(!window||server.inGame())return;
   const auto & rooms=lobby.getActiveRooms();
   const auto room=std::find_if(rooms.begin(),rooms.end(),[&](const auto & entry){return entry.gameRoomID==key;});
   if(room!=rooms.end()&&(room->statusID=="public"||(room->statusID=="private"&&lobby.isInvitedToRoom(key))))
    ENGINE->windows().createAndPushWindow<GlobalLobbyRoomWindow>(window.get(),key);
  }
  if(action==1&&ENGINE->windows().topWindow<CLobbyScreen>()&&server.inLobbyRoom()&&server.isHost())
  {
   const auto & accounts=lobby.getActiveAccounts();
   const auto account=std::find_if(accounts.begin(),accounts.end(),[&](const auto & entry){return entry.accountID==key;});
   if(account==accounts.end()||key==lobby.getAccountID())return;
   JsonNode message;
   message["type"].String()="sendInvite";
   message["accountID"].String()=key;
   lobby.sendMessage(message);
  }
  lastPublished=0;
 });
}

extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCampaignDraft(int query,int selection,const char * input)
{
 if(!ENGINE||!input)return;const std::string answer(input);if(answer.size()>2048)return;
 ENGINE->dispatchMainThread([query,selection,answer](){
  if(!GAME||!GAME->interface())return;
  if(const auto window=ENGINE->windows().topWindow<CSourceCampaignDialog>();window&&window->ID.getNum()==query)window->draft(selection,answer);
 });
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCampaignReply(int query,int selection,const char * input)
{
 if(!ENGINE||!input)return;const std::string answer(input);if(answer.size()>2048)return;
 ENGINE->dispatchMainThread([query,selection,answer](){
  if(const auto window=ENGINE->windows().topWindow<CHighScoreInputScreen>())
  {
   if(window->mobilePresentation()["queryId"].Integer()==query)window->submitMobileScore(answer,selection>=0);
   lastPublished=0;return;
  }
  if(!GAME||!GAME->interface())return;
  if(const auto window=ENGINE->windows().topWindow<CSourceCampaignDialog>();window&&window->ID.getNum()==query)
   window->submit(selection,answer);
  lastPublished=0;
 });
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCommand(int action,int a,int b,int c,int d,int e){if(!ENGINE)return;ENGINE->dispatchMainThread([action,a,b,c,d,e](){
 if(action==111)
 {
  const auto player=GAME?GAME->interface():nullptr;const auto window=ENGINE->windows().topWindow<CHeroWindow>();
  if(mobileArtifactCombinationPending||!player||!player->makingTurn||!window||!window->curHero||window->curHero->id.getNum()!=a
   ||window->curHero->getOwner()!=player->playerID||window->getPickedArtifact()||b<0
   ||b>=int(ArtifactPosition::BACKPACK_START)+int(window->curHero->artifactsInBackpack.size()))return;
  const ArtifactPosition position(b);const auto available=mobileArtifactCombination(*window->curHero,position);
  if(c==0&&available.first)mobileArtifactCombinationPending=player->artifactController->askToAssemble(window->curHero,position);
  if(c==1&&available.second)mobileArtifactCombinationPending=player->artifactController->askToDisassemble(window->curHero,position);
  lastPublished=0;return;
 }
 if(action==109)
 {
  if(!GAME)return;
  auto & server=GAME->server();
  if(ENGINE->windows().topWindow<CLobbyScreen>()&&!server.inLobbyRoom()&&server.si
     &&server.getState()==EClientState::LOBBY&&server.screenType==ESelectionScreen::newGame
     &&a>=0&&a<int(server.si->extraOptionsInfo.wogOptions.size())&&b>=-1&&b<=1)
  {
   auto options=server.si->extraOptionsInfo;
   options.wogOptions[a]=static_cast<int8_t>(b);
   server.setExtraOptionsInfo(options);
  }
  return;
 }
 if(action>=98&&action<=100)
 {
  const auto player=GAME?GAME->interface():nullptr;
  if(!player||!player->makingTurn)return;
  if(const auto window=ENGINE->windows().topWindow<CSelWindow>();window&&window->ID.getNum()==b&&window->components)
  {
   if(action==98)window->components->selectMobileIndex(a);
   if(action==99&&window->components->selectedIndex()==a)window->madeChoiceAndClose();
   if(action==100&&window->buttons.size()>1){player->cb->selectionMade(0,window->ID);window->close();}
  }
  lastPublished=0;return;
 }
 if(action==96){const auto player=GAME?GAME->interface():nullptr;if(player&&player->makingTurn)if(const auto window=ENGINE->windows().topWindow<CStackWindow>())window->selectMobileCommanderSkill(a);lastPublished=0;return;}
 if(action==95){if(a&&!mobileVerticalBattle)++mobileVerticalGeneration;mobileVerticalBattle=a!=0;lastPublished=0;return;}
 if(action==0){deferredMapAction.reset();ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});return;}if(action==1){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});return;}
 // A dedicated cancel operation cannot also accept a dialog or close the town
 // below it. Ignore delayed taps once the taverne is no longer on top.
 // Spellbooks in tavern equipment previews are inspectable without hiring.
 if(action==62&&a==int(ArtifactPosition::SPELLBOOK))
 {
  const auto player=GAME->interface();const auto window=ENGINE->windows().topWindow<CHeroWindow>();
  if(player&&window&&window->curHero&&window->curHero->getOwner()!=player->playerID
     &&window->curHero->hasSpellbook()&&!window->getPickedArtifact())
  {
   ENGINE->windows().createAndPushWindow<CSpellWindow>(window->curHero,player,true);
   lastPublished=0;return;
  }
 }
 if(action==62||action==63||action==64){if(auto window=ENGINE->windows().topWindow<CHeroWindow>()){if(action==63)window->close();else if(action==64){for(const auto & set:window->artSets)if(set)set->putBackPickedArtifact();}else if(window->curHero&&GAME->interface()&&window->curHero->getOwner()==GAME->interface()->playerID&&a>=0&&a<=int(ArtifactPosition::BACKPACK_START)+int(window->curHero->artifactsInBackpack.size())){GAME->interface()->cb->refreshConfluxTome(window->curHero);window->clickPressedOnArtPlace(window->curHero,ArtifactPosition(a),true,false,false,window->pos.center());}lastPublished=0;}return;}
 if(action==88)
 {
  mobileWeeklyRecruits = mobileEnabled && a != 0;
  lastPublished = 0;
  return;
 }
 if(action==87)
 {
  if(const auto map=ENGINE->windows().topWindow<AdventureMapInterface>();map&&map->isWorldView())
  {
   shortcut(EShortcut::ADVENTURE_EXIT_WORLD_VIEW);
   lastPublished=0;
  }
  return;
 }
 if(action==85)
 {
  const auto player=GAME->interface();
  const auto window=ENGINE->windows().topWindow<CHeroWindow>();
  if(player && window && window->curHero
     && window->curHero->getCommander() && !window->getPickedArtifact())
  {
   window->commanderWindow();
   lastPublished=0;
  }
  return;
 }
 // ERA extensions use their own range; 113/114 belong to army dismissal
 // and battle inspection, including when the mithril module is disabled.
 if(action==1201){mobileMithrilPanel=a!=0;lastPublished=0;return;}
 if(action==1200)
 {
  const auto player=GAME->interface();
  if(player&&player->makingTurn&&ENGINE->windows().topWindow<AdventureMapInterface>()
   &&era_compat::mithril::enabled(*player->cb))player->cb->mithrilAction(ObjectInstanceID(a),b,static_cast<uint32_t>(c));
  lastPublished=0;return;
 }
 if(action==112)
 {
  const auto player=GAME->interface();
  const auto window=ENGINE->windows().topWindow<CHeroWindow>();
  if(player&&player->makingTurn&&window&&window->curHero&&window->curHero->id.getNum()==a
   &&window->curHero->henchman.revision==static_cast<uint32_t>(e)
   &&(!window->getPickedArtifact()||(b==HenchmanAction::EQUIP_HELD_BANNER
    &&window->getHeroPickedArtifact()==window->curHero&&era_compat::henchmen::hasHeldBanner(*window->curHero)))
   &&(b!=HenchmanAction::SELECT||(c>=0&&c<7&&window->curHero->hasStackAtSlot(SlotID(c))
    &&window->curHero->getStack(SlotID(c)).getId().getNum()==d)))player->cb->henchmanAction(window->curHero,b,c);
  lastPublished=0;return;
 }
 if(action==40){if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>())tavern->close();lastPublished=0;return;}
 if(action==86)
 {
  if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>())
  {
   const auto portrait=a==0?tavern->h1:a==1?tavern->h2:nullptr;
   if(portrait&&portrait->h&&portrait->h->getHeroTypeID().getNum()==b)
   {
    tavern->selected=a;
    tavern->updateRecruitAvailability();
    tavern->recruitb();
   }
  }
  lastPublished=0;
  return;
 }
 if(action==72)
 {
  if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>())
  {
   const auto portrait=a==0?tavern->h1:a==1?tavern->h2:nullptr;
   if(portrait&&portrait->h)
   {
    tavern->selected=a;
    ENGINE->windows().createAndPushWindow<CHeroWindow>(portrait->h);
   }
  }
  lastPublished=0;
  return;
 }
 // Closing a presentation only needs the window manager. It must also work
 // while player callbacks are temporarily unavailable during a transition.
 if(action==75)
 {
  if(GAME&&!GAME->interface()&&!ENGINE->windows().topWindow<GlobalLobbyLoginWindow>()&&!ENGINE->windows().topWindow<GlobalLobbyWindow>())
   GAME->server().getGlobalLobby().activateInterface();
  return;
 }
 if(action==82)
 {
  if(auto setup=ENGINE->windows().topWindow<GlobalLobbyServerSetup>())setup->createFromWeb(a,b!=0,c!=0);
  lastPublished=0;
  return;
 }
 if(action==83)
 {
  if(auto preview=ENGINE->windows().topWindow<GlobalLobbyRoomWindow>())preview->joinFromWeb();
  lastPublished=0;
  return;
 }
 if(action==81)
 {
  if(auto window=ENGINE->windows().topWindow<GlobalLobbyWindow>())
   if(!GAME->server().inGame())
    window->doCreateGameRoom();
  return;
 }
 if(action==78)
 {
  if(auto window=ENGINE->windows().topWindow<GlobalLobbyWindow>())
   if(const auto room=mobileInvitedRoom(GAME->server().getGlobalLobby()))
    ENGINE->windows().createAndPushWindow<GlobalLobbyRoomWindow>(window.get(),room->gameRoomID);
  return;
 }
 if(action==80)
 {
  auto & server=GAME->server();
  const ResourcePath save("SAVES/GOONK-ONLINE-AUTO",EResType::SAVEGAME);
  if(ENGINE->windows().topWindow<CLobbyScreen>()&&server.inLobbyRoom()&&server.isHost()&&server.getState()==EClientState::LOBBY&&server.screenType==ESelectionScreen::loadGame&&CResourceHandler::get()->existsResource(save))
  {
   try
   {
    auto info=std::make_shared<CMapInfo>();
    info->saveInit(save);
    server.setMapInfo(info);
   }
   catch(const std::exception & error)
   {
    CInfoWindow::showInfoDialog(error.what(),{});
   }
  }
  return;
 }
 if(action==97)
 {
  const auto & server=GAME->server();
  if(ENGINE->windows().topWindow<CLobbyScreen>()&&server.inLobbyRoom()&&server.isHost()&&server.getState()==EClientState::LOBBY&&server.screenType==ESelectionScreen::newGame&&(a==0||a==1)&&server.si)
  {
   auto options=server.si->extraOptionsInfo;
   options.cheatsAllowed=a!=0;
   server.setExtraOptionsInfo(options);
  }
  lastPublished=0;return;
 }
 if(action==79)
 {
  const auto & server=GAME->server();
  if(ENGINE->windows().topWindow<CLobbyScreen>()&&server.inLobbyRoom()&&server.isHost()&&server.getState()==EClientState::LOBBY&&server.screenType==ESelectionScreen::newGame&&server.mi&&a>=0&&a<=10)
  {
   TurnTimerInfo timer;
   timer.turnTimer=a*60000;
   server.setTurnTimerInfo(timer);
  }
  return;
 }
 if(action==77)
 {
  if(GAME&&ENGINE->windows().topWindow<CLobbyScreen>()&&GAME->server().inLobbyRoom()&&GAME->server().isHost()&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().screenType==ESelectionScreen::newGame)
  {
   auto map=std::make_shared<CMapInfo>();
   map->mapInit("MAPS/002-Goonks-Online");
   GAME->server().setMapInfo(map);
  }
  return;
 }
 if(action==84)
 {
  auto & server=GAME->server();
  if(ENGINE->windows().topWindow<CLobbyScreen>()&&server.inLobbyRoom()&&server.isHost()&&
     server.getState()==EClientState::LOBBY&&server.screenType==ESelectionScreen::newGame&&a>=0&&a<int(mobileMaps.size()))
  {
   const auto room=mobileCurrentRoom(server.getGlobalLobby());
   const auto & chosen=mobileMaps[a];
   if(room&&room->playerLimit>=2&&!chosen.battleOnly&&chosen.humanSeats>=room->playerLimit)
   {
    auto map=std::make_shared<CMapInfo>();
    map->mapInit(chosen.file);
    server.setMapInfo(map);
   }
  }
  return;
 }
 if(action==76)
 {
  if(auto window=ENGINE->windows().topWindow<GlobalLobbyLoginWindow>())
   if(!window->webLoginPending())window->close();
  return;
 }
 if(action==74)
 {
  if(auto window=ENGINE->windows().topWindow<CMarketWindow>())window->close();
  lastPublished=0;
  return;
 }
 if(action==73)
 {
  const auto market=mobileResourceMarket();
  const auto player=GAME?GAME->interface():nullptr;
  if(!market||!player||!player->makingTurn||c<=0)return;
  const auto & resources=LIBRARY->resourceTypeHandler->getAllObjects();
  const GameResID from(a),to(b);
  if(!vstd::contains(resources,from)||!vstd::contains(resources,to))return;
  int give=0,receive=0;
  if(!mobileMarketQuote(*market,from,to,give,receive)||give!=d||receive!=e)return;
  if(c>player->cb->getResourceAmount(from)/give)return;
  if(c>std::numeric_limits<int>::max()/std::max(give,receive))return;
  player->cb->trade(market->market->getObjInstanceID(),EMarketMode::RESOURCE_RESOURCE,from,to,c*give,market->hero);
  return;
 }
 if(action==43){
  const auto stackWindow=ENGINE->windows().topWindow<CStackWindow>();
  if(stackWindow&&!stackWindow->isCommanderLevelUp())std::static_pointer_cast<CWindowObject>(stackWindow)->close();
  if(const auto fort=ENGINE->windows().topWindow<CFortScreen>();!stackWindow&&fort)std::static_pointer_cast<CWindowObject>(fort)->close();
  lastPublished=0;return;
 }
 if(action==28){
  const bool mute=a!=0;const auto sound=ENGINE->sound().getVolume(),music=ENGINE->music().getVolume();
  if(mute&&!audioMuted){previousSoundVolume=sound;previousMusicVolume=music;}
  if(!mute&&(audioMuted||(sound==0&&music==0))){
   auto restoredSound=previousSoundVolume,restoredMusic=previousMusicVolume;
   if(!audioMuted||(!restoredSound&&!restoredMusic)){
    restoredSound=std::clamp<si64>(settings["general"]["sound"].Integer(),0,100);
    restoredMusic=std::clamp<si64>(settings["general"]["music"].Integer(),0,100);
    if(!restoredSound&&!restoredMusic)restoredSound=restoredMusic=75;
   }
   ENGINE->sound().setVolume(restoredSound);ENGINE->music().setVolume(restoredMusic);
  }
  audioMuted=mute;if(mute){ENGINE->sound().setVolume(0);ENGINE->music().setVolume(0);}
  if(!mute&&b==1)ENGINE->sound().playSound(soundBase::button);
  lastPublished=0;return;
 }
 if(action==46){
  if((a!=200&&a!=150&&a!=100&&a!=50&&a!=25&&a!=0)||(b!=0&&b!=1))return;
  {Settings adventure=settings.write["adventure"];adventure["heroMoveTime"].Float()=a;adventure["enemyMoveTime"].Float()=b?-1:a;}
  lastPublished=0;return;
 }
 if(auto spell=ENGINE->windows().topWindow<CSpellWindow>()){
  if(action==70){if(!CPlayerInterface::battleInt&&(a==0||a==1)){if(a)spell->fbattleSpellsb();else spell->fadvSpellsb();}lastPublished=0;return;}
  if(action==49){const auto activeBattle=CPlayerInterface::battleInt;if(activeBattle&&(!activeBattle->curInt||activeBattle->curInt->isAutoFightOn||activeBattle->curInt->autofightingAI))return;spell->mobileSelectSpell(a);lastPublished=0;return;}
  if(action==50){if(a<0)spell->fLcornerb();else spell->fRcornerb();lastPublished=0;return;}
  if(action==51){const std::array<SpellSchool,5> schools={SpellSchool::ANY,SpellSchool::AIR,SpellSchool::EARTH,SpellSchool::FIRE,SpellSchool::WATER};if(a>=0&&a<5)spell->selectSchool(schools[a]);lastPublished=0;return;}
 }
 if(action==1210 && GAME && GAME->server().getState()==EClientState::LOBBY)
 {
  auto & server=GAME->server();
  const PlayerColor color(a);
  if(server.si && server.mi && server.isHost() && !server.inLobbyRoom()
   && server.screenType==ESelectionScreen::newGame && server.si->playerInfos.count(color)
   && (b==100 || b==85 || b==70))
  {
   auto handicap=server.si->playerInfos.at(color).handicap;
   handicap.percentIncome=b;
   server.setPlayerHandicap(color,handicap);
  }
  lastPublished=0;return;
 }
 if(action==57&&GAME&&GAME->server().getState()==EClientState::LOBBY){auto & server=GAME->server();PlayerColor color(a);if(server.si->playerInfos.count(color)&&(b==-1||server.getPlayerInfo(color).allowedFactions.count(FactionID(b))))server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,b,color);lastPublished=0;return;}
 if((action==20||action==23||action==47)&&GAME&&(ENGINE->windows().topWindow<CSimpleJoinScreen>()||ENGINE->windows().topWindow<CLobbyScreen>()||ENGINE->windows().topWindow<CBonusSelection>()||ENGINE->windows().topWindow<CInfoWindow>()||GAME->server().getState()==EClientState::CONNECTING))return;
 if(action>=65&&action<=69){
  if(action==68){if(auto video=ENGINE->windows().topWindow<CPrologEpilogVideo>())video->clickPressed(ENGINE->getCursorPosition());else if(auto video=ENGINE->windows().topWindow<VideoWindow>())video->clickPressed(ENGINE->getCursorPosition());lastPublished=0;return;}
  if(auto selection=ENGINE->windows().topWindow<CBonusSelection>()){
   const auto campaign=selection->getCampaign();
   if(action==65&&campaign->allScenarios().count(CampaignScenarioID(a))&&campaign->isAvailable(CampaignScenarioID(a)))GAME->server().setCampaignMap(CampaignScenarioID(a));
   if(action==66&&selection->groupBonuses->buttons.count(a))GAME->server().setCampaignBonus(a);
   if(action==67&&selection->buttonStart->isActive()&&!selection->buttonStart->isBlocked())selection->startMap();
   if(action==69&&campaign->playerSelectedDifficulty()&&a>=0&&a<=4&&GAME->server().getState()!=EClientState::GAMEPLAY)GAME->server().setDifficulty(a);
  }lastPublished=0;return;
 }
 if(action==47){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::campaignList,true,{"Goonk"},ELoadMode::NONE,false);return;}
 if(action==52){if(auto lobby=ENGINE->windows().topWindow<CLobbyScreen>())if(GAME->server().screenType==ESelectionScreen::campaignList&&a>=0&&a<int(mobileCampaigns.size())){GAME->server().setCampaignState(CampaignHandler::getCampaign(mobileCampaigns[a].first));}return;}
 if(action==48){if(auto lobby=ENGINE->windows().topWindow<CLobbyScreen>())if(lobby->tabRand&&GAME->server().getState()==EClientState::LOBBY&&a>=2&&a<=8&&b>=1&&b<=a&&(c==36||c==72||c==108||c==144)){
 auto options=std::make_shared<CMapGenOptions>();options->setWidth(c);options->setHeight(c);options->setLevels(d?2:1);options->setHumanOrCpuPlayerCount(b);options->setCompOnlyPlayerCount(a-b);options->setTeamCount(0);options->setCompOnlyTeamCount(0);for(int i=0;i<b;i++)options->setPlayerTypeForStandardPlayer(PlayerColor(i),EPlayerType::HUMAN);if(e>=0&&GAME->server().getPlayerInfo(PlayerColor(0)).allowedFactions.count(FactionID(e)))options->setStartingTownForPlayer(PlayerColor(0),FactionID(e));lobby->tabRand->setMapGenOptions(options);lobby->tabRand->updateMapInfoByHost();lastPublished=0;}return;}
 if(action==71)
 {
  if(GAME&&GAME->interface()&&GAME->server().getState()==EClientState::GAMEPLAY)
  {
   GAME->server().endGameplay();
   pendingDefaultMap.clear();
   if(auto mainMenu=GAME->mainmenu())
    mainMenu->menu->switchToTab("main");
   lastPublished=0;
  }
  return;
 }
 if(action==20){if(GAME&&!GAME->interface()){std::vector<std::string> names;for(int i=0;i<std::clamp(a,1,8);i++)names.push_back("Player "+std::to_string(i+1));CMainMenu::openLobby(ESelectionScreen::newGame,true,names,ELoadMode::NONE,false);}return;}
 if(action==21){if(GAME&&GAME->server().getState()==EClientState::LOBBY){auto info=std::make_shared<CMapInfo>();info->mapInit("MAPS/001-Goonks");pendingDefaultMap="Goonks";GAME->server().setMapInfo(info);}return;}
 if(action==22){if(GAME&&GAME->server().getState()==EClientState::LOBBY){auto & server=GAME->server();restoreMobileLocalSaveRoles(server,mobileLocalSaveSelection?mobileLocalSaveSelection.get():server.mi.get());server.sendStartGame();}return;}
 if(action==24){if(GAME&&!GAME->server().inLobbyRoom()&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<int(mobileMaps.size())){auto info=std::make_shared<CMapInfo>();info->mapInit(mobileMaps[a].file);pendingDefaultMap=info->getNameForList()=="Goonks"?"Goonks":"";GAME->server().setMapInfo(info);}return;}
 if(action==25){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<=4)GAME->server().setDifficulty(a);return;}
 if(action==37){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().mi){auto & server=GAME->server();const auto color=server.myFirstColor();if(server.si->playerInfos.count(color)&&(server.getPlayerInfo(color).allowedFactions.count(FactionID(a))||(a==-1&&server.getPlayerInfo(color).isFactionRandom)))server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,a,color);}return;}
 if(action==27){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().screenType==ESelectionScreen::loadGame&&a>=0&&a<int(mobileSaves.size())){auto info=std::make_shared<CMapInfo>();info->saveInit(ResourcePath(mobileSaves[a].file,EResType::SAVEGAME));auto & server=GAME->server();mobileLocalSaveSelection=info;server.setMapInfo(info);restoreMobileLocalSaveRoles(server,info.get());}return;}
 if(action==23){if(GAME&&!GAME->interface()){mobileLocalSaveSelection.reset();CMainMenu::openLobby(ESelectionScreen::loadGame,true,{"Goonk"},ELoadMode::SINGLE,false);}return;}
 auto p=GAME?GAME->interface():nullptr;if(!p||!p->cb||!p->localState)return;
 const auto hero=p->localState->getCurrentHero();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battle= CPlayerInterface::battleInt;
 // Quote first, then validate the exact same full evolution path before spending.
 if(action==121||action==122){
  if(!p->makingTurn||battle||mobileArmyUpgradeRun)return;
  if(!townWindow&&!ENGINE->windows().topWindow<AdventureMapInterface>()&&!ENGINE->windows().topWindow<CHeroWindow>())return;
  const auto object=dynamic_cast<const CArmedInstance *>(p->cb->getObj(ObjectInstanceID(a)));
  if(!object||object->getOwner()!=p->playerID)return;
  auto plan=mobilePlanArmyUpgrades(p,object);mobileArmyUpgradeQuote=plan.view;mobileArmyUpgradeQuote["status"].String()="ready";
  if(action==121){mobileArmyUpgradeOperation=JsonNode();lastPublished=0;return;}
  if(plan.hash!=b){mobileArmyUpgradeQuote["status"].String()="changed";lastPublished=0;return;}
  if(plan.steps.empty()||!p->cb->getResourceAmount().canAfford(plan.cost)){mobileArmyUpgradeQuote["status"].String()="unavailable";lastPublished=0;return;}
  mobileArmyUpgradeOperation=JsonNode();mobileArmyUpgradeOperation["armyId"].Integer()=a;mobileArmyUpgradeOperation["hash"].Integer()=b;mobileArmyUpgradeOperation["status"].String()="running";mobileArmyUpgradeOperation["completedSteps"].Integer()=0;mobileArmyUpgradeOperation["totalSteps"].Integer()=plan.steps.size();
  mobileArmyUpgradeNext=0;mobileArmyUpgradeWaiting=false;mobileArmyUpgradeRun=std::move(plan);lastPublished=0;return;
 }
 // Match the adventure UI's animation lock. Hiding the map during a fade or
 // movement can strand the client thread waiting for that animation to finish.
 if((action==5||action==55||action==3||action==7)&&ENGINE->windows().topWindow<AdventureMapInterface>()&&
    (!mapReadySince||SDL_GetTicks()-mapReadySince<100||p->mobileHeroMoving()||GAME->map().hasOngoingAnimations())){
  deferredMapAction=std::array<int,6>{action,a,b,c,d,e};return;
 }

 if(action==54&&townWindow&&(p->makingTurn||townWindow->town->getOwner()==p->playerID)){ENGINE->windows().createAndPushWindow<CFortScreen>(townWindow->town);lastPublished=0;return;}
 // Family gallery actions stay in the fort; the server remains authoritative
 // for ownership, stock, resources and available army slots.
 if((action==60||action==61)&&ENGINE->windows().topWindow<CFortScreen>()){
  const auto fort=ENGINE->windows().topWindow<CFortScreen>();const auto town=fort->getMobileTown();
  if(town->getOwner()!=p->playerID||a<0||a>=int(town->creatures.size())||a>int(town->getTown()->creatures.size()))return;
  const bool portal=a==int(town->getTown()->creatures.size());
  if(portal&&!town->getTown()->getSpecialBuilding(BuildingSubID::PORTAL_OF_SUMMONING))return;
  const CreatureID id(b);const auto & roster=portal?town->creatures[a].second:town->getTown()->creatures[a];if(std::find(roster.begin(),roster.end(),id)==roster.end())return;
  if(action==60)fort->mobileSelectCreature(id.toCreature());
  else if(p->makingTurn&&c>0){
   const auto & row=town->creatures[a];if(row.first<=0||std::find(row.second.begin(),row.second.end(),id)==row.second.end())return;
   const auto destination=town->getUpperArmy();
   if(!destination->getSlotFor(id).validSlot()&&id.toCreature()->warMachine==ArtifactID::NONE){p->showInfoDialog(LIBRARY->generaltexth->allTexts[17]);return;}
   p->cb->recruitCreatures(town,destination,id,std::min(c,int(row.first)),a);
  }
  lastPublished=0;return;
 }
 if(action==113)
 {
  if(!p->makingTurn||battle||b<0||b>=7)return;
  const auto owner=dynamic_cast<const CArmedInstance *>(p->cb->getObj(ObjectInstanceID(a)));
  // Only visible army contexts are actionable, including a hero sheet. Check
  // identity/count again so a stale confirmation cannot dismiss a replacement.
  const auto sheet=ENGINE->windows().topWindow<CHeroWindow>();
  const auto exchangeWindow=ENGINE->windows().topWindow<CExchangeWindow>();
  const auto garrisonWindow=ENGINE->windows().topWindow<CGarrisonWindow>();
  const auto town=townWindow?townWindow->town:ENGINE->windows().topWindow<AdventureMapInterface>()?mobileResidentTown(hero):nullptr;
  const bool inExchange=exchangeWindow&&(exchangeWindow->getExchangeHero(0)==owner||exchangeWindow->getExchangeHero(1)==owner);
  const bool inGarrison=garrisonWindow&&(mobileCampaignExchange(*p,garrisonWindow.get())||mobileGarrisonExchange(*p,garrisonWindow.get())||mobileCampaignRewardExchange(*p,garrisonWindow.get())||mobileJoiningExchange(*p,garrisonWindow.get()))&&(garrisonWindow->getMobileArmy(0)==owner||garrisonWindow->getMobileArmy(1)==owner);
  const auto * garrison=dynamic_cast<const CGGarrison *>(owner);
  const bool visible=owner&&(!garrison||garrison->removableUnits)&&((sheet&&sheet->curHero==owner)||(town&&(town->getUpperArmy()==owner||town->getVisitingHero()==owner))||inExchange||inGarrison||(!town&&ENGINE->windows().topWindow<AdventureMapInterface>()&&hero==owner));
  if(!visible||owner->getOwner()!=p->playerID||!owner->hasStackAtSlot(SlotID(b))||(owner->needsLastStack()&&owner->stacksCount()<2))return;
  const auto & stack=owner->getStack(SlotID(b));
  if(stack.getId().getNum()!=c||stack.getCount()!=d||era_bridge::sourceCreatureIdForLevel(stack.getCreature()->getJsonKey()).value_or(-1)==340)return;
  p->cb->dismissCreature(owner,SlotID(b));lastPublished=0;return;
 }
 if(action==110)
 {
  const auto window=ENGINE->windows().topWindow<CHeroWindow>();const auto owner=window?window->curHero:nullptr;
  if(!owner||owner->id.getNum()!=a||owner->getOwner()!=p->playerID||!p->makingTurn||battle||window->getPickedArtifact()||b<0||b>=7||d<0||d>=8||(e!=0&&e!=1)||!owner->hasStackAtSlot(SlotID(b)))return;
  const auto offset=era_campaign_deployment_rule::directions[d];
  p->cb->sourceCampaignDeployTroops(owner,SlotID(b),c,owner->visitablePos()+int3(offset[0],offset[1],0),e!=0);lastPublished=0;return;
 }
 if(action==103)
 {
  if(!townWindow||!p->makingTurn||battle||townWindow->town->id.getNum()!=b)return;
  const auto builder=CGMysteriousCave::canDemolish(townWindow->town->getVisitingHero())?townWindow->town->getVisitingHero():townWindow->town->getGarrisonHero();
  if(!builder||builder->id.getNum()!=a||builder->getOwner()!=p->playerID||!CGMysteriousCave::canDemolish(builder))return;
  p->cb->caveBuilderAction(builder->id,townWindow->town->id,c,d,e!=0);lastPublished=0;return;
 }
 if(action==102)
 {
  const auto window=ENGINE->windows().topWindow<CHeroWindow>();const auto owner=window?window->curHero:nullptr;
  if(!owner||owner->id.getNum()!=a||owner->getOwner()!=p->playerID||!p->makingTurn||battle||window->getPickedArtifact()||!era_compat::hasEquippedAtma(*owner))return;
  p->cb->refreshArtifactState(owner);lastPublished=0;return;
 }
 if(action==101)
 {
  const auto window=ENGINE->windows().topWindow<CHeroWindow>();const auto owner=window?window->curHero:nullptr;
  if(!owner||owner->id.getNum()!=a||owner->getOwner()!=p->playerID||!p->makingTurn||window->getPickedArtifact()||b<0||b>=7||!owner->hasStackAtSlot(SlotID(b))||!p->cb->getSettings().getBoolean(EGameSettings::MODULE_STACK_ARTIFACT))return;
  const auto & stack=owner->getStack(SlotID(b));const auto equipped=stack.getArt(ArtifactPosition::CREATURE_SLOT);
  const ArtifactLocation troop(owner->id,std::optional<SlotID>(SlotID(b)),ArtifactPosition::CREATURE_SLOT);
  if(c==-1)
  {
   const auto target=ArtifactPosition(int(ArtifactPosition::BACKPACK_START)+int(owner->artifactsInBackpack.size()));
   if(equipped&&equipped->getId().getNum()==d&&equipped->canBePutAt(owner,target))p->cb->swapArtifacts(troop,ArtifactLocation(owner->id,target));
  }
  else if(c>=int(ArtifactPosition::BACKPACK_START)&&c<int(ArtifactPosition::BACKPACK_START)+int(owner->artifactsInBackpack.size()))
  {
   const auto art=owner->getArt(ArtifactPosition(c));
   if(art&&art->getId().getNum()==d&&(equipped?equipped->getId().getNum():-1)==e&&art->canBePutAt(&stack,ArtifactPosition::CREATURE_SLOT,true)&&(!equipped||equipped->canBePutAt(owner,ArtifactPosition(c),true)))p->cb->swapArtifacts(ArtifactLocation(owner->id,ArtifactPosition(c)),troop);
  }
  lastPublished=0;return;
 }
 if(action==91)
 {
  const auto map=ENGINE->windows().topWindow<AdventureMapInterface>();
  if(!map || map->isWorldView())return;
  for(const auto partner:mobileExchangePartners(*p,hero))
  {
   if(partner->id.getNum()!=a)continue;
   if(const auto town=mobileResidentTown(hero);town && town==mobileResidentTown(partner))
    p->showHeroExchange(hero->id,partner->id);
   else if(p->localState->setPath(hero,partner->visitablePos()))
    p->moveHero(hero,p->localState->getPath(hero));
   lastPublished=0;
   break;
  }
  return;
 }
 if(action==92 || action==93 || action==94)
 {
  if(const auto window=ENGINE->windows().topWindow<CGarrisonWindow>();mobileCampaignExchange(*p,window.get())||mobileGarrisonExchange(*p,window.get())||mobileCampaignRewardExchange(*p,window.get())||mobileJoiningExchange(*p,window.get()))
  {
   if(action==93){window->close();lastPublished=0;return;}
   if(action!=94||!p->makingTurn||a<0||a>3||b<0||b>=7||c<0||c>=7)return;
   const int side=a%2;const auto * from=window->getMobileArmy(side);const auto * to=window->getMobileArmy(a<2?1-side:side);const SlotID source(b),destination(c);
   if(from==to&&source==destination)return;
   const auto creature=from->getCreature(source);if(!creature||creature->getId().getNum()!=e)return;
   const auto target=to->getCreature(destination);const auto count=from->getStackCount(source);const bool swap=target&&target!=creature;
   if(mobileGarrisonExchange(*p,window.get()))
   {
    if(from->getOwner()!=p->playerID||(swap&&to->getOwner()!=p->playerID))return;
    if(from!=to)
    {
     const auto * sourceGarrison=dynamic_cast<const CGGarrison *>(from);const auto * targetGarrison=dynamic_cast<const CGGarrison *>(to);
     if((sourceGarrison&&!sourceGarrison->removableUnits)||(swap&&targetGarrison&&!targetGarrison->removableUnits))return;
    }
   }
   const auto maximum=count-(from!=to&&from->needsLastStack()&&from->stacksCount()==1&&!swap?1:0);
   if(d<1||d>maximum||(swap&&d!=count))return;
   if(d==count)p->cb->mergeOrSwapStacks(from,to,source,destination);
   else p->cb->splitStack(from,to,source,destination,d+(target?to->getStackCount(destination):0));
   lastPublished=0;return;
  }
  if(const auto window=ENGINE->windows().topWindow<CExchangeWindow>())
  {
   if(action==93)
    window->finishExchange();
   else if(p->makingTurn && !window->getPickedArtifact() && (a==0 || a==1))
   {
    const auto & from=*window->getExchangeHero(a);
    const auto & to=*window->getExchangeHero(1-a);
    if(action==94)
    {
     if(b<0 || b>=7 || c<0 || c>=7 || from.getOwner()!=p->playerID)
      return;
     const SlotID source(b),destination(c);
     const auto creature=from.getCreature(source);
     if(!creature || creature->getId().getNum()!=e)return;
     const auto target=to.getCreature(destination);
     const auto count=from.getStackCount(source);
     const bool swap=target && target!=creature;
     if(swap && to.getOwner()!=p->playerID)return;
     const auto maximum=count-(from.needsLastStack() && from.stacksCount()==1 && !swap ? 1 : 0);
     if(d<1 || d>maximum || (swap && d!=count))return;
     if(d==count)
      p->cb->mergeOrSwapStacks(&from,&to,source,destination);
     else
      p->cb->splitStack(&from,&to,source,destination,d+(target?to.getStackCount(destination):0));
     lastPublished=0;
     return;
    }
    const ArtifactPosition source(b), destination(c);
    if(canMobileTransfer(p->playerID,from,source,to,destination))
    {
     const auto art=from.getArt(source);
     const auto target=to.getArt(destination);
     if(art->getId().getNum()==d && (target?target->getId().getNum():-1)==e)
      p->cb->swapArtifacts(ArtifactLocation(from.id,source),ArtifactLocation(to.id,destination));
    }
   }
   lastPublished=0;
  }
  return;
 }
 if(action==55&&hero&&ENGINE->windows().topWindow<AdventureMapInterface>()){p->openHeroWindow(hero);return;}
 if(action==56&&ENGINE->windows().topWindow<AdventureMapInterface>()&&a>=0&&a<int(p->localState->getOwnedTowns().size())){adventureInt->centerOnObject(p->localState->getOwnedTown(a));return;}
 if(action==53&&p->makingTurn&&(townWindow||ENGINE->windows().topWindow<CFortScreen>())){
 const auto town=townWindow?townWindow->town:ENGINE->windows().topWindow<CFortScreen>()->getMobileTown();if(town->getOwner()!=p->playerID)return;auto budget=p->cb->getResourceAmount();auto dest=town->getUpperArmy();std::set<CreatureID> types;int free=0;for(int i=0;i<7;i++){auto c=dest->getCreature(SlotID(i));if(c)types.insert(c->getId());else free++;}
 for(size_t level=0;level<town->creatures.size();level++){const auto & row=town->creatures[level];if(row.second.empty()||row.first<=0)continue;const auto id=row.second.back();if(!types.count(id)&&free==0)continue;const auto creature=id.toCreature();int count=row.first;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects()){const auto cost=era_compat::creature_prices::get(p->cb.get(),*creature)[resource];if(cost>0)count=std::min(count,int(budget[resource]/cost));}if(count<=0)continue;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())budget[resource]-=count*era_compat::creature_prices::get(p->cb.get(),*creature)[resource];if(!types.count(id)){types.insert(id);free--;}p->cb->recruitCreatures(town,dest,id,count,level);}
 lastPublished=0;return;}
 if(action==34){const auto & server=GAME->server();const bool online=server.inLobbyRoom();const bool sourceCheckpoint=mobileCampaignPrompt(*p)||mobileCampaignExchange(*p,ENGINE->windows().topWindow<CGarrisonWindow>().get())||mobileArtifactRewardCheckpoint(*p)||mobileCommanderChoiceCheckpoint(*p)||mobileRogueCheckpoint(*p);const bool allowed=!mobileCampaignBattleHook(*p)&&(!online||server.isHost())&&(p->makingTurn||sourceCheckpoint)&&!p->mobileHeroMoving()&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>()||sourceCheckpoint);if(allowed)p->cb->save(online?"Saves/Goonk-online-auto":"Saves/Goonk-auto",false);MAIN_THREAD_ASYNC_EM_ASM({window.dispatchEvent(new CustomEvent('goonk-autosave-accepted',{detail:{id:$0,accepted:!!$1}}));},a,allowed);return;}
 if(action==29){
  static const std::array<std::string,8> codes={"vcmiresources 100","vcmimove","vcmimap","vcmispells","vcmibuild","vcmilevel 1","vcmiluck","vcmimorale"};
  if(a<0||a>=int(codes.size())||!p->makingTurn||!p->cb->getStartInfo()->extraOptionsInfo.cheatsAllowed)return;
  if(!townWindow&&!ENGINE->windows().topWindow<AdventureMapInterface>())return;
  const auto town=townWindow?townWindow->town:p->localState->getCurrentTown();
  if(a==4){if(!town||town->getOwner()!=p->playerID)return;p->cb->sendMessage(codes[a],town);}
  else{if(a!=0&&a!=2&&!hero)return;p->cb->sendMessage(codes[a],hero);}
  return;
 }
 if(action==41){
  // Tavern candidates are not owned map objects. The hero already visible in
  // equipment, and either army of the open exchange, may be inspected too.
  // One-shot building rewards are unflaggable, so ownership does not apply there.
  const auto preview=ENGINE->windows().topWindow<CHeroWindow>();
  const auto visibleHero=preview?preview->curHero:nullptr;
  const bool inspectingVisibleHero=visibleHero&&visibleHero->id.getNum()==a;
  const CArmedInstance * exchangeArmy=nullptr;
  if(const auto garrison=ENGINE->windows().topWindow<CGarrisonWindow>()){
   for(int side=0;side<2&&!exchangeArmy;++side)if(const auto * current=garrison->getMobileArmy(side);current&&current->id.getNum()==a)exchangeArmy=current;
  }else if(const auto exchange=ENGINE->windows().topWindow<CExchangeWindow>()){
   for(size_t side=0;side<2&&!exchangeArmy;++side)if(const auto * hero=exchange->getExchangeHero(side);hero&&hero->id.getNum()==a)exchangeArmy=hero;
  }
  const CArmedInstance * army=inspectingVisibleHero?visibleHero:exchangeArmy?exchangeArmy:dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(a)));
  if(!army||(!inspectingVisibleHero&&!exchangeArmy&&army->getOwner()!=p->playerID)||b<0||b>=7||!army->hasStackAtSlot(SlotID(b)))return;
  if(auto old=ENGINE->windows().topWindow<CStackWindow>()){
   if(old->isCommanderLevelUp()||old->getMobileStack()==&army->getStack(SlotID(b)))return;
   std::static_pointer_cast<CWindowObject>(old)->close();
  }
  if(!exchangeArmy&&!ENGINE->windows().topWindow<AdventureMapInterface>()&&!townWindow&&!ENGINE->windows().topWindow<CHeroWindow>())return;
  ENGINE->windows().createAndPushWindow<CStackWindow>(&army->getStack(SlotID(b)),false);lastPublished=0;return;
 }
 if(action==59&&p->makingTurn&&!CPlayerInterface::battleInt){
  if(const auto window=ENGINE->windows().topWindow<CStackWindow>())if(const auto stack=window->getMobileStack())if(const auto armyObject=stack->getArmy())if(armyObject->getOwner()==p->playerID){
   const auto slot=armyObject->findStack(stack);UpgradeInfo upgrades(stack->getCreature()->getId());p->cb->fillUpgradeInfo(armyObject,slot,upgrades);const CreatureID target(a);
   const auto & available=upgrades.getAvailableUpgrades();if(std::find(available.begin(),available.end(),target)!=available.end()&&p->cb->getResourceAmount().canAfford(upgrades.getUpgradeTotalCostsFor(target,stack->getCount()))){p->cb->upgradeCreature(armyObject,slot,target);}
  }
  lastPublished=0;return;
 }
 if(action==42&&(ENGINE->windows().topWindow<CFortScreen>()||ENGINE->windows().topWindow<CRecruitmentWindow>())){if(a>=0&&a<int(LIBRARY->creh->objects.size()))ENGINE->windows().createAndPushWindow<CStackWindow>(CreatureID(a).toCreature(),false);lastPublished=0;return;}

 if(action==2&&ENGINE->windows().topWindow<AdventureMapInterface>()&&hero&&p->localState->hasPath(hero)&&p->makingTurn)shortcut(EShortcut::ADVENTURE_MOVE_HERO);
 if(action==3&&ENGINE->windows().topWindow<AdventureMapInterface>()&&p->makingTurn){p->makingTurn=false;p->cb->endTurn();lastPublished=0;}
 if(action==4&&a>=0&&a<int(p->localState->getWanderingHeroes().size())&&ENGINE->windows().topWindow<AdventureMapInterface>()){const auto h=p->localState->getWanderingHero(a);p->localState->setSelection(h);p->cb->refreshConfluxTome(h);adventureInt->centerOnObject(h);}
 if(action==5&&a>=0&&a<int(p->localState->getOwnedTowns().size())&&ENGINE->windows().topWindow<AdventureMapInterface>())p->openTownWindow(p->localState->getOwnedTown(a));
 if(action==6&&adventureInt&&hero)adventureInt->centerOnObject(hero);
 if(action==45&&adventureInt&&ENGINE->windows().topWindow<AdventureMapInterface>()&&!p->localState->getOwnedTowns().empty()){
  const auto selected=p->localState->getCurrentTown();
  adventureInt->centerOnObject(selected&&selected->getOwner()==p->playerID?selected:p->localState->getOwnedTown(0));
 }

 if(action==7&&ENGINE->windows().topWindow<AdventureMapInterface>())p->cb->save("Saves/Goonk-mobile",true);
 if(action==39){if(townWindow&&townWindow->builds&&townWindow->town->getOwner()==p->playerID&&a>=0&&townWindow->town->getTown()->buildings.count(BuildingID(a))&&townWindow->town->hasBuilt(BuildingID(a)))townWindow->builds->buildingClicked(BuildingID(a));lastPublished=0;return;}
 if(action==8&&p->makingTurn)
 {
  const BuildingID id(a);
  const auto fort = mobileEnabled ? ENGINE->windows().topWindow<CFortScreen>() : nullptr;
  const auto town = townWindow ? townWindow->town : fort ? fort->getMobileTown() : nullptr;
  if(!town || town->getOwner()!=p->playerID || !town->getTown()->buildings.count(id) || p->cb->canBuildStructure(town,id)!=EBuildingState::ALLOWED)return;
  if(id==BuildingID::GRAIL)
  {
   if(townWindow&&townWindow->builds&&visitingHeroHasGrail(town))townWindow->builds->enterTownHall();
  }
  else p->cb->buildBuilding(town,id);
 }
 if(action==9&&p->makingTurn&&townWindow&&townWindow->town->getOwner()==p->playerID){const auto t=townWindow->town;if(a>=0&&a<int(t->creatures.size())&&b>=0&&b<int(t->creatures[a].second.size())&&c>0){const auto id=t->creatures[a].second[b];p->cb->recruitCreatures(t,t->getUpperArmy(),id,std::min(c,int(t->creatures[a].first)),a);}}
 if(action==30&&(townWindow||ENGINE->windows().topWindow<CFortScreen>())){
  const auto town=townWindow?townWindow->town:ENGINE->windows().topWindow<CFortScreen>()->getMobileTown();
  if(town->getOwner()!=p->playerID)return;
  if(a>=0&&a<int(town->creatures.size())&&!town->creatures[a].second.empty()){
   const auto recruit=[town,a](CreatureID id,int count){GAME->interface()->cb->recruitCreatures(town,town->getUpperArmy(),id,count,a);};
   ENGINE->windows().createAndPushWindow<CRecruitmentWindow>(town,a,town->getUpperArmy(),recruit,nullptr,-87);
  }
 }
 if(auto recruitment=ENGINE->windows().topWindow<CRecruitmentWindow>()){
  if(action==31)recruitment->setRecruitAmount(a);
  if(action==32&&p->makingTurn)recruitment->confirmRecruitment();
  if(action==33)recruitment->close();
 }

 if(action==58&&p->makingTurn&&a!=b){
  const auto town=townWindow?townWindow->town:ENGINE->windows().topWindow<AdventureMapInterface>()?mobileResidentTown(hero):nullptr;
  if(!town||town->getOwner()!=p->playerID)return;
  const auto upper=town->getUpperArmy();const auto visitor=town->getVisitingHero();
  const CArmedInstance * from=upper->id.getNum()==a?upper:visitor;
  const CArmedInstance * to=upper->id.getNum()==b?upper:visitor;
  if(from&&to&&from!=to&&from->id.getNum()==a&&to->id.getNum()==b&&from->getOwner()==p->playerID&&to->getOwner()==p->playerID&&!from->Slots().empty()){
   p->cb->bulkMoveArmy(from->id,to->id,from->Slots().begin()->first);
  }
  lastPublished=0;return;
 }
 if((action==10||action==11)&&p->makingTurn&&a>=0&&c>=0&&b>=0&&b<7&&d>=0&&d<7){const auto from=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(a)));const auto to=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(c)));if(from&&to&&from->getOwner()==p->playerID&&to->getOwner()==p->playerID&&from->hasStackAtSlot(SlotID(b))){if(action==10)p->cb->mergeOrSwapStacks(from,to,SlotID(b),SlotID(d));else if(e>0&&e<from->getStackCount(SlotID(b))&&!to->hasStackAtSlot(SlotID(d)))p->cb->splitStack(from,to,SlotID(b),SlotID(d),e);}}
 if(ENGINE->windows().topWindow<BattleWindow>()&&battle){
  const bool tactics=battle->tacticsMode||battle->getBattle()->battleTacticDist()!=0;
  const bool manualControl=battle->curInt&&!battle->curInt->isAutoFightOn&&!battle->curInt->autofightingAI;
  const bool combatReady=manualControl&&!tactics&&battle->round>0&&battle->makingTurn()&&!battle->openingPlaying()&&!battle->hasAnimations();
  const bool ownsTactics=battle->getBattle()->battleTacticDist()>0&&battle->getBattle()->sideToPlayer(battle->getBattle()->battleGetTacticsSide())==p->playerID;
  const bool canPlace=battle->tacticsMode&&ownsTactics&&battle->getBattle()->battleTacticDist()>0&&!battle->openingPlaying()&&!battle->hasAnimations();
  if(action==44&&canToggleMobileAutocombat(*battle,tactics,canPlace)&&battle->curInt->isAutoFightOn!=(a!=0))
   shortcut(EShortcut::BATTLE_AUTOCOMBAT);
  if(action==114)
  {
   if(a<0||!(combatReady||canPlace))return;
   const auto * inspected=battle->getBattle()->battleGetStackByID(a);
   if(!inspected||inspected->getCount()<=0||!inspected->getPosition().isValid())return;
   ENGINE->windows().createAndPushWindow<CStackWindow>(inspected,false);lastPublished=0;return;
  }
  if((action==12||action==13)&&combatReady)
  {
   const auto active=battle->stacksController->getActiveStack();
   if(active&&(b==0||(battle->round==b&&active->unitId()==a))&&(action==13||!active->waitedThisTurn))
    battle->giveCommand(action==12?EActionType::WAIT:EActionType::DEFEND);
  }
  if(action==14)
  {
   auto & spells=*battle->actionsController;
   const bool targeting=spells.heroSpellcastingModeActive()||spells.creatureSpellcastingModeActive();
   if(manualControl&&!tactics&&targeting&&a==2)
    spells.endCastingSpell();
   else if(manualControl&&!tactics&&targeting&&a==3&&b>=0&&b<GameConstants::BFIELD_SIZE&&!battle->hasAnimations())
   {
    const BattleHex hex(b);
    if(hex.isAvailable())
     spells.onHexLeftClicked(hex);
   }
   else if(combatReady&&!targeting&&a==4&&b>=0&&b<GameConstants::BFIELD_SIZE)
    spells.performMobileAction(BattleHex(b));
   else if(combatReady&&!targeting&&(a==0||a==1))
    shortcut(a==1?EShortcut::BATTLE_USE_CREATURE_SPELL:EShortcut::BATTLE_CAST_SPELL);
  }
  if(action==15&&battle->openingPlaying())battle->openingEnd();
  if(action==38&&combatReady&&battle->getBattle()->battleCanFlee())shortcut(EShortcut::BATTLE_RETREAT);
  if(action==35&&canPlace)battle->tacticPhaseEnd();
  if(action==36&&canPlace)battle->tacticNextStack(nullptr);
 }
 lastPublished=0;
 });}
#else
void publishMobileVisitedObject(const CGObjectInstance *){}
void publishMobileState(){}
void publishMobileBattleAtlas(){}
const std::vector<int3> & mobileExchangeMarkers(){static const std::vector<int3> none;return none;}
bool isMobilePresentationActive(){return false;}
bool requestMobileTownHall(int){return false;}
#endif
