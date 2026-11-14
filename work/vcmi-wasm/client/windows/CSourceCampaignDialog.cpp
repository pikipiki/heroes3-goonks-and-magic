/* GPL-2.0-or-later. */
#include "StdInc.h"
#include "CSourceCampaignDialog.h"
#include "../CPlayerInterface.h"
#include "../GameEngine.h"
#include "../GameInstance.h"
#include "../gui/WindowHandler.h"
#include "../gui/Shortcut.h"
#include "../widgets/CTextInput.h"
#include "../widgets/Buttons.h"
#include "../widgets/TextControls.h"
#include "../widgets/Images.h"
#include "../widgets/CComponent.h"
#include "../../lib/callback/CCallback.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/era/EraCampaignDialogs.h"
#include "../../lib/era/EraCampaignPictures.h"
#include "../../lib/era/EraCampaignMedia.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/modding/CModHandler.h"
#include "../../lib/filesystem/Filesystem.h"
namespace
{
CreatureID campaignCreature(int source)
{
 for(const auto & binding:era_bridge::sourceCreatureLevelBindings)if(binding.sourceId==source)
 {
  const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",std::string(binding.key),true);
  if(id)return CreatureID(*id);
 }
 throw std::runtime_error("Original campaign picture has an unbound creature");
}
JsonNode bounds(const Rect & r)
{JsonNode result;result["x"].Integer()=r.x;result["y"].Integer()=r.y;result["w"].Integer()=r.w;result["h"].Integer()=r.h;return result;}
}
CSourceCampaignDialog::CSourceCampaignDialog(QueryID query,const JsonNode & description):model(description)
{
 OBJECT_CONSTRUCTION;
 ID=query;pos=Rect(0,0,620,520);
 backgroundTexture=std::make_shared<CFilledTexture>(ImagePath::builtin("DiBoxBck"),pos);
 text=std::make_shared<CTextBox>(model["text"].String(),Rect(20,18,580,160),0,FONT_MEDIUM,ETextAlignment::TOPLEFT,Colors::WHITE);
 const auto kind=model["kind"].String();
 if(!model["inputLabel"].String().empty())
 {
  inputLabel=std::make_shared<CLabel>(20,194,FONT_SMALL,ETextAlignment::TOPLEFT,Colors::YELLOW,model["inputLabel"].String());
  input=std::make_shared<CTextInput>(Rect(20,214,580,34),FONT_MEDIUM,ETextAlignment::TOPLEFT,false);
 }
 if(kind=="pictures")
 {
  model["choices"].Vector();
  for(std::size_t i=0;i<model["pictures"].Vector().size();++i)
  {
   const auto & picture=model["pictures"].Vector()[i];
   const auto data=era_campaign_pictures::component(picture["type"].Integer(),picture["subtype"].Integer(),campaignCreature);
   if(!data)continue;
   auto component=std::make_shared<CComponent>(*data);
   component->moveTo(Point(50+int(i)*180,265));illustrations.push_back(component);
   if(i<2){JsonNode choice;choice["label"].String()=component->getSubtitle();choice["value"].Integer()=model["pictureMode"].Integer()==7?(i==0?1:0):int(i)+1;model["choices"].Vector().push_back(choice);}
  }
 }
 else for(std::size_t index=0;index<model["pictures"].Vector().size();++index)
 {
  const auto & picture=model["pictures"].Vector()[index];if(picture["file"].String().empty())continue;
  for(const auto & candidate:era_campaign_media::candidates(picture["file"].String()))
  {
   const auto path=ImagePath::builtin(candidate.resource);if(!CResourceHandler::get()->existsResource(path))continue;
   auto image=std::make_shared<CPicture>(path,20+int(index)*140,260);
   const double scale=std::min({1.0,100.0/image->pos.w,100.0/image->pos.h});
   image->scaleTo(Point(std::max(1,int(image->pos.w*scale)),std::max(1,int(image->pos.h*scale))));
   image->moveBy(Point((100-image->pos.w)/2,(100-image->pos.h)/2));customPictures.emplace_back(index,image);
   if(LIBRARY->modh->findResourceOrigin(ResourcePath(candidate.resource,EResType::IMAGE))=="wake-of-gods.mapsupport")model["pictures"].Vector()[index]["mediaKey"].String()=candidate.key;
   break;
  }
 }
 selection=kind=="checklist"?int(model["initial"].Integer()):model["choices"].Vector().empty()?0:int(model["choices"].Vector().front()["value"].Integer());
 for(std::size_t i=0;i<model["choices"].Vector().size();++i)
 {
  const auto & choice=model["choices"].Vector()[i];const int value=choice["value"].Integer();
  auto button=std::make_shared<CButton>(Point(20+int(i%3)*196,(!illustrations.empty()||!customPictures.empty()?380:260)+int(i/3)*48),AnimationPath::builtin("settingsWindow/button190"),CButton::tooltip(choice["hint"].String()),[this,value](){choose(value);});
  button->setTextOverlay(choice["label"].String(),FONT_SMALL,Colors::WHITE);choiceButtons.push_back(button);
 }
 auto confirm=std::make_shared<CButton>(Point(420,465),AnimationPath::builtin("IOKAY.DEF"),CButton::tooltip(),[this](){this->confirm();});confirm->assignedKey=EShortcut::GLOBAL_RETURN;buttons.push_back(confirm);
 if(model["canCancel"].Bool())
 {auto cancel=std::make_shared<CButton>(Point(520,465),AnimationPath::builtin("ICANCEL.DEF"),CButton::tooltip(),[this](){submit(model["kind"].String()=="extended"?-1:0,input?input->getText():std::string());});cancel->assignedKey=EShortcut::GLOBAL_CANCEL;buttons.push_back(cancel);}
 if(model["draft"].isStruct())selection=model["draft"]["selection"].Integer();
 model["selection"].Integer()=selection;
 if(input){input->setText(model["draft"]["text"].String());input->setCallback([this](const std::string & text){draft(selection,text);});}
 center();choose(kind=="checklist"&&model["multiple"].Bool()?0:selection);ready=true;
}
void CSourceCampaignDialog::choose(int value)
{
 if(model["kind"].String()=="checklist"&&model["multiple"].Bool())selection^=value;else selection=value;
 for(std::size_t i=0;i<choiceButtons.size();++i)
 {const int bit=model["choices"].Vector()[i]["value"].Integer();choiceButtons[i]->setBorderColor((model["kind"].String()=="checklist"?(selection&bit)!=0:selection==bit)?Colors::YELLOW:Colors::WHITE);}
 redraw();if(ready)draft(selection,input?input->getText():std::string());
}
void CSourceCampaignDialog::draft(int value,const std::string & answer)
{
 if(!ready||submitted||!GAME->interface()||answer.size()>2048)return;
 try{JsonNode definitions;era_campaign::State candidate;era_campaign::Context context;era_campaign_dialogs::Dialogs check(definitions,candidate,context);check.reply(model,value,answer);}
 catch(const std::runtime_error &){return;}
 selection=value;if(input&&input->getText()!=answer)input->setText(answer);
 GAME->interface()->cb->sourceCampaignReply(ID,value,answer,false);
}
void CSourceCampaignDialog::confirm(){submit(selection,input?input->getText():std::string());}
void CSourceCampaignDialog::submit(int value,const std::string & answer)
{
 if(submitted||!GAME->interface()||answer.size()>2048)return;
 try{JsonNode definitions;era_campaign::State candidate;era_campaign::Context context;era_campaign_dialogs::Dialogs check(definitions,candidate,context);check.reply(model,value,answer);}
 catch(const std::runtime_error &){return;}
 if(GAME->interface()->cb->sourceCampaignReply(ID,value,answer)<0)return;
 submitted=true;close();
}
JsonNode CSourceCampaignDialog::presentation()const
{
 auto result=model;result["queryId"].Integer()=ID.getNum();
 for(std::size_t i=0;i<illustrations.size()&&i<result["pictures"].Vector().size();++i)result["pictures"].Vector()[i]["rect"]=bounds(illustrations[i]->image?illustrations[i]->image->pos:illustrations[i]->pos);
 for(const auto & image:customPictures)result["pictures"].Vector()[image.first]["rect"]=bounds(image.second->pos);
 for(std::size_t i=0;i<choiceButtons.size();++i)result["choices"].Vector()[i]["rect"]=bounds(choiceButtons[i]->pos);
 return result;
}
