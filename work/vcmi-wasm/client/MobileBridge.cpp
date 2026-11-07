/* Mobile presentation bridge for Heroes Goonk. Engine callbacks remain authoritative. */
#include "StdInc.h"
#include "MobileBridge.h"
#ifdef VCMI_EMSCRIPTEN
#include <emscripten/emscripten.h>
#include <SDL_timer.h>
#include <SDL_surface.h>
#include "render/Canvas.h"
#include "render/IImage.h"
#include "render/IRenderHandler.h"
#include "windows/CSpellWindow.h"
#include "windows/CMarketWindow.h"
#include "lobby/RandomMapTab.h"
#include "lobby/CBonusSelection.h"
#include "mainmenu/CPrologEpilogVideo.h"
#include "../lib/campaign/CampaignState.h"
#include "widgets/TextControls.h"
#include "../lib/rmg/CMapGenOptions.h"
#include "../lib/campaign/CampaignHandler.h"
#include "../lib/entities/artifact/CArtifact.h"
#include "../lib/entities/artifact/CArtifactInstance.h"
#include "../lib/battle/AccessibilityInfo.h"
#include "../lib/battle/IBattleState.h"
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
#include "CServerHandler.h"
#include "PlayerLocalState.h"
#include "HeroMovementController.h"
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
#include "../lib/CSkillHandler.h"
#include "../lib/entities/hero/CHero.h"
#include "../lib/GameLibrary.h"
#include "../lib/entities/ResourceTypeHandler.h"
#include "../lib/CStack.h"
#include "../lib/gameState/UpgradeInfo.h"
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
#include "../lib/mapping/GoonkScenario.h"
#include "../lib/pathfinder/CGPathNode.h"

