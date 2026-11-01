/* Mobile presentation bridge for Heroes Goonk. Engine callbacks remain authoritative. */
#include "StdInc.h"
#include "MobileBridge.h"
#ifdef VCMI_EMSCRIPTEN
#include <emscripten/emscripten.h>
#include <SDL_timer.h>
#include <SDL_surface.h>
#include "render/Canvas.h"
#include "../lib/battle/AccessibilityInfo.h"
#include "../lib/battle/IBattleState.h"
#include <atomic>
#include "GameEngine.h"
#include "media/ISoundPlayer.h"
#include "media/IMusicPlayer.h"
#include "../lib/StartInfo.h"
#include "GameInstance.h"
#include "CPlayerInterface.h"
#include "CServerHandler.h"
#include "PlayerLocalState.h"
#include "HeroMovementController.h"
#include "gui/WindowHandler.h"
#include "gui/EventDispatcher.h"
#include "gui/Shortcut.h"
#include "adventureMap/AdventureMapInterface.h"
#include "adventureMap/CMinimap.h"
#include "mainmenu/CMainMenu.h"
#include "lobby/CLobbyScreen.h"
#include "windows/CCastleInterface.h"
#include "windows/GUIClasses.h"
#include "widgets/Buttons.h"
#include "windows/CHeroWindow.h"
#include "battle/BattleInterface.h"
#include "battle/BattleActionsController.h"
#include "battle/BattleWindow.h"
#include "battle/BattleStacksController.h"
#include "battle/BattleFieldController.h"
#include "../lib/json/JsonNode.h"
#include "../lib/CConfigHandler.h"
#include "../lib/filesystem/Filesystem.h"
#include "../lib/CCreatureHandler.h"
#include "../lib/CStack.h"
#include "../lib/spells/CSpellHandler.h"
#include "../lib/battle/CPlayerBattleCallback.h"
#include "../lib/callback/CCallback.h"
#include "../lib/mapObjects/CGHeroInstance.h"
#include "../lib/mapObjects/CGTownInstance.h"
#include "../lib/entities/faction/CTown.h"
#include "../lib/entities/faction/CFaction.h"
#include "../lib/networkPacks/PacksForLobby.h"
#include "../lib/entities/building/CBuilding.h"
#include "../lib/mapping/CMapInfo.h"
#include "../lib/pathfinder/CGPathNode.h"

