// Test-only instrumentation. Append to MobileBridge.cpp in an isolated audit build;
// restore that file and rebuild before preparing any public engine archive.
#ifdef VCMI_EMSCRIPTEN
#include <fstream>
#include "render/CAnimation.h"
#include "render/Colors.h"
#include "widgets/Images.h"
class CreaturePreviewAudit final : public CCreatureAnim
{
public:
 using CCreatureAnim::CCreatureAnim;
 size_t count(size_t group) const{return anim->size(group);}
};
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiAuditCreaturePreview(int id)
{
 if(!ENGINE)return;
 ENGINE->dispatchMainThread([id](){
  JsonNode report;
  try{
   if(id<0){
    for(size_t i=0;i<LIBRARY->creh->objects.size();++i){
     const auto & c=LIBRARY->creh->objects[i];if(!c)continue;
     JsonNode item;item["id"].Integer()=i;item["key"].String()=c->getJsonKey();item["name"].String()=c->getNameSingularTranslated();
     item["animated"].Bool()=!c->animDefName.empty();item["animation"].String()=c->animDefName.getOriginalName();
     const auto faction=c->getFactionID();item["factionId"].Integer()=faction.getNum();item["faction"].String()=faction.getNum()>=0?faction.toFaction()->getJsonKey():"neutral";
     report["creatures"].Vector().push_back(item);
    }
   }else{
    const auto c=CreatureID(id).toCreature();report["id"].Integer()=id;report["key"].String()=c->getJsonKey();
    CreaturePreviewAudit preview(0,0,c->animDefName,0,ECreatureAnimType::HOLDING);
    Canvas target(Point(100,130),CanvasScalingPolicy::IGNORE);target.applyTransparency(true);
    int frames=0,groups=0,empty=0;double minimum=1.0,maximum=0.0;bool representative=false;
    for(const size_t group:{2u,0u,3u,4u,12u,14u,15u,16u,18u,20u,21u}){
     if(!preview.count(group))continue;++groups;
     for(size_t frame=0;frame<preview.count(group);++frame){
      if(!preview.set(group,frame,frame+1))continue;
      target.drawColor(Rect(0,0,100,130),Colors::TRANSPARENCY);preview.showMobilePreview(target,Rect(0,0,100,130));++frames;
      int left=100,top=130,right=-1,bottom=-1;
      for(int y=0;y<130;++y)for(int x=0;x<100;++x)if(target.getPixel(Point(x,y)).a>=32){left=std::min(left,x);top=std::min(top,y);right=std::max(right,x);bottom=std::max(bottom,y);}
      if(right<left){++empty;continue;}
      const double fill=std::max((right-left+1)/100.0,(bottom-top+1)/130.0);minimum=std::min(minimum,fill);maximum=std::max(maximum,fill);
      if(left<8||top<10||right>91||bottom>119){JsonNode issue;issue["group"].Integer()=group;issue["frame"].Integer()=frame;issue["left"].Integer()=left;issue["top"].Integer()=top;issue["right"].Integer()=right;issue["bottom"].Integer()=bottom;report["marginFailures"].Vector().push_back(issue);}
      if(fill<0.6){
       JsonNode low;low["group"].Integer()=group;low["frame"].Integer()=frame;low["fill"].Float()=fill;
       for(int y=0;y<130;++y)for(int x=0;x<100;++x){const auto p=target.getPixel(Point(x,y));for(const auto value:{p.r,p.g,p.b,p.a})low["rgba"].Vector().push_back(JsonNode(double(value)));}
       report["lowFrames"].Vector().push_back(low);
      }
      if(!representative){
       representative=true;
       for(int y=0;y<130;++y)for(int x=0;x<100;++x){const auto p=target.getPixel(Point(x,y));for(const auto value:{p.r,p.g,p.b,p.a})report["rgba"].Vector().push_back(JsonNode(double(value)));}
      }
     }
    }
    report["frames"].Integer()=frames;report["groups"].Integer()=groups;report["emptyFrames"].Integer()=empty;report["minFill"].Float()=minimum;report["maxFill"].Float()=maximum;
   }
  }catch(const std::exception & e){report["error"].String()=e.what();}
  std::ofstream file("/tmp/goonk-preview-audit-"+std::to_string(id)+".json",std::ios::binary);file<<report.toCompactString();
 });
}
#endif
