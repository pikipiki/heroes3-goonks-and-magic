/* Mobile presentation bridge for Heroes Goonk. Engine callbacks remain authoritative. */
#include "StdInc.h"
#include "MobileBridge.h"
#ifdef VCMI_EMSCRIPTEN
#include <emscripten/emscripten.h>
#include <SDL_timer.h>
#include "GameEngine.h"
#include "GameInstance.h"
#include "CPlayerInterface.h"
#include "CServerHandler.h"
#include "PlayerLocalState.h"
#include "HeroMovementController.h"
#include "gui/WindowHandler.h"
#include "gui/EventDispatcher.h"
#include "gui/Shortcut.h"
#include "adventureMap/AdventureMapInterface.h"
#include "mainmenu/CMainMenu.h"
#include "lobby/CLobbyScreen.h"
#include "windows/CCastleInterface.h"
#include "windows/GUIClasses.h"
#include "windows/CHeroWindow.h"
#include "battle/BattleInterface.h"
#include "battle/BattleWindow.h"
#include "battle/BattleStacksController.h"
#include "battle/BattleFieldController.h"
#include "../lib/json/JsonNode.h"
#include "../lib/filesystem/Filesystem.h"
#include "../lib/CCreatureHandler.h"
#include "../lib/CStack.h"
#include "../lib/battle/CPlayerBattleCallback.h"
#include "../lib/callback/CCallback.h"
#include "../lib/mapObjects/CGHeroInstance.h"
#include "../lib/mapObjects/CGTownInstance.h"
#include "../lib/entities/faction/CTown.h"
#include "../lib/entities/building/CBuilding.h"
#include "../lib/mapping/CMapInfo.h"
#include "../lib/pathfinder/CGPathNode.h"