namespace {
bool mobileEnabled=false,stateEnabled=false,audioMuted=false;
ui32 previousSoundVolume=75,previousMusicVolume=75;
bool mapsListed=false,savesListed=false;std::vector<std::pair<std::string,std::string>> mobileMaps,mobileSaves;
uint32_t lastPublished=0,lastSent=0;
std::string lastSnapshot,pendingDefaultMap;
std::atomic_bool snapshotPending{false};
JsonNode rect(const Rect & r){JsonNode n;n["x"].Integer()=r.x;n["y"].Integer()=r.y;n["w"].Integer()=r.w;n["h"].Integer()=r.h;return n;}
JsonNode creature(const CCreature * c,int count){JsonNode n;n["name"].String()=c->getNameSingularTranslated();n["id"].Integer()=c->getId().getNum();n["icon"].String()=c->largeIconName;n["count"].Integer()=count;for(int i=0;i<7;i++)n["cost"].Vector().push_back(JsonNode(double(c->getRecruitCost(GameResID(i)))));return n;}
JsonNode army(const CArmedInstance * a,const std::string & name){JsonNode n;n["id"].Integer()=a->id.getNum();n["name"].String()=name;for(int i=0;i<7;i++){auto c=a->getCreature(SlotID(i));n["slots"].Vector().push_back(c?creature(c,a->getStackCount(SlotID(i))):JsonNode());}return n;}
void shortcut(EShortcut key){ENGINE->events().dispatchShortcutPressed({key});ENGINE->events().dispatchShortcutReleased({key});}
}
std::atomic_bool atlasPending{false};
void publishMobileBattleAtlas(){
 static uint32_t last=0;
 if(!mobileEnabled||!ENGINE||!GAME||atlasPending.load()||SDL_GetTicks()-last<83)return;
 const auto battle=CPlayerInterface::battleInt;
 if(!battle||!ENGINE->windows().topWindow<BattleWindow>())return;
 last=SDL_GetTicks();
 std::vector<const CStack *> units;size_t total=0;for(const auto stack:battle->getBattle()->battleGetAllStacks())if(stack->getPosition().isValid()){++total;if(units.size()<64)units.push_back(stack);}std::vector<std::array<int32_t,7>> geometry(units.size());
 if(units.empty())return;
 const int width=1024,height=((units.size()+7)/8)*128;
 auto scratch=SDL_CreateRGBSurfaceWithFormat(0,512,512,32,SDL_PIXELFORMAT_ARGB8888);
 auto atlas=SDL_CreateRGBSurfaceWithFormat(0,width,height,32,SDL_PIXELFORMAT_ARGB8888);
 if(!scratch||!atlas){if(scratch)SDL_FreeSurface(scratch);if(atlas)SDL_FreeSurface(atlas);return;}
 SDL_FillRect(atlas,nullptr,0);
 {auto canvas=Canvas::createFromSurface(scratch,CanvasScalingPolicy::IGNORE);
 for(size_t i=0;i<units.size();i++){
  geometry[i][0]=units[i]->unitId();SDL_FillRect(scratch,nullptr,0);Point bounds;if(!battle->stacksController->drawIsolatedStack(canvas,units[i],bounds))continue;
  int left=512,top=512,right=-1,bottom=-1;
  for(int y=0;y<std::min(512,bounds.y);y++)for(int x=0;x<std::min(512,bounds.x);x++){const auto pixel=static_cast<uint8_t*>(scratch->pixels)+y*scratch->pitch+x*4;if(pixel[3]>32){left=std::min(left,x);right=std::max(right,x);top=std::min(top,y);bottom=std::max(bottom,y);}}
  if(right<left)continue;
  const auto position=battle->stacksController->getStackPositionAtHex(units[i]->getPosition(),units[i])+battle->stacksController->mobileAnimationOffset(units[i]);
  const auto center=battle->fieldController->hexPositionAbsolute(units[i]->getPosition()).center()+battle->stacksController->mobileAnimationOffset(units[i]);
  geometry[i]={int32_t(units[i]->unitId()),position.x+left,position.y+top,right-left+1,bottom-top+1,center.x,center.y};
  SDL_Rect src{left,top,right-left+1,bottom-top+1};double scale=std::min(110.0/src.w,110.0/src.h);
  SDL_Rect dst{int(i%8)*128+(128-int(src.w*scale))/2,int(i/8)*128+(128-int(src.h*scale))/2,int(src.w*scale),int(src.h*scale)};
  SDL_SetSurfaceBlendMode(scratch,SDL_BLENDMODE_NONE);SDL_BlitScaled(scratch,&src,atlas,&dst);
 }}
 // Paletted DEF blitters use the engine's native ARGB layout. Convert only
 // at the browser boundary; drawing them directly into RGBA swaps red/blue.
 auto rgba=SDL_ConvertSurfaceFormat(atlas,SDL_PIXELFORMAT_RGBA32,0);
 if(!rgba){SDL_FreeSurface(scratch);SDL_FreeSurface(atlas);return;}
 const size_t prefix=units.size()*7*sizeof(int32_t),bytes=width*height*4;auto packet=static_cast<uint8_t*>(malloc(prefix+bytes));
 if(packet){for(size_t i=0;i<units.size();i++)memcpy(packet+i*7*sizeof(int32_t),geometry[i].data(),7*sizeof(int32_t));memcpy(packet+prefix,rgba->pixels,bytes);atlasPending.store(true);
 MAIN_THREAD_ASYNC_EM_ASM({const ptr=$0;const w=$1;const h=$2;const n=$3;try{const rows=Array.from({length:n},(_,i)=>Array.from(HEAP32.subarray(ptr/4+i*7,ptr/4+i*7+7)));const ids=rows.map(row=>row[0]);window.goonkBattleSpriteBounds=rows.map(row=>({stackId:row[0],x:row[1],y:row[2],w:row[3],h:row[4],renderX:row[5],renderY:row[6]}));window.goonkBattleSpriteBoundsComplete=!!$4;const rgba=new Uint8ClampedArray(HEAPU8.slice(ptr+n*28,ptr+n*28+w*h*4).buffer);const canvas=window.goonkBattleAtlas||(window.goonkBattleAtlas=document.createElement('canvas'));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}canvas.getContext('2d').putImageData(new ImageData(rgba,w,h),0,0);window.goonkBattleAtlasIds=new Map(ids.map((id,i)=>[id,i]));}finally{_free(ptr);Module._vcmiMobileAtlasAck();}},packet,width,height,units.size(),total<=64);}
 SDL_FreeSurface(rgba);SDL_FreeSurface(scratch);SDL_FreeSurface(atlas);
}
// Version of native ERA services actually linked into this engine.
extern "C" int EMSCRIPTEN_KEEPALIVE vcmiEraBridgeVersion(){return 1;}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileAtlasAck(){atlasPending.store(false);}
void publishMobileState(){
 if(!stateEnabled||!ENGINE||!GAME||snapshotPending.load()||SDL_GetTicks()-lastPublished<180)return;lastPublished=SDL_GetTicks();
 if(audioMuted){if(ENGINE->sound().getVolume()!=0)ENGINE->sound().setVolume(0);if(ENGINE->music().getVolume()!=0)ENGINE->music().setVolume(0);}
 JsonNode n;n["audioMuted"].Bool()=audioMuted;n["soundVolume"].Integer()=ENGINE->sound().getVolume();n["musicVolume"].Integer()=ENGINE->music().getVolume();n["mode"].String()="menu";auto top=ENGINE->windows().topWindow<CIntObject>();if(top)n["rect"]=rect(top->pos);
 auto p=GAME->interface();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battleWindow=ENGINE->windows().topWindow<BattleWindow>();auto recruitWindow=ENGINE->windows().topWindow<CRecruitmentWindow>();
 if(ENGINE->windows().topWindow<CLobbyScreen>())n["mode"].String()=GAME->server().screenType==ESelectionScreen::loadGame?"load":"lobby";
 else if(recruitWindow)n["mode"].String()="recruit";
 else if(townWindow)n["mode"].String()="town";
 else if(battleWindow)n["mode"].String()="battle";
 else if(ENGINE->windows().topWindow<AdventureMapInterface>())n["mode"].String()="map";
 else if(p)n["mode"].String()="dialog";
 if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>()){
  n["dialogKind"].String()="tavern";n["dialogTitle"].String()="Taverne";
  if(tavern->cancel)n["dialogCloseRect"]=rect(tavern->cancel->pos);
 }

 if(auto fort=ENGINE->windows().topWindow<CFortScreen>()){
  n["dialogKind"].String()="fort";n["dialogTitle"].String()="Créatures du château";
  for(const auto & area:fort->mobileRecruitAreas())n["fortAreas"].Vector().push_back(rect(area));
 }
 if(n["mode"].String()=="lobby"){
  n["lobbyReady"].Bool()=GAME->server().getState()==EClientState::LOBBY;
  if(!mapsListed){mapsListed=true;const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){return path.getType()==EResType::MAP&&path.getName().find("MAPS/")==0;});for(const auto & file:files){try{CMapInfo info;info.mapInit(file.getOriginalName());if(info.amountOfHumanControllablePlayers>0)mobileMaps.emplace_back(file.getOriginalName(),info.getNameForList());}catch(const std::exception &){} }std::sort(mobileMaps.begin(),mobileMaps.end(),[](const auto & a,const auto & b){return a.second<b.second;});}
  for(size_t i=0;i<mobileMaps.size();i++){JsonNode entry;entry["index"].Integer()=i;entry["name"].String()=mobileMaps[i].second;n["maps"].Vector().push_back(entry);}
  if(GAME->server().mi){
   auto & server=GAME->server();n["selectedMap"].String()=server.mi->getNameForList();n["difficulty"].Integer()=server.si->difficulty;
   const auto color=server.myFirstColor();
   if(server.si->playerInfos.count(color)){
    const auto & allowed=server.getPlayerInfo(color).allowedFactions;
    n["selectedFaction"].Integer()=server.si->playerInfos.at(color).castle.getNum();n["allowRandomFaction"].Bool()=server.getPlayerInfo(color).isFactionRandom;
    for(const auto id:allowed){const auto faction=id.toFaction();JsonNode item;item["id"].Integer()=id.getNum();item["name"].String()=faction->getNameTranslated();item["key"].String()=faction->getJsonKey();n["factions"].Vector().push_back(item);}
    if(!pendingDefaultMap.empty()&&server.mi->getNameForList()==pendingDefaultMap){pendingDefaultMap.clear();server.setDifficulty(1);for(const auto id:allowed)if(id.toFaction()->getJsonKey()=="goonk:goonk")server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,id.getNum(),color);}
   }
  }
 }
 if(n["mode"].String()=="load"){
  n["lobbyReady"].Bool()=GAME->server().getState()==EClientState::LOBBY;
  if(!savesListed){savesListed=true;mobileSaves.clear();const auto files=CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path){return path.getType()==EResType::SAVEGAME;});for(const auto & file:files){try{CMapInfo info;info.saveInit(file);mobileSaves.emplace_back(file.getOriginalName(),info.getNameForList());}catch(const std::exception &){} }std::sort(mobileSaves.begin(),mobileSaves.end());}
  for(size_t i=0;i<mobileSaves.size();i++){JsonNode entry;entry["index"].Integer()=i;entry["name"].String()=mobileSaves[i].second;n["maps"].Vector().push_back(entry);}if(GAME->server().mi){const auto selected=ResourcePath(GAME->server().mi->fileURI,EResType::SAVEGAME).getName();for(size_t i=0;i<mobileSaves.size();i++)if(ResourcePath(mobileSaves[i].first,EResType::SAVEGAME).getName()==selected){n["selectedMap"].String()=mobileSaves[i].second;n["selectedIndex"].Integer()=i;break;}}
 }else savesListed=false;
 if(recruitWindow){
  if(const auto c=recruitWindow->getRecruitCreature())n["recruitUnit"]=creature(c,recruitWindow->getRecruitAvailable());
  n["recruitAmount"].Integer()=recruitWindow->getRecruitAmount();n["recruitMaximum"].Integer()=recruitWindow->getRecruitMaximum();
 }
 if(p&&p->cb&&p->localState){n["day"].Integer()=p->cb->getDate(Date::DAY);
  n["turn"].Bool()=p->makingTurn; n["autosaveAllowed"].Bool()=p->makingTurn&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>());
  n["cheatsAllowed"].Bool()=p->cb->getStartInfo()->extraOptionsInfo.cheatsAllowed;
  n["cheatReady"].Bool()=p->makingTurn&&(n["mode"].String()=="map"||n["mode"].String()=="town");
  if(p->localState->getCurrentTown())n["selectedTownName"].String()=p->localState->getCurrentTown()->getNameTranslated();
  for(int i=0;i<7;i++)n["resources"].Vector().push_back(JsonNode(double(p->cb->getResourceAmount(GameResID(i)))));
  if(n["mode"].String()=="map"&&adventureInt){auto mini=adventureInt->getMobileMinimap();if(mini){auto size=p->cb->getMapSize();auto & m=n["mapOverview"];m["rect"]=rect(mini->pos);m["view"]=rect(adventureInt->getMobileMapRect());m["viewport"]=rect(mini->mobileVisibleArea());m["width"].Integer()=size.x;m["height"].Integer()=size.y;m["level"].Integer()=mini->mobileLevel();}}
  const auto hero=p->localState->getCurrentHero();
  if(hero){n["heroName"].String()=hero->getNameTranslated();n["movement"].Integer()=hero->movementPointsRemaining();n["heroId"].Integer()=hero->id.getNum();n["armies"].Vector().push_back(army(hero,hero->getNameTranslated()));if(p->localState->hasPath(hero)){n["hasPath"].Bool()=true;n["pathTurns"].Integer()=p->localState->getPath(hero).lastNode().turns;}}
  int index=0;for(auto h:p->localState->getWanderingHeroes()){JsonNode item;item["name"].String()=h->getNameTranslated();item["index"].Integer()=index++;item["movement"].Integer()=h->movementPointsRemaining();n["heroes"].Vector().push_back(item);}
  index=0;for(auto t:p->localState->getOwnedTowns()){JsonNode item;item["name"].String()=t->getNameTranslated();item["index"].Integer()=index++;n["towns"].Vector().push_back(item);}
  if(townWindow){const auto town=townWindow->town;n["townName"].String()=town->getNameTranslated();n["townFaction"].String()=town->getFaction()->getJsonKey();n["armies"].Vector().clear();n["armies"].Vector().push_back(army(town->getUpperArmy(),"Garnison"));if(town->getVisitingHero())n["armies"].Vector().push_back(army(town->getVisitingHero(),town->getVisitingHero()->getNameTranslated()));
   for(const auto & entry:town->getTown()->buildings){if(!entry.second||entry.first.getNum()>=44)continue;JsonNode b;b["id"].Integer()=entry.first.getNum();b["name"].String()=entry.second->getNameTranslated();b["key"].String()=entry.second->getJsonKey();b["description"].String()=entry.second->getDescriptionTranslated();b["built"].Bool()=town->hasBuilt(entry.first);b["allowed"].Bool()=p->cb->canBuildStructure(town,entry.first)==EBuildingState::ALLOWED;b["state"].Integer()=static_cast<int>(p->cb->canBuildStructure(town,entry.first));for(int i=0;i<7;i++)b["cost"].Vector().push_back(JsonNode(double(town->getBuildingCost(entry.first)[GameResID(i)])));n["buildings"].Vector().push_back(b);}
   for(size_t level=0;level<town->creatures.size();level++)for(size_t variant=0;variant<town->creatures[level].second.size();variant++){auto c=town->creatures[level].second[variant].toCreature();JsonNode item=creature(c,town->creatures[level].first);item["level"].Integer()=level;item["variant"].Integer()=variant;n["recruits"].Vector().push_back(item);}
  }
  if(battleWindow&&CPlayerInterface::battleInt){const auto b=CPlayerInterface::battleInt;n["battleCamera"]=b->mobileCameraSnapshot();const bool tactics=b->tacticsMode||b->getBattle()->battleTacticDist()!=0;
   const bool ownsTactics=b->getBattle()->battleTacticDist()>0&&b->getBattle()->sideToPlayer(b->getBattle()->battleGetTacticsSide())==p->playerID;
   n["tacticsMode"].Bool()=tactics;n["canEndTactics"].Bool()=b->tacticsMode&&ownsTactics&&!b->openingPlaying()&&!b->hasAnimations();
   const bool autoOn=b->curInt&&b->curInt->isAutoFightOn;
   const bool autoReady=b->curInt&&!b->openingPlaying()&&!b->actionsController->heroSpellcastingModeActive()&&(autoOn||!b->curInt->autofightingAI)&&
    (tactics?ownsTactics&&b->tacticsMode&&!b->hasAnimations()&&!settings["battle"]["endWithAutocombat"].Bool():b->round>0&&(!settings["battle"]["endWithAutocombat"].Bool()||(b->makingTurn()&&!b->hasAnimations())));
   n["autoCombat"].Bool()=autoOn;n["canAutoCombat"].Bool()=autoReady;
   n["canRetreat"].Bool()=!tactics&&b->round>0&&b->makingTurn()&&!b->hasAnimations()&&b->getBattle()->battleCanFlee();
   n["canUseMagic"].Bool()=!tactics&&b->round>0&&b->makingTurn()&&!b->openingPlaying()&&!b->hasAnimations();
   const auto caster=b->currentHero();n["heroHasSpellbook"].Bool()=caster&&caster->hasSpellbook();if(caster)n["heroMana"].Integer()=caster->mana;
   const auto spellProblem=caster?b->getBattle()->battleCanCastSpell(caster,spells::Mode::HERO):ESpellCastProblem::NO_HERO_TO_CAST_SPELL;
   n["heroCanCast"].Bool()=!tactics&&caster&&(spellProblem==ESpellCastProblem::OK||spellProblem==ESpellCastProblem::MAGIC_IS_BLOCKED);
   n["canAct"].Bool()=b->makingTurn();n["round"].Integer()=b->round;n["battlePlayerAttacks"].Bool()=b->getBattle()->getBattle()->getSidePlayer(BattleSide::ATTACKER)==p->playerID;const auto active=b->stacksController->getActiveStack();n["creatureCanCast"].Bool()=!tactics&&active&&active->hasBonusOfType(BonusType::SPELLCASTER)&&active->canCast();if(active){n["activeUnit"]=creature(active->unitType(),active->getCount());n["activeStack"].Integer()=active->unitId();const auto center=b->fieldController->hexPositionAbsolute(active->getPosition()).center();n["focus"]["x"].Integer()=center.x;n["focus"]["y"].Integer()=center.y;}
   for(const auto stack:b->getBattle()->battleGetAllStacks()){if(stack->getCount()<=0||!stack->getPosition().isValid())continue;auto item=creature(stack->unitType(),stack->getCount());item["stackId"].Integer()=stack->unitId();item["currentHealth"].Integer()=stack->getFirstHPleft();item["maximumHealth"].Integer()=stack->getMaxHealth();for(const auto hex:stack->getHexes())item["occupied"].Vector().push_back(JsonNode(double(hex.toInt())));const auto center=b->fieldController->hexPositionAbsolute(stack->getPosition()).center();item["x"].Integer()=center.x;item["y"].Integer()=center.y;item["enemy"].Bool()=stack->getOwner()!=p->playerID;n["battleUnits"].Vector().push_back(item);}const auto accessibility=b->getBattle()->getAccessibility();const auto reachable=active?b->getBattle()->battleGetAvailableHexes(active,false):BattleHexArray();
   for(int row=0;row<11;row++)for(int col=1;col<16;col++){const BattleHex hex(col+17*row);const auto center=b->fieldController->hexPositionAbsolute(hex).center();JsonNode cell;cell["hex"].Integer()=hex.toInt();cell["x"].Integer()=center.x;cell["y"].Integer()=center.y;cell["kind"].Integer()=int(accessibility[hex.toInt()]);cell["reachable"].Bool()=active&&reachable.contains(hex);n["battleCells"].Vector().push_back(cell);}
   const auto hovered=b->fieldController->getHoveredStack();if(hovered)n["targetUnit"]=creature(hovered->unitType(),hovered->getCount());}
 }
 const auto text=n.toCompactString();
 if(text==lastSnapshot&&SDL_GetTicks()-lastSent<1000)return;
 auto * snapshot=static_cast<char *>(malloc(text.size()+1));if(!snapshot)return;
 memcpy(snapshot,text.c_str(),text.size()+1);lastSnapshot=text;lastSent=SDL_GetTicks();snapshotPending.store(true);
 // Never wait for DOM handlers while holding GameEngine::interfaceMutex.
 // Keep at most one notification in flight if the browser is busy.
 MAIN_THREAD_ASYNC_EM_ASM({
  const snapshot=UTF8ToString($0);_free($0);
  try{window.dispatchEvent(new CustomEvent('goonk-state',{detail:JSON.parse(snapshot)}));}
  finally{Module._vcmiMobileStateAck();}
 },snapshot);
}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileStateAck(){snapshotPending.store(false);}
bool isMobilePresentationActive(){return mobileEnabled;}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileEnable(int enabled){if(ENGINE)ENGINE->dispatchMainThread([enabled](){mobileEnabled=enabled==1;stateEnabled=enabled!=0;lastPublished=0;});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePointer(int x,int y,int action){if(ENGINE)ENGINE->dispatchMainThread([x,y,action](){if(action==4&&(!GAME||!GAME->interface()||!GAME->interface()->makingTurn||!ENGINE->windows().topWindow<AdventureMapInterface>()))return;Point point(x,y);ENGINE->events().dispatchMouseMoved(Point(0,0),point);if(action==1||action==4){ENGINE->events().dispatchMouseLeftButtonPressed(point,4);ENGINE->events().dispatchMouseLeftButtonReleased(point,4);}if(action==2)ENGINE->events().dispatchShowPopup(point,4);if(action==3)ENGINE->events().dispatchClosePopup(point);});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobilePan(int dx,int dy){if(ENGINE)ENGINE->dispatchMainThread([dx,dy](){Point p(300,260),distance(dx,dy);ENGINE->events().dispatchGesturePanningStarted(p);ENGINE->events().dispatchGesturePanning(p,p+distance,distance);ENGINE->events().dispatchGesturePanningEnded(p,p+distance);});}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCommand(int action,int a,int b,int c,int d,int e){if(!ENGINE)return;ENGINE->dispatchMainThread([action,a,b,c,d,e](){
 if(action==0){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});return;}if(action==1){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});return;}
 // A dedicated cancel operation cannot also accept a dialog or close the town
 // below it. Ignore delayed taps once the taverne is no longer on top.
 if(action==40){if(auto tavern=ENGINE->windows().topWindow<CTavernWindow>())tavern->close();lastPublished=0;return;}
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
 if(action==20){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::newGame,true,{"Goonk"},ELoadMode::NONE,false);return;}
 if(action==21){if(GAME&&GAME->server().getState()==EClientState::LOBBY){auto info=std::make_shared<CMapInfo>();info->mapInit("MAPS/001-Goonks");pendingDefaultMap="Goonks";GAME->server().setMapInfo(info);}return;}
 if(action==22){if(GAME&&GAME->server().getState()==EClientState::LOBBY)GAME->server().sendStartGame();return;}
 if(action==24){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<int(mobileMaps.size())){auto info=std::make_shared<CMapInfo>();info->mapInit(mobileMaps[a].first);pendingDefaultMap=info->getNameForList()=="Goonks"?"Goonks":"";GAME->server().setMapInfo(info);}return;}
 if(action==25){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<=4)GAME->server().setDifficulty(a);return;}
 if(action==37){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().mi){auto & server=GAME->server();const auto color=server.myFirstColor();if(server.si->playerInfos.count(color)&&(server.getPlayerInfo(color).allowedFactions.count(FactionID(a))||(a==-1&&server.getPlayerInfo(color).isFactionRandom)))server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,a,color);}return;}
 if(action==27){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().screenType==ESelectionScreen::loadGame&&a>=0&&a<int(mobileSaves.size())){auto info=std::make_shared<CMapInfo>();info->saveInit(ResourcePath(mobileSaves[a].first,EResType::SAVEGAME));GAME->server().setMapInfo(info);}return;}
 if(action==23){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::loadGame,true,{"Goonk"},ELoadMode::SINGLE,false);return;}
 auto p=GAME?GAME->interface():nullptr;if(!p||!p->cb||!p->localState)return;
 const auto hero=p->localState->getCurrentHero();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battle= CPlayerInterface::battleInt;
 if(action==34){const bool allowed=p->makingTurn&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>());if(allowed)p->cb->save("Saves/Goonk-auto",false);MAIN_THREAD_ASYNC_EM_ASM({window.dispatchEvent(new CustomEvent('goonk-autosave-accepted',{detail:{id:$0,accepted:!!$1}}));},a,allowed);return;}
 if(action==29){
  static const std::array<std::string,8> codes={"vcmiresources 100","vcmimove","vcmimap","vcmispells","vcmibuild","vcmilevel 1","vcmiluck","vcmimorale"};
  if(a<0||a>=int(codes.size())||!p->makingTurn||!p->cb->getStartInfo()->extraOptionsInfo.cheatsAllowed)return;
  if(!townWindow&&!ENGINE->windows().topWindow<AdventureMapInterface>())return;
  const auto town=townWindow?townWindow->town:p->localState->getCurrentTown();
  if(a==4){if(!town||town->getOwner()!=p->playerID)return;p->cb->sendMessage(codes[a],town);}
  else{if(a!=0&&a!=2&&!hero)return;p->cb->sendMessage(codes[a],hero);}
  return;
 }
 if(action==2&&ENGINE->windows().topWindow<AdventureMapInterface>()&&hero&&p->localState->hasPath(hero)&&p->makingTurn)shortcut(EShortcut::ADVENTURE_MOVE_HERO);
 if(action==3&&ENGINE->windows().topWindow<AdventureMapInterface>()&&p->makingTurn)p->cb->endTurn();
 if(action==4&&a>=0&&a<int(p->localState->getWanderingHeroes().size())&&ENGINE->windows().topWindow<AdventureMapInterface>()){const auto h=p->localState->getWanderingHero(a);p->localState->setSelection(h);adventureInt->centerOnObject(h);}
 if(action==5&&a>=0&&a<int(p->localState->getOwnedTowns().size())&&ENGINE->windows().topWindow<AdventureMapInterface>())p->openTownWindow(p->localState->getOwnedTown(a));
 if(action==6&&adventureInt&&hero)adventureInt->centerOnObject(hero);
 if(action==45&&adventureInt&&ENGINE->windows().topWindow<AdventureMapInterface>()&&!p->localState->getOwnedTowns().empty()){
  const auto selected=p->localState->getCurrentTown();
  adventureInt->centerOnObject(selected&&selected->getOwner()==p->playerID?selected:p->localState->getOwnedTown(0));
 }

 if(action==7&&ENGINE->windows().topWindow<AdventureMapInterface>())p->cb->save("Saves/Goonk-mobile",true);
 if(action==39){if(townWindow&&townWindow->builds&&p->makingTurn&&townWindow->town->getOwner()==p->playerID&&a>=0&&a<44&&townWindow->town->getTown()->buildings.count(BuildingID(a))&&townWindow->town->hasBuilt(BuildingID(a)))townWindow->builds->buildingClicked(BuildingID(a));lastPublished=0;return;}
 if(action==8&&townWindow&&townWindow->town->getOwner()==p->playerID&&p->cb->canBuildStructure(townWindow->town,BuildingID(a))==EBuildingState::ALLOWED)p->cb->buildBuilding(townWindow->town,BuildingID(a));
 if(action==9&&townWindow&&townWindow->town->getOwner()==p->playerID){const auto t=townWindow->town;if(a>=0&&a<int(t->creatures.size())&&b>=0&&b<int(t->creatures[a].second.size())&&c>0){const auto id=t->creatures[a].second[b];p->cb->recruitCreatures(t,t->getUpperArmy(),id,std::min(c,int(t->creatures[a].first)),a);}}
 if(action==30&&townWindow&&p->makingTurn&&townWindow->town->getOwner()==p->playerID){
  const auto town=townWindow->town;
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

 if((action==10||action==11)&&a>=0&&c>=0&&b>=0&&b<7&&d>=0&&d<7){const auto from=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(a)));const auto to=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(c)));if(from&&to&&from->getOwner()==p->playerID&&to->getOwner()==p->playerID&&from->hasStackAtSlot(SlotID(b))){if(action==10)p->cb->mergeOrSwapStacks(from,to,SlotID(b),SlotID(d));else if(e>0&&e<from->getStackCount(SlotID(b))&&!to->hasStackAtSlot(SlotID(d)))p->cb->splitStack(from,to,SlotID(b),SlotID(d),e);}}
 if(ENGINE->windows().topWindow<BattleWindow>()&&battle){
  const bool tactics=battle->tacticsMode||battle->getBattle()->battleTacticDist()!=0;
  const bool combatReady=!tactics&&battle->round>0&&battle->makingTurn()&&!battle->openingPlaying()&&!battle->hasAnimations();
  const bool ownsTactics=battle->getBattle()->battleTacticDist()>0&&battle->getBattle()->sideToPlayer(battle->getBattle()->battleGetTacticsSide())==p->playerID;
  const bool canPlace=battle->tacticsMode&&ownsTactics&&battle->getBattle()->battleTacticDist()>0&&!battle->openingPlaying()&&!battle->hasAnimations();
  if(action==44&&battle->curInt&&!battle->openingPlaying()&&!battle->actionsController->heroSpellcastingModeActive()){
   const bool autoOn=battle->curInt->isAutoFightOn;
   const bool allowed=(autoOn||!battle->curInt->autofightingAI)&&(tactics?canPlace&&!settings["battle"]["endWithAutocombat"].Bool():battle->round>0&&(!settings["battle"]["endWithAutocombat"].Bool()||combatReady));
   if(allowed&&autoOn!=(a!=0))shortcut(EShortcut::BATTLE_AUTOCOMBAT);
  }
  if(action==12&&combatReady)battle->giveCommand(EActionType::WAIT);
  if(action==13&&combatReady)battle->giveCommand(EActionType::DEFEND);
  if(action==14&&combatReady)shortcut(a==1?EShortcut::BATTLE_USE_CREATURE_SPELL:EShortcut::BATTLE_CAST_SPELL);
  if(action==15&&battle->openingPlaying())battle->openingEnd();
  if(action==38&&combatReady&&battle->getBattle()->battleCanFlee())shortcut(EShortcut::BATTLE_RETREAT);
  if(action==35&&canPlace)battle->tacticPhaseEnd();
  if(action==36&&canPlace)battle->tacticNextStack(nullptr);
 }
 lastPublished=0;
 });}
#else
void publishMobileState(){}
void publishMobileBattleAtlas(){}
bool isMobilePresentationActive(){return false;}
#endif
