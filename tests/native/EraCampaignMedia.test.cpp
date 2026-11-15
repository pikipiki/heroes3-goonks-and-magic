#include "../../work/vcmi-wasm/lib/era/EraCampaignMovies.h"
#include <cassert>
int main(){
 using era_campaign_media::candidates;
 auto a=candidates("..\\Data\\ZVS\\Cmp.res\\11_013.bmp");assert(a.size()==1&&a[0].resource=="DATA/ZVS/CMP.RES/11_013.bmp"&&a[0].key=="cmp.res/11_013.bmp");
 auto b=candidates("Z11p_1L.pcx");assert(b.size()==4&&b[2].resource=="DATA/z11p_1l.pcx"&&b[2].key=="portraits/z11p_1l.bmp");
 for(auto bad:{"../../secret","../Data/ZVS/Cmp.res/../x.bmp","/etc/passwd","a/../b","x/..","x:\\file","https://host/img.bmp"})assert(candidates(bad).empty());
 assert(candidates("Maps/custom.bmp")[0].key.empty());
 for(const auto & movie:era_campaign_media::movies){assert(era_campaign_media::movie(std::string("../Data/ZVS/")+movie.key)==&movie);assert(era_campaign_media::movieFrame(movie,0)==0);assert(era_campaign_media::movieFrame(movie,66)==0);assert(era_campaign_media::movieFrame(movie,67)==1);assert(era_campaign_media::movieFrame(movie,1000)==15%movie.frames);}
 const auto * sun=era_campaign_media::movie("..\\Data\\ZVS\\Cmp.res\\11_sun.avi");assert(sun&&sun->frames==5&&sun->width==80&&sun->height==80);
 assert(era_campaign_media::movieFrame(*sun,333)==4&&era_campaign_media::movieFrame(*sun,334)==0);
 assert(!era_campaign_media::movie("../../11_sun.avi")&&!era_campaign_media::movie("../Data/ZVS/Cmp.res/unknown.avi"));
}