namespace {
bool mobileEnabled=false;
bool mapsListed=false,savesListed=false;std::vector<std::pair<std::string,std::string>> mobileMaps,mobileSaves;
uint32_t lastPublished=0;
JsonNode rect(const Rect & r){JsonNode n;n["x"].Integer()=r.x;n["y"].Integer()=r.y;n["w"].Integer()=r.w;n["h"].Integer()=r.h;return n;}
JsonNode creature(const CCreature * c,int count){JsonNode n;n["name"].String()=c->getNameSingularTranslated();n["id"].Integer()=c->getId().getNum();n["icon"].String()=c->largeIconName;n["count"].Integer()=count;for(int i=0;i<7;i++)n["cost"].Vector().push_back(JsonNode(double(c->getRecruitCost(GameResID(i)))));return n;}
JsonNode army(const CArmedInstance * a,const std::string & name){JsonNode n;n["id"].Integer()=a->id.getNum();n["name"].String()=name;for(int i=0;i<7;i++){auto c=a->getCreature(SlotID(i));n["slots"].Vector().push_back(c?creature(c,a->getStackCount(SlotID(i))):JsonNode());}return n;}
void shortcut(EShortcut key){ENGINE->events().dispatchShortcutPressed({key});ENGINE->events().dispatchShortcutReleased({key});}
}
void publishMobileState(){
 if(!mobileEnabled||!ENGINE||!GAME||SDL_GetTicks()-lastPublished<180)return;lastPublished=SDL_GetTicks();
 JsonNode n;n["mode"].String()="menu";auto top=ENGINE->windows().topWindow<CIntObject>();if(top)n["rect"]=rect(top->pos);
 auto p=GAME->interface();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battleWindow=ENGINE->windows().topWindow<BattleWindow>();
 if(ENGINE->windows().topWindow<CLobbyScreen>())n["mode"].String()=GAME->server().screenType==ESelectionScreen::loadGame?"load":"lobby";
 else if(townWindow)n["mode"].String()="town";
 else if(battleWindow)n["mode"].String()="battle";
 else if(ENGINE->windows().topWindow<AdventureMapInterface>())n["mode"].String()="map";
 else if(p)n["mode"].String()="dialog";
 if(n["mode"].String()=="lobby"){
  if(!mapsListed){mapsListed=true;const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){return path.getType()==EResType::MAP&&path.getName().find("MAPS/")==0;});for(const auto & file:files){try{CMapInfo info;info.mapInit(file.getOriginalName());if(info.amountOfHumanControllablePlayers>0)mobileMaps.emplace_back(file.getOriginalName(),info.getNameForList());}catch(const std::exception &){} }std::sort(mobileMaps.begin(),mobileMaps.end(),[](const auto & a,const auto & b){return a.second<b.second;});}
  for(size_t i=0;i<mobileMaps.size();i++){JsonNode entry;entry["index"].Integer()=i;entry["name"].String()=mobileMaps[i].second;n["maps"].Vector().push_back(entry);}
  if(GAME->server().mi)n["selectedMap"].String()=GAME->server().mi->getNameForList();
 }
 if(n["mode"].String()=="load"){
  if(!savesListed){savesListed=true;mobileSaves.clear();const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){return path.getType()==EResType::SAVEGAME;});for(const auto & file:files){try{CMapInfo info;info.saveInit(file);mobileSaves.emplace_back(file.getOriginalName(),info.getNameForList());}catch(const std::exception &){} }std::sort(mobileSaves.begin(),mobileSaves.end());}
  for(size_t i=0;i<mobileSaves.size();i++){JsonNode entry;entry["index"].Integer()=i;entry["name"].String()=mobileSaves[i].second;n["maps"].Vector().push_back(entry);}if(GAME->server().mi)n["selectedMap"].String()=GAME->server().mi->getNameForList();
 }else savesListed=false;
 if(p&&p->cb&&p->localState){
  n["turn"].Bool()=p->makingTurn;
  for(int i=0;i<7;i++)n["resources"].Vector().push_back(JsonNode(double(p->cb->getResourceAmount(GameResID(i)))));
  const auto hero=p->localState->getCurrentHero();
  if(hero){n["heroName"].String()=hero->getNameTranslated();n["movement"].Integer()=hero->movementPointsRemaining();n["heroId"].Integer()=hero->id.getNum();n["armies"].Vector().push_back(army(hero,hero->getNameTranslated()));if(p->localState->hasPath(hero)){n["hasPath"].Bool()=true;n["pathTurns"].Integer()=p->localState->getPath(hero).lastNode().turns;}}
  int index=0;for(auto h:p->localState->getWanderingHeroes()){JsonNode item;item["name"].String()=h->getNameTranslated();item["index"].Integer()=index++;item["movement"].Integer()=h->movementPointsRemaining();n["heroes"].Vector().push_back(item);}
  index=0;for(auto t:p->localState->getOwnedTowns()){JsonNode item;item["name"].String()=t->getNameTranslated();item["index"].Integer()=index++;n["towns"].Vector().push_back(item);}
  if(townWindow){const auto town=townWindow->town;n["townName"].String()=town->getNameTranslated();n["armies"].Vector().clear();n["armies"].Vector().push_back(army(town->getUpperArmy(),"Garnison"));if(town->getVisitingHero())n["armies"].Vector().push_back(army(town->getVisitingHero(),town->getVisitingHero()->getNameTranslated()));
   for(const auto & entry:town->getTown()->buildings){if(!entry.second||entry.first.getNum()>=44)continue;JsonNode b;b["id"].Integer()=entry.first.getNum();b["name"].String()=entry.second->getNameTranslated();b["key"].String()=entry.second->getJsonKey();b["description"].String()=entry.second->getDescriptionTranslated();b["built"].Bool()=town->hasBuilt(entry.first);b["allowed"].Bool()=p->cb->canBuildStructure(town,entry.first)==EBuildingState::ALLOWED;b["state"].Integer()=static_cast<int>(p->cb->canBuildStructure(town,entry.first));for(int i=0;i<7;i++)b["cost"].Vector().push_back(JsonNode(double(town->getBuildingCost(entry.first)[GameResID(i)])));n["buildings"].Vector().push_back(b);}
   for(size_t level=0;level<town->creatures.size();level++)for(size_t variant=0;variant<town->creatures[level].second.size();variant++){auto c=town->creatures[level].second[variant].toCreature();JsonNode item=creature(c,town->creatures[level].first);item["level"].Integer()=level;item["variant"].Integer()=variant;n["recruits"].Vector().push_back(item);}
  }
  if(battleWindow&&CPlayerInterface::battleInt){const auto b=CPlayerInterface::battleInt;n["canAct"].Bool()=b->makingTurn();n["round"].Integer()=b->round;const auto active=b->stacksController->getActiveStack();if(active){n["activeUnit"]=creature(active->unitType(),active->getCount());n["activeStack"].Integer()=active->unitId();const auto center=b->fieldController->hexPositionAbsolute(active->getPosition()).center();n["focus"]["x"].Integer()=center.x;n["focus"]["y"].Integer()=center.y;}
   for(const auto stack:b->getBattle()->battleGetAllStacks()){if(stack->getCount()<=0||!stack->getPosition().isValid())continue;auto item=creature(stack->unitType(),stack->getCount());const auto center=b->fieldController->hexPositionAbsolute(stack->getPosition()).center();item["x"].Integer()=center.x;item["y"].Integer()=center.y;item["enemy"].Bool()=active&&stack->unitSide()!=active->unitSide();n["battleUnits"].Vector().push_back(item);}const auto hovered=b->fieldController->getHoveredStack();if(hovered)n["targetUnit"]=creature(hovered->unitType(),hovered->getCount());}
 }
 const auto text=n.toCompactString();MAIN_THREAD_EM_ASM({window.dispatchEvent(new CustomEvent('goonk-state',{detail:JSON.parse(UTF8ToString($0))}));},text.c_str());
}
bool isMobilePresentationActive(){return mobileEnabled;}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileEnable(int enabled){if(ENGINE)ENGINE->dispatchMainThread([enabled](){mobileEnabled=enabled!=0;lastPublished=0;});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePointer(int x,int y,int action){if(ENGINE)ENGINE->dispatchMainThread([x,y,action](){Point point(x,y);ENGINE->events().dispatchMouseMoved(Point(0,0),point);if(action==1){ENGINE->events().dispatchMouseLeftButtonPressed(point,4);ENGINE->events().dispatchMouseLeftButtonReleased(point,4);}if(action==2)ENGINE->events().dispatchShowPopup(point,4);if(action==3)ENGINE->events().dispatchClosePopup(point);});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePan(int dx,int dy){if(ENGINE)ENGINE->dispatchMainThread([dx,dy](){Point p(300,260),distance(dx,dy);ENGINE->events().dispatchGesturePanningStarted(p);ENGINE->events().dispatchGesturePanning(p,p+distance,distance);ENGINE->events().dispatchGesturePanningEnded(p,p+distance);});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCommand(int action,int a,int b,int c,int d,int e){if(!ENGINE)return;ENGINE->dispatchMainThread([action,a,b,c,d,e](){
 if(action==0){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});return;}if(action==1){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});return;}
 if(action==20){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::newGame,true,{"Goonk"},ELoadMode::NONE,false);return;}
 if(action==21){if(GAME&&GAME->server().getState()==EClientState::LOBBY){auto info=std::make_shared<CMapInfo>();info->mapInit("MAPS/000-Goonk");GAME->server().setMapInfo(info);}return;}
 if(action==22){if(GAME&&GAME->server().getState()==EClientState::LOBBY)GAME->server().sendStartGame();return;}
 if(action==24){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<int(mobileMaps.size())){auto info=std::make_shared<CMapInfo>();info->mapInit(mobileMaps[a].first);GAME->server().setMapInfo(info);}return;}
 if(action==25){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<=4)GAME->server().setDifficulty(a);return;}
 if(action==27){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().screenType==ESelectionScreen::loadGame&&a>=0&&a<int(mobileSaves.size())){auto info=std::make_shared<CMapInfo>();info->saveInit(ResourcePath(mobileSaves[a].first,EResType::SAVEGAME));GAME->server().setMapInfo(info);}return;}
 if(action==23){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::loadGame,true,{"Goonk"},ELoadMode::SINGLE,false);return;}
 auto p=GAME?GAME->interface():nullptr;if(!p||!p->cb||!p->localState)return;
 const auto hero=p->localState->getCurrentHero();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battle= CPlayerInterface::battleInt;
 if(action==2&&ENGINE->windows().topWindow<AdventureMapInterface>()&&hero&&p->localState->hasPath(hero)&&p->makingTurn)shortcut(EShortcut::ADVENTURE_MOVE_HERO);
 if(action==3&&ENGINE->windows().topWindow<AdventureMapInterface>()&&p->makingTurn)p->cb->endTurn();
 if(action==4&&a>=0&&a<int(p->localState->getWanderingHeroes().size())&&ENGINE->windows().topWindow<AdventureMapInterface>()){const auto h=p->localState->getWanderingHero(a);p->localState->setSelection(h);adventureInt->centerOnObject(h);}
 if(action==5&&a>=0&&a<int(p->localState->getOwnedTowns().size())&&ENGINE->windows().topWindow<AdventureMapInterface>())p->openTownWindow(p->localState->getOwnedTown(a));
 if(action==6&&adventureInt&&hero)adventureInt->centerOnObject(hero);
 if(action==7&&ENGINE->windows().topWindow<AdventureMapInterface>())p->cb->save("Saves/Goonk-mobile",true);
 if(action==8&&townWindow&&townWindow->town->getOwner()==p->playerID&&p->cb->canBuildStructure(townWindow->town,BuildingID(a))==EBuildingState::ALLOWED)p->cb->buildBuilding(townWindow->town,BuildingID(a));
 if(action==9&&townWindow&&townWindow->town->getOwner()==p->playerID){const auto t=townWindow->town;if(a>=0&&a<int(t->creatures.size())&&b>=0&&b<int(t->creatures[a].second.size())&&c>0){const auto id=t->creatures[a].second[b];const auto destination=t->getVisitingHero()?static_cast<const CArmedInstance*>(t->getVisitingHero()):t->getUpperArmy();p->cb->recruitCreatures(t,destination,id,std::min(c,int(t->creatures[a].first)),a);}}
 if((action==10||action==11)&&a>=0&&c>=0&&b>=0&&b<7&&d>=0&&d<7){const auto from=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(a)));const auto to=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(c)));if(from&&to&&from->getOwner()==p->playerID&&to->getOwner()==p->playerID&&from->hasStackAtSlot(SlotID(b))){if(action==10)p->cb->mergeOrSwapStacks(from,to,SlotID(b),SlotID(d));else if(e>0&&e<from->getStackCount(SlotID(b))&&!to->hasStackAtSlot(SlotID(d)))p->cb->splitStack(from,to,SlotID(b),SlotID(d),e);}}
 if(ENGINE->windows().topWindow<BattleWindow>()&&battle){if(action==12&&battle->makingTurn())battle->giveCommand(EActionType::WAIT);if(action==13&&battle->makingTurn())battle->giveCommand(EActionType::DEFEND);if(action==14)shortcut(a==1?EShortcut::BATTLE_USE_CREATURE_SPELL:EShortcut::BATTLE_CAST_SPELL);if(action==15)battle->openingEnd();}
 lastPublished=0;
 });}
#else
void publishMobileState(){}
bool isMobilePresentationActive(){return false;}
#endif
