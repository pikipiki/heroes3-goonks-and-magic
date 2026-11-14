#include "../../work/vcmi-wasm/lib/era/EraCampaignMedia.h"
#include <cassert>
int main(){
 using era_campaign_media::candidates;
 auto a=candidates("..\\Data\\ZVS\\Cmp.res\\11_013.bmp");assert(a.size()==1&&a[0].resource=="DATA/ZVS/CMP.RES/11_013.bmp"&&a[0].key=="cmp.res/11_013.bmp");
 auto b=candidates("Z11p_1L.pcx");assert(b.size()==4&&b[2].resource=="DATA/z11p_1l.pcx"&&b[2].key=="portraits/z11p_1l.bmp");
 for(auto bad:{"../../secret","../Data/ZVS/Cmp.res/../x.bmp","/etc/passwd","a/../b","x/..","x:\\file","https://host/img.bmp"})assert(candidates(bad).empty());
 assert(candidates("Maps/custom.bmp")[0].key.empty());
}
