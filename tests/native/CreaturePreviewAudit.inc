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
 Point measuredCenter;
 size_t count(size_t group) const{return anim->size(group);}
 size_t currentGroup() const{return group;}
 Rect measure(size_t type,size_t index){
  const auto pose=anim->getImage(index,type,false);if(!pose)return Rect();
  const auto dimensions=pose->dimensions();const auto content=pose->contentRect();
  const int x0=std::max(0,content.x),y0=std::max(0,content.y),x1=std::min(dimensions.x,content.x+content.w),y1=std::min(dimensions.y,content.y+content.h);
  if(x1<=x0||y1<=y0)return Rect();
  Canvas canvas(dimensions,CanvasScalingPolicy::IGNORE);canvas.applyTransparency(true);
  canvas.drawColor(Rect(Point(),dimensions),Colors::BLACK);pose->setAlpha(255);pose->setOverlayColor(Colors::TRANSPARENCY);canvas.draw(pose,Point());
  std::vector<ColorRGBA> black;black.reserve((x1-x0)*(y1-y0));for(int y=y0;y<y1;++y)for(int x=x0;x<x1;++x)black.push_back(canvas.getPixel(Point(x,y)));
  canvas.drawColor(Rect(Point(),dimensions),Colors::WHITE);canvas.draw(pose,Point());
  int64_t mass=0,weightedX=0,weightedY=0;
  int left=dimensions.x,top=dimensions.y,right=-1,bottom=-1;
  for(int pass=0;pass<2&&right<left;++pass){mass=weightedX=weightedY=0;size_t at=0;for(int y=y0;y<y1;++y)for(int x=x0;x<x1;++x,++at){const auto light=canvas.getPixel(Point(x,y)),dark=black[at];const int coverage=255-std::clamp(std::max({int(light.r)-int(dark.r),int(light.g)-int(dark.g),int(light.b)-int(dark.b)}),0,255);const bool body=coverage>=192||(coverage>=32&&int(dark.r)+int(dark.g)+int(dark.b)>24);if(pass==0?body:coverage>=32){mass+=coverage;weightedX+=int64_t(x)*coverage;weightedY+=int64_t(y)*coverage;left=std::min(left,x);top=std::min(top,y);right=std::max(right,x);bottom=std::max(bottom,y);}}}
  measuredCenter=mass?Point(int(weightedX/mass),int(weightedY/mass)):Point();
  if(right<left)return Rect();const int x=std::max(0,left-1),y=std::max(0,top-1);return Rect(x,y,std::min(dimensions.x,right+2)-x,std::min(dimensions.y,bottom+2)-y);
 }
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
    preview.startPreview(false);for(int n=0;n<14;++n){preview.reset();report["scheduledGroups"].Vector().push_back(JsonNode(int(preview.currentGroup())));}
    const bool inspect=c->getFactionID().getNum()>=0&&c->getFactionID().toFaction()->getJsonKey()=="goonk:goonk" || id==217;
    int frames=0,groups=0,empty=0;double minimum=1.0,maximum=0.0;bool representative=false;
    for(const size_t group:{2u,0u,3u,4u,12u,14u,15u,16u,18u,20u,21u}){
     if(!preview.count(group))continue;++groups;
     for(size_t frame=0;frame<preview.count(group);++frame){
      if(!preview.set(group,frame,frame+1))continue;
      const auto measured=preview.measure(group,frame);if(measured.w>0&&measured.h>0){JsonNode crop;for(const int value:{int(group),int(frame),measured.x,measured.y,measured.w,measured.h,preview.measuredCenter.x,preview.measuredCenter.y})crop.Vector().push_back(JsonNode(value));report["nativeCrops"].Vector().push_back(crop);}
      target.drawColor(Rect(0,0,100,130),Colors::TRANSPARENCY);const auto started=SDL_GetPerformanceCounter();preview.showMobilePreview(target,Rect(0,0,100,130));const double micros=double(SDL_GetPerformanceCounter()-started)*1000000.0/SDL_GetPerformanceFrequency();report["drawMicros"].Vector().push_back(JsonNode(micros));++frames;
      uint32_t digest=2166136261u;for(int y=0;y<130;++y)for(int x=0;x<100;++x){const auto p=target.getPixel(Point(x,y));for(const auto value:{p.r,p.g,p.b,p.a})digest=(digest^value)*16777619u;}report["frameHashes"][std::to_string(group)].Vector().push_back(JsonNode(int64_t(digest)));
      if(inspect&&((group==2&&frame==0)||group==12||group==15||group==18)){JsonNode sample;sample["group"].Integer()=group;sample["frame"].Integer()=frame;for(int y=0;y<130;++y)for(int x=0;x<100;++x){const auto p=target.getPixel(Point(x,y));for(const auto value:{p.r,p.g,p.b,p.a})sample["rgba"].Vector().push_back(JsonNode(double(value)));}report["sampleFrames"].Vector().push_back(sample);}
      int left=100,top=130,right=-1,bottom=-1;
      for(int y=0;y<130;++y)for(int x=0;x<100;++x)if(target.getPixel(Point(x,y)).a>=32){left=std::min(left,x);top=std::min(top,y);right=std::max(right,x);bottom=std::max(bottom,y);}
      if(right<left){++empty;continue;}
      const double fill=std::max((right-left+1)/100.0,(bottom-top+1)/130.0);minimum=std::min(minimum,fill);maximum=std::max(maximum,fill);
      if(group==2&&!report["restFill"].isNumber()){
       report["restFill"].Float()=fill;report["restFrame"].Integer()=frame;
       if(fill<0.75){JsonNode issue;issue["kind"].String()="resting-body-too-small";issue["fill"].Float()=fill;report["marginFailures"].Vector().push_back(issue);}
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