namespace {
bool mobileEnabled=false,stateEnabled=false,audioMuted=false;
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
bool mapsListed=false,savesListed=false;std::set<int> portraitIds,artifactIconIds;std::vector<std::pair<std::string,std::string>> mobileCampaigns;
struct MobileSave
{
 std::string file, name, scenario;
};
std::vector<MobileSave> mobileSaves;
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
JsonNode creature(const CCreature * c,int count){portraitIds.insert(c->getId().getNum());JsonNode n;n["shooter"].Bool()=c->hasBonusOfType(BonusType::SHOOTER);n["name"].String()=c->getNameSingularTranslated();n["id"].Integer()=c->getId().getNum();n["icon"].String()=c->largeIconName;n["key"].String()=c->getJsonKey();n["description"].String()=c->getDescriptionTranslated();n["count"].Integer()=count;n["attack"].Integer()=c->getAttack(false);n["defense"].Integer()=c->getDefense(false);n["health"].Integer()=c->getMaxHealth();n["speed"].Integer()=c->getMovementRange();n["damageMin"].Integer()=c->getMinDamage(false);n["damageMax"].Integer()=c->getMaxDamage(false);n["growth"].Integer()=c->getGrowth();n["aiValue"].Integer()=c->getAIValue();n["fightValue"].Integer()=c->getFightValue();n["shots"].Integer()=c->getBaseShots();n["nativeFlags"]["living"].Bool()=c->hasBonusOfType(BonusType::LIVING);n["nativeFlags"]["undead"].Bool()=c->hasBonusOfType(BonusType::UNDEAD);n["nativeFlags"]["nonLiving"].Bool()=c->hasBonusOfType(BonusType::NON_LIVING);n["nativeFlags"]["mindImmune"].Bool()=c->hasBonusOfType(BonusType::MIND_IMMUNITY);n["nativeFlags"]["noMorale"].Bool()=c->hasBonusOfType(BonusType::NO_MORALE);n["nativeFlags"]["flying"].Bool()=c->hasBonusOfType(BonusType::FLYING);n["nativeFlags"]["blocksRetaliation"].Bool()=c->hasBonusOfType(BonusType::BLOCKS_RETALIATION);n["nativeFlags"]["attacksAllAdjacent"].Bool()=c->hasBonusOfType(BonusType::ATTACKS_ALL_ADJACENT);n["nativeFlags"]["chargeImmune"].Bool()=c->hasBonusOfType(BonusType::CHARGE_IMMUNITY);for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())n["cost"].Vector().push_back(JsonNode(double(c->getRecruitCost(resource))));return n;}
void mobilePreviews(CIntObject * node,JsonNode & result){
 if(auto picture=dynamic_cast<CCreaturePic*>(node)){if(auto c=picture->getMobileCreature()){auto item=creature(c,1);item["preview"]=rect(picture->pos);result.Vector().push_back(item);}return;}
 for(auto child:node->children)mobilePreviews(child,result);
}
void publishPortraits()
{
 static std::set<int> previous; if(portraitIds.empty()||previous==portraitIds)return;previous=portraitIds;
 std::vector<int> ids;for(int id:portraitIds)if(ids.size()<96)ids.push_back(id);
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
 static std::set<int> previous; if(artifactIconIds.empty()||previous==artifactIconIds)return;previous=artifactIconIds;
 std::vector<int> ids;for(int id:artifactIconIds)if(ids.size()<96)ids.push_back(id);
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
JsonNode army(const CArmedInstance * a,const std::string & name){JsonNode n;n["id"].Integer()=a->id.getNum();n["name"].String()=name;n["needsLastStack"].Bool()=a->needsLastStack();for(int i=0;i<7;i++){auto c=a->getCreature(SlotID(i));auto item=c?creature(c,a->getStackCount(SlotID(i))):JsonNode();if(c)mobileStackExperience(item,&a->getStack(SlotID(i)));n["slots"].Vector().push_back(item);}return n;}
// Resolve army exchange from the persisted town/hero relationship, not from
// whether the castle window has been opened since loading the saved game.
const CGTownInstance * mobileResidentTown(const CGHeroInstance * hero){
 if(!hero)return nullptr;const auto town=hero->getVisitedTown();
 return town&&(town->getVisitingHero()==hero||town->getGarrisonHero()==hero)?town:nullptr;
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
  entry["name"].String()=map.name;
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

void publishMobileState(){
 if(!stateEnabled||!ENGINE||!GAME||snapshotPending.load()||SDL_GetTicks()-lastPublished<180)return;lastPublished=SDL_GetTicks();
 if(audioMuted){if(ENGINE->sound().getVolume()!=0)ENGINE->sound().setVolume(0);if(ENGINE->music().getVolume()!=0)ENGINE->music().setVolume(0);}
 portraitIds.clear();artifactIconIds.clear();JsonNode n;n["mapSettings"]["moveTime"].Integer()=settings["adventure"]["heroMoveTime"].Integer();n["mapSettings"]["enemyMoveTime"].Integer()=settings["adventure"]["enemyMoveTime"].Integer();n["audioMuted"].Bool()=audioMuted;n["soundVolume"].Integer()=ENGINE->sound().getVolume();n["musicVolume"].Integer()=ENGINE->music().getVolume();n["mode"].String()="menu";auto top=ENGINE->windows().topWindow<CIntObject>();if(top)n["rect"]=rect(top->pos);
 auto p=GAME->interface();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battleWindow=ENGINE->windows().topWindow<BattleWindow>();auto recruitWindow=ENGINE->windows().topWindow<CRecruitmentWindow>();auto fortWindow=ENGINE->windows().topWindow<CFortScreen>();auto creatureWindow=ENGINE->windows().topWindow<CStackWindow>();auto spellWindow=ENGINE->windows().topWindow<CSpellWindow>();auto heroWindow=ENGINE->windows().topWindow<CHeroWindow>();
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
   if(server.si)n["onlineTurnMinutes"].Integer()=server.si->turnTimerInfo.turnTimer/60000;
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
 else if(spellWindow){n["mode"].String()="spellbook";n["spellbook"]=spellWindow->mobileSnapshot();}
 else if(const auto guild=ENGINE->windows().topWindow<CMageGuildScreen>()){
  n["mode"].String()="mage-guild";
  n["mageGuild"]=guild->mobileSnapshot();
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
 else if(battleWindow)n["mode"].String()="battle";
 else if(const auto map=ENGINE->windows().topWindow<AdventureMapInterface>())
 {
  n["mode"].String()="map";
  n["worldView"].Bool()=map->isWorldView();
 }
 else if(p||ENGINE->windows().topWindow<CBonusSelection>())n["mode"].String()="dialog";
 if(top&&(fortWindow||recruitWindow||n["mode"].String()=="creature"))mobilePreviews(top.get(),n["previewUnits"]);
 if(n["mode"].String()=="creature"&&creatureWindow->getMobileCreature()){
  auto item=creature(creatureWindow->getMobileCreature(),creatureWindow->getMobileCount());
  for(const auto & description : creatureWindow->getMobileAbilities())
   item["abilities"].Vector().emplace_back(description);
  if(auto stack=creatureWindow->getMobileStack()){mobileStackExperience(item,stack);const bool shooter=stack->hasBonusOfType(BonusType::SHOOTER);item["attack"].Integer()=stack->getAttack(shooter);item["defense"].Integer()=stack->getDefense(shooter);item["health"].Integer()=stack->getMaxHealth();item["speed"].Integer()=stack->getMovementRange();item["damageMin"].Integer()=stack->getMinDamage(shooter);item["damageMax"].Integer()=stack->getMaxDamage(shooter);}
  if(p&&p->cb&&!CPlayerInterface::battleInt)if(const auto stack=creatureWindow->getMobileStack())if(const auto armyObject=stack->getArmy())if(armyObject->getOwner()==p->playerID){
   const auto slot=armyObject->findStack(stack);UpgradeInfo upgrades(stack->getCreature()->getId());p->cb->fillUpgradeInfo(armyObject,slot,upgrades);
   for(const auto id:upgrades.getAvailableUpgrades()){
    auto upgrade=creature(id.toCreature(),stack->getCount());const auto total=upgrades.getUpgradeCostsFor(id)*stack->getCount();upgrade["cost"].Vector().clear();
    for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())upgrade["cost"].Vector().push_back(JsonNode(double(total[resource])));
    upgrade["affordable"].Bool()=p->makingTurn&&p->cb->getResourceAmount().canAfford(total);n["creatureUpgrades"].Vector().push_back(upgrade);
   }
  }
  n["creatureUnit"]=item;
 }
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
 if(n["mode"].String()=="lobby"&&GAME->server().mi&&GAME->server().si){auto & server=GAME->server();for(const auto & player:server.si->playerInfos){JsonNode row;row["color"].Integer()=player.first.getNum();row["name"].String()=player.second.name;row["faction"].Integer()=player.second.castle.getNum();for(auto id:server.getPlayerInfo(player.first).allowedFactions){auto faction=id.toFaction();JsonNode item;item["id"].Integer()=id.getNum();item["name"].String()=faction->getNameTranslated();item["key"].String()=faction->getJsonKey();row["factions"].Vector().push_back(item);}n["players"].Vector().push_back(row);}}
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
  n["heroMoving"].Bool()=p->mobileHeroMoving();n["turn"].Bool()=p->makingTurn; const auto & server=GAME->server();n["onlineGame"].Bool()=server.inLobbyRoom();
  if(p->makingTurn&&p->cb->getStartInfo()->turnTimerInfo.turnTimer>0)
   n["turnRemainingMs"].Integer()=p->cb->getPlayerTurnTime(p->playerID).valueMs();
  n["autosaveAllowed"].Bool()=(!server.inLobbyRoom()||server.isHost())&&p->makingTurn&&!n["heroMoving"].Bool()&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>());
  n["cheatsAllowed"].Bool()=p->cb->getStartInfo()->extraOptionsInfo.cheatsAllowed;
  n["cheatReady"].Bool()=p->makingTurn&&(n["mode"].String()=="map"||n["mode"].String()=="town");
  if(p->localState->getCurrentTown())n["selectedTownName"].String()=p->localState->getCurrentTown()->getNameTranslated();
  for(const auto resourceId:LIBRARY->resourceTypeHandler->getAllObjects()){
   const auto resource=LIBRARY->resourceTypeHandler->getById(resourceId);JsonNode type;
   type["id"].Integer()=resourceId.getNum();type["key"].String()=resource->getJsonKey();type["scope"].String()=resource->getModScope();type["name"].String()=resource->getNameTranslated();
   resource->registerIcons([&type](int32_t,int32_t,const std::string & list,const std::string & image){if(list=="SMALRES")type["icon"].String()=image;});
   n["resourceTypes"].Vector().push_back(type);n["resources"].Vector().push_back(JsonNode(double(p->cb->getResourceAmount(resourceId))));
  }
  if(n["mode"].String()=="map"&&adventureInt){auto mini=adventureInt->getMobileMinimap();if(mini){auto size=p->cb->getMapSize();auto & m=n["mapOverview"];m["rect"]=rect(mini->pos);m["view"]=rect(adventureInt->getMobileMapRect());m["viewport"]=rect(mini->mobileVisibleArea());m["width"].Integer()=size.x;m["height"].Integer()=size.y;m["level"].Integer()=mini->mobileLevel();}}
  const auto hero=heroWindow?heroWindow->curHero:p->localState->getCurrentHero();
  if(hero){n["heroName"].String()=hero->getNameTranslated();n["heroMana"].Integer()=hero->mana;n["heroManaLimit"].Integer()=hero->manaLimit();n["heroHasSpellbook"].Bool()=hero->hasSpellbook();n["movement"].Integer()=hero->movementPointsRemaining();n["heroId"].Integer()=hero->id.getNum();n["armies"].Vector().push_back(army(hero,hero->getNameTranslated()));if(p->localState->hasPath(hero)){n["hasPath"].Bool()=true;n["pathTurns"].Integer()=p->localState->getPath(hero).lastNode().turns;}}
  if(n["mode"].String()=="map"&&hero){const auto town=mobileResidentTown(hero);if(town&&town->getOwner()==p->playerID)mobileTownArmies(n,town);}
  if(heroWindow&&hero){auto & h=n["heroWindow"];h["owned"].Bool()=hero->getOwner()==p->playerID;h["name"].String()=hero->getNameTranslated();h["className"].String()=hero->getClassNameTranslated();h["level"].Integer()=hero->level;h["mana"].Integer()=hero->mana;h["manaLimit"].Integer()=hero->manaLimit();h["portrait"]=rect(Rect(heroWindow->pos.x+19,heroWindow->pos.y+19,58,64));
   HeroIconFrames icons;
   for(int i = 0; i < 4; ++i)
   {
    h["primarySkills"].Vector().push_back(JsonNode(double(hero->getPrimSkillLevel(static_cast<PrimarySkill>(i)))));
    JsonNode icon;
    addHeroIcon(icons, icon, "PSKIL42", i == 3 ? 5 : i);
    h["primaryIcons"].Vector().push_back(std::move(icon));
   }
   h["experience"].Integer()=hero->exp;
   addHeroIcon(icons, h["experienceIcon"], "PSKIL42", 4);
   addHeroIcon(icons, h["manaIcon"], "PSKIL42", 3);
   addHeroIcon(icons, h["specialty"]["icon"], "UN44", hero->getHeroType()->imageIndex);
   const int morale = hero->hasBonusOfType(BonusType::NO_MORALE) ? 0 : hero->moraleVal();
   const int luck = hero->luckVal();
   h["morale"]["value"].Integer() = morale;
   h["luck"]["value"].Integer() = luck;
   addHeroIcon(icons, h["morale"]["icon"], "IMRL42", std::clamp(morale + 3, 0, 6));
   addHeroIcon(icons, h["luck"]["icon"], "ILCK42", std::clamp(luck + 3, 0, 6));
   h["specialty"]["name"].String()=hero->getHeroType()->getSpecialtyNameTranslated();
   h["specialty"]["description"].String()=hero->getHeroType()->getSpecialtyDescriptionTranslated();
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
   if(h["owned"].Bool() && hero->getCommander())
    addHeroIcon(icons, h["commanderIcon"], "heroWindow/commanderButtonIcon");
   publishHeroIcons(icons);
   const auto picked=heroWindow->getPickedArtifact();if(picked){h["picked"]["name"].String()=picked->getType()->getNameTranslated();h["picked"]["icon"].Integer()=picked->getType()->getIconIndex();artifactIconIds.insert(picked->getType()->getIconIndex());}
   auto addSlot=[&](int index,bool backpack){const auto position=ArtifactPosition(index);const auto art=hero->getArt(position,false);JsonNode item;item["slot"].Integer()=index;bool locked=false;for(const auto & set:heroWindow->artSets)if(set)if(auto place=set->getArtPlace(position)){locked=place->isLocked();break;}item["locked"].Bool()=locked;item["movable"].Bool()=art&&!locked&&index!=int(ArtifactPosition::SPELLBOOK)&&index!=int(ArtifactPosition::MACH4);item["allowed"].Bool()=picked&&!locked&&picked->canBePutAt(hero,position,true);if(art){const auto type=art->getType();item["name"].String()=type->getNameTranslated();item["description"].String()=type->getDescriptionTranslated();item["icon"].Integer()=type->getIconIndex();artifactIconIds.insert(type->getIconIndex());}h[backpack?"backpack":"slots"].Vector().push_back(item);};
   for(int i=0;i<19;i++)addSlot(i,false);for(size_t i=0;i<=hero->artifactsInBackpack.size();i++)addSlot(int(ArtifactPosition::BACKPACK_START)+int(i),true);
  }
  if(hero){for(const auto & slot:hero->artifactsWorn){auto artifact=slot.second.getArt();if(!artifact)continue;auto type=artifact->getType();JsonNode item;item["slot"].Integer()=slot.first.getNum();item["name"].String()=type->getNameTranslated();item["description"].String()=type->getDescriptionTranslated();item["icon"].Integer()=type->getIconIndex();n["equipment"].Vector().push_back(item);}n["backpackCount"].Integer()=hero->artifactsInBackpack.size();}
  int index=0;for(auto h:p->localState->getWanderingHeroes()){JsonNode item;item["name"].String()=h->getNameTranslated();item["index"].Integer()=index++;item["id"].Integer()=h->id.getNum();item["movement"].Integer()=h->movementPointsRemaining();item["movementLimit"].Integer()=h->movementPointsLimit();item["mana"].Integer()=h->mana;item["manaLimit"].Integer()=h->manaLimit();item["hasSpellbook"].Bool()=h->hasSpellbook();if(h->movementPointsRemaining()>0)n["anyHeroCanMove"].Bool()=true;n["heroes"].Vector().push_back(item);}
  index=0;for(auto t:p->localState->getOwnedTowns()){JsonNode item;item["name"].String()=t->getNameTranslated();item["index"].Integer()=index++;n["towns"].Vector().push_back(item);}
  if(townWindow||fortWindow){const auto town=townWindow?townWindow->town:fortWindow->getMobileTown();n["townName"].String()=town->getNameTranslated();n["townFaction"].String()=town->getFaction()->getJsonKey();mobileTownArmies(n,town);
   for(const auto & level:town->spells){JsonNode row;row.Vector();for(const auto spell:level)row.Vector().push_back(JsonNode(double(spell.getNum())));n["townSpells"].Vector().push_back(row);}
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
    const auto buildState=p->cb->canBuildStructure(town,id);
    const bool needsGrail=id==BuildingID::GRAIL&&!visitingHeroHasGrail(town);
    b["allowed"].Bool()=buildState==EBuildingState::ALLOWED&&!needsGrail;
    b["state"].Integer()=static_cast<int>(buildState);
    if(id==BuildingID::GRAIL)b["needsGrail"].Bool()=needsGrail;
    for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())
     b["cost"].Vector().push_back(JsonNode(double(town->getBuildingCost(id)[resource])));
    n["buildings"].Vector().push_back(b);
   }
   if(fortWindow){
    if(const auto selected=fortWindow->getMobilePreviewCreature())n["fortSelectedId"].Integer()=selected->getId().getNum();
    for(size_t level=0;level<town->getTown()->creatures.size();level++){
     JsonNode family;family["level"].Integer()=level;family["count"].Integer()=town->creatures[level].first;
     const auto & available=town->creatures[level].second;
     const auto & roster=town->getTown()->creatures[level];
     for(size_t rank=0;rank<roster.size();rank++){
      const auto id=roster[rank];auto variant=creature(id.toCreature(),town->creatures[level].first);variant["rank"].Integer()=rank;variant["level"].Integer()=level;variant["built"].Bool()=std::find(available.begin(),available.end(),id)!=available.end();
      const auto bid=BuildingID(BuildingID::getDwellingFromLevel(level,rank));if(town->getTown()->buildings.count(bid))variant["requiredBuilding"].String()=town->getTown()->buildings.at(bid)->getNameTranslated();
      family["variants"].Vector().push_back(variant);
     }
     n["fortFamilies"].Vector().push_back(family);
    }
    for(size_t level=0;level<town->getTown()->creatures.size();level++){
    const auto & available=town->creatures[level].second;auto c=!available.empty()?available.back().toCreature():town->getTown()->creatures[level].front().toCreature();
    auto row=creature(c,town->creatures[level].first);row["level"].Integer()=level;row["built"].Bool()=!available.empty();n["fortRows"].Vector().push_back(row);
   }}
   for(size_t level=0;level<town->creatures.size();level++)for(size_t variant=0;variant<town->creatures[level].second.size();variant++){auto c=town->creatures[level].second[variant].toCreature();JsonNode item=creature(c,town->creatures[level].first);item["level"].Integer()=level;item["variant"].Integer()=variant;n["recruits"].Vector().push_back(item);}
  }
  if(battleWindow&&CPlayerInterface::battleInt){const auto b=CPlayerInterface::battleInt;n["battleCamera"]=b->mobileCameraSnapshot();const bool targeting=b->actionsController->heroSpellcastingModeActive()||b->actionsController->creatureSpellcastingModeActive();n["spellTargeting"].Bool()=targeting;const bool tactics=b->tacticsMode||b->getBattle()->battleTacticDist()!=0;
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
   const auto spellProblem=caster?b->getBattle()->battleCanCastSpell(caster,spells::Mode::HERO):ESpellCastProblem::NO_HERO_TO_CAST_SPELL;
   n["heroSpellCastLimitReached"].Bool()=spellProblem==ESpellCastProblem::CASTS_PER_TURN_LIMIT;
   n["heroCanCast"].Bool()=manualControl&&!tactics&&caster&&(spellProblem==ESpellCastProblem::OK||spellProblem==ESpellCastProblem::MAGIC_IS_BLOCKED);
   n["canAct"].Bool()=manualControl&&b->makingTurn();n["round"].Integer()=b->round;n["battlePlayerAttacks"].Bool()=b->getBattle()->getBattle()->getSidePlayer(BattleSide::ATTACKER)==p->playerID;const auto active=b->stacksController->getActiveStack();if(active)n["canWait"].Bool()=!active->waitedThisTurn;n["creatureCanCast"].Bool()=!tactics&&active&&active->hasBonusOfType(BonusType::SPELLCASTER)&&active->canCast();if(active){n["activeUnit"]=creature(active->unitType(),active->getCount());n["activeUnit"]["controlled"].Bool()=b->getBattle()->battleGetOwner(active)==p->playerID;n["activeUnit"]["commander"].Bool()=active->unitSlot()==SlotID::COMMANDER_SLOT_PLACEHOLDER;n["activeUnit"]["remainingShots"].Integer()=active->shots.available();n["activeUnit"]["canShoot"].Bool()=b->getBattle()->battleCanShoot(active);n["activeStack"].Integer()=active->unitId();const auto center=b->fieldController->hexPositionAbsolute(active->getPosition()).center();n["focus"]["x"].Integer()=center.x;n["focus"]["y"].Integer()=center.y;}
   for(const auto stack:b->getBattle()->battleGetAllStacks()){if(stack->getCount()<=0||!stack->getPosition().isValid())continue;auto item=creature(stack->unitType(),stack->getCount());mobileStackExperience(item,stack->base);item["stackId"].Integer()=stack->unitId();item["eraSlot"].Integer()=stack->sourceMassSlot();item["armySlot"].Integer()=stack->unitSlot().getNum();item["currentHealth"].Integer()=stack->getFirstHPleft();item["maximumHealth"].Integer()=stack->getMaxHealth();item["cloned"].Bool()=stack->isClone();item["remainingCasts"].Integer()=stack->casts.available();item["remainingShots"].Integer()=stack->shots.available();item["speed"].Integer()=stack->getMovementRange();item["remainingRetaliations"].Integer()=stack->counterAttacks.available();item["attack"].Integer()=stack->getAttack(false);item["defense"].Integer()=stack->getDefense(false);item["morale"].Integer()=stack->moraleVal();for(const auto hex:stack->getHexes())item["occupied"].Vector().push_back(JsonNode(double(hex.toInt())));const auto center=b->fieldController->hexPositionAbsolute(stack->getPosition()).center();item["x"].Integer()=center.x;item["y"].Integer()=center.y;item["enemy"].Bool()=stack->getOwner()!=p->playerID;n["battleUnits"].Vector().push_back(item);}const auto accessibility=b->getBattle()->getAccessibility();const auto reachable=active?b->getBattle()->battleGetAvailableHexes(active,false):BattleHexArray();
   const bool previewSpellTargets=targeting&&manualControl&&b->actionsController->canPreviewSpellTargets();
   if(targeting)
   {
    if(const auto spell=b->actionsController->targetedSpell())
     n["selectedSpell"].String()=spell->getNameTranslated();
   }
   for(int row=0;row<11;row++)for(int col=1;col<16;col++){const BattleHex hex(col+17*row);const auto center=b->fieldController->hexPositionAbsolute(hex).center();JsonNode cell;cell["hex"].Integer()=hex.toInt();cell["x"].Integer()=center.x;cell["y"].Integer()=center.y;cell["kind"].Integer()=int(accessibility[hex.toInt()]);cell["reachable"].Bool()=active&&reachable.contains(hex);if(previewSpellTargets)cell["spellTarget"].Bool()=b->actionsController->canTargetSpellHex(hex);n["battleCells"].Vector().push_back(cell);}
   const auto hovered=b->fieldController->getHoveredStack();if(hovered)n["targetUnit"]=creature(hovered->unitType(),hovered->getCount());if(active)for(auto & unit:n["battleUnits"].Vector()){const BattleHex position(unit["occupied"].Vector().empty()?0:unit["occupied"].Vector()[0].Integer());unit["canShootAt"].Bool()=b->getBattle()->battleCanShoot(active,position);unit["canMeleeAt"].Bool()=b->getBattle()->battleCanAttackHex(reachable,active,position);}}
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
bool isMobilePresentationActive(){return mobileEnabled;}
bool requestMobileTownHall(int townId)
{
 if(!mobileEnabled)return false;
 mobileTownHall=townId;
 lastPublished=0;
 return true;
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

extern "C" void EMSCRIPTEN_KEEPALIVE vcmiMobileCommand(int action,int a,int b,int c,int d,int e){if(!ENGINE)return;ENGINE->dispatchMainThread([action,a,b,c,d,e](){
 if(action==0){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_CANCEL,EShortcut::GLOBAL_RETURN});return;}if(action==1){ENGINE->events().dispatchShortcutPressed({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});ENGINE->events().dispatchShortcutReleased({EShortcut::GLOBAL_ACCEPT,EShortcut::GLOBAL_RETURN});return;}
 // A dedicated cancel operation cannot also accept a dialog or close the town
 // below it. Ignore delayed taps once the taverne is no longer on top.
 if(action==62||action==63||action==64){if(auto window=ENGINE->windows().topWindow<CHeroWindow>()){if(action==63)window->close();else if(action==64){for(const auto & set:window->artSets)if(set)set->putBackPickedArtifact();}else if(window->curHero&&GAME->interface()&&window->curHero->getOwner()==GAME->interface()->playerID&&a>=0&&a<=int(ArtifactPosition::BACKPACK_START)+int(window->curHero->artifactsInBackpack.size()))window->clickPressedOnArtPlace(window->curHero,ArtifactPosition(a),true,false,false,window->pos.center());lastPublished=0;}return;}
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
  if(player && window && window->curHero && window->curHero->getOwner()==player->playerID
     && window->curHero->getCommander() && !window->getPickedArtifact())
  {
   window->commanderWindow();
   lastPublished=0;
  }
  return;
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
 if(action==22){if(GAME&&GAME->server().getState()==EClientState::LOBBY)GAME->server().sendStartGame();return;}
 if(action==24){if(GAME&&!GAME->server().inLobbyRoom()&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<int(mobileMaps.size())){auto info=std::make_shared<CMapInfo>();info->mapInit(mobileMaps[a].file);pendingDefaultMap=info->getNameForList()=="Goonks"?"Goonks":"";GAME->server().setMapInfo(info);}return;}
 if(action==25){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&a>=0&&a<=4)GAME->server().setDifficulty(a);return;}
 if(action==37){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().mi){auto & server=GAME->server();const auto color=server.myFirstColor();if(server.si->playerInfos.count(color)&&(server.getPlayerInfo(color).allowedFactions.count(FactionID(a))||(a==-1&&server.getPlayerInfo(color).isFactionRandom)))server.setPlayerOption(LobbyChangePlayerOption::TOWN_ID,a,color);}return;}
 if(action==27){if(GAME&&GAME->server().getState()==EClientState::LOBBY&&GAME->server().screenType==ESelectionScreen::loadGame&&a>=0&&a<int(mobileSaves.size())){auto info=std::make_shared<CMapInfo>();info->saveInit(ResourcePath(mobileSaves[a].file,EResType::SAVEGAME));GAME->server().setMapInfo(info);}return;}
 if(action==23){if(GAME&&!GAME->interface())CMainMenu::openLobby(ESelectionScreen::loadGame,true,{"Goonk"},ELoadMode::SINGLE,false);return;}
 auto p=GAME?GAME->interface():nullptr;if(!p||!p->cb||!p->localState)return;
 const auto hero=p->localState->getCurrentHero();auto townWindow=ENGINE->windows().topWindow<CCastleInterface>();auto battle= CPlayerInterface::battleInt;
 if(action==54&&townWindow&&(p->makingTurn||townWindow->town->getOwner()==p->playerID)){ENGINE->windows().createAndPushWindow<CFortScreen>(townWindow->town);lastPublished=0;return;}
 // Family gallery actions stay in the fort; the server remains authoritative
 // for ownership, stock, resources and available army slots.
 if((action==60||action==61)&&ENGINE->windows().topWindow<CFortScreen>()){
  const auto fort=ENGINE->windows().topWindow<CFortScreen>();const auto town=fort->getMobileTown();
  if(town->getOwner()!=p->playerID||a<0||a>=int(town->getTown()->creatures.size()))return;
  const CreatureID id(b);const auto & roster=town->getTown()->creatures[a];if(std::find(roster.begin(),roster.end(),id)==roster.end())return;
  if(action==60)fort->mobileSelectCreature(id.toCreature());
  else if(p->makingTurn&&c>0){
   const auto & row=town->creatures[a];if(row.first<=0||std::find(row.second.begin(),row.second.end(),id)==row.second.end())return;
   const auto destination=town->getUpperArmy();
   if(!destination->getSlotFor(id).validSlot()&&id.toCreature()->warMachine==ArtifactID::NONE){p->showInfoDialog(LIBRARY->generaltexth->allTexts[17]);return;}
   p->cb->recruitCreatures(town,destination,id,std::min(c,int(row.first)),a);
  }
  lastPublished=0;return;
 }
 if(action==55&&hero&&ENGINE->windows().topWindow<AdventureMapInterface>()){p->openHeroWindow(hero);return;}
 if(action==56&&ENGINE->windows().topWindow<AdventureMapInterface>()&&a>=0&&a<int(p->localState->getOwnedTowns().size())){adventureInt->centerOnObject(p->localState->getOwnedTown(a));return;}
 if(action==53&&p->makingTurn&&(townWindow||ENGINE->windows().topWindow<CFortScreen>())){
 const auto town=townWindow?townWindow->town:ENGINE->windows().topWindow<CFortScreen>()->getMobileTown();if(town->getOwner()!=p->playerID)return;auto budget=p->cb->getResourceAmount();auto dest=town->getUpperArmy();std::set<CreatureID> types;int free=0;for(int i=0;i<7;i++){auto c=dest->getCreature(SlotID(i));if(c)types.insert(c->getId());else free++;}
 for(size_t level=0;level<town->creatures.size();level++){const auto & row=town->creatures[level];if(row.second.empty()||row.first<=0)continue;const auto id=row.second.back();if(!types.count(id)&&free==0)continue;const auto creature=id.toCreature();int count=row.first;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects()){const auto cost=creature->getRecruitCost(resource);if(cost>0)count=std::min(count,int(budget[resource]/cost));}if(count<=0)continue;for(const auto resource:LIBRARY->resourceTypeHandler->getAllObjects())budget[resource]-=count*creature->getRecruitCost(resource);if(!types.count(id)){types.insert(id);free--;}p->cb->recruitCreatures(town,dest,id,count,level);}
 lastPublished=0;return;}
 if(action==34){const auto & server=GAME->server();const bool online=server.inLobbyRoom();const bool allowed=(!online||server.isHost())&&p->makingTurn&&!p->mobileHeroMoving()&&(townWindow||ENGINE->windows().topWindow<AdventureMapInterface>());if(allowed)p->cb->save(online?"Saves/Goonk-online-auto":"Saves/Goonk-auto",false);MAIN_THREAD_ASYNC_EM_ASM({window.dispatchEvent(new CustomEvent('goonk-autosave-accepted',{detail:{id:$0,accepted:!!$1}}));},a,allowed);return;}
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
  const auto army=dynamic_cast<const CArmedInstance*>(p->cb->getObj(ObjectInstanceID(a)));
  if(!army||army->getOwner()!=p->playerID||b<0||b>=7||!army->hasStackAtSlot(SlotID(b)))return;
  if(auto old=ENGINE->windows().topWindow<CStackWindow>()){
   if(old->isCommanderLevelUp())return;
   std::static_pointer_cast<CWindowObject>(old)->close();
  }
  if(!ENGINE->windows().topWindow<AdventureMapInterface>()&&!townWindow)return;
  ENGINE->windows().createAndPushWindow<CStackWindow>(&army->getStack(SlotID(b)),false);lastPublished=0;return;
 }
 if(action==59&&p->makingTurn&&!CPlayerInterface::battleInt){
  if(const auto window=ENGINE->windows().topWindow<CStackWindow>())if(const auto stack=window->getMobileStack())if(const auto armyObject=stack->getArmy())if(armyObject->getOwner()==p->playerID){
   const auto slot=armyObject->findStack(stack);UpgradeInfo upgrades(stack->getCreature()->getId());p->cb->fillUpgradeInfo(armyObject,slot,upgrades);const CreatureID target(a);
   const auto & available=upgrades.getAvailableUpgrades();if(std::find(available.begin(),available.end(),target)!=available.end()&&p->cb->getResourceAmount().canAfford(upgrades.getUpgradeCostsFor(target)*stack->getCount())){p->cb->upgradeCreature(armyObject,slot,target);}
  }
  lastPublished=0;return;
 }
 if(action==42&&(ENGINE->windows().topWindow<CFortScreen>()||ENGINE->windows().topWindow<CRecruitmentWindow>())){if(a>=0&&a<int(LIBRARY->creh->objects.size()))ENGINE->windows().createAndPushWindow<CStackWindow>(CreatureID(a).toCreature(),false);lastPublished=0;return;}

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
 if(action==39){if(townWindow&&townWindow->builds&&townWindow->town->getOwner()==p->playerID&&a>=0&&townWindow->town->getTown()->buildings.count(BuildingID(a))&&townWindow->town->hasBuilt(BuildingID(a)))townWindow->builds->buildingClicked(BuildingID(a));lastPublished=0;return;}
 if(action==8&&p->makingTurn&&townWindow&&townWindow->town->getOwner()==p->playerID)
 {
  const BuildingID id(a);
  const auto town=townWindow->town;
  if(p->cb->canBuildStructure(town,id)!=EBuildingState::ALLOWED)return;
  if(id==BuildingID::GRAIL)
  {
   if(townWindow->builds&&visitingHeroHasGrail(town))townWindow->builds->enterTownHall();
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
  if(from&&to&&from!=to&&from->id.getNum()==a&&to->id.getNum()==b&&from->getOwner()==p->playerID&&to->getOwner()==p->playerID&&!from->Slots().empty())p->cb->bulkMoveArmy(from->id,to->id,from->Slots().begin()->first);
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
void publishMobileState(){}
void publishMobileBattleAtlas(){}
bool isMobilePresentationActive(){return false;}
bool requestMobileTownHall(int){return false;}
#endif
