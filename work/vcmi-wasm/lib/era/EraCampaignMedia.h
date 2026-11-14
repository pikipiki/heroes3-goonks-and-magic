/* Virtual resource lookup for original Windows campaign artwork paths. */
#pragma once
#include <string>
#include <vector>
namespace era_campaign_media
{
struct Candidate{std::string resource,key;};
inline std::vector<Candidate> candidates(std::string path)
{
 if(path.empty()||path.size()>1024)return {};
 std::string normalized;
 for(auto c:path)
 {
  if(c=='\\')c='/';
  if(c>='A'&&c<='Z')c=static_cast<char>(c-'A'+'a');
  if(!((c>='a'&&c<='z')||(c>='0'&&c<='9')||c=='/'||c=='_'||c=='.'||c=='-'||c==' '))return {};
  if(c!='/'||normalized.empty()||normalized.back()!='/')normalized+=c;
 }
 while(normalized.rfind("./",0)==0)normalized.erase(0,2);
 for(const std::string prefix:{"../data/zvs/cmp.res/","data/zvs/cmp.res/","zvs/cmp.res/"})
  if(normalized.rfind(prefix,0)==0)
  {
   auto name=normalized.substr(prefix.size());if(name.empty()||name.find('/')!=std::string::npos||name=="..")return {};
   auto key=name;if(key.size()>4&&key.substr(key.size()-4)==".pcx")key.replace(key.size()-4,4,".bmp");
   return{{"DATA/ZVS/CMP.RES/"+name,"cmp.res/"+key}};
  }
 if(normalized.empty()||normalized.front()=='/'||normalized==".."||normalized.rfind("../",0)==0||normalized.find("/../")!=std::string::npos||(normalized.size()>=3&&normalized.substr(normalized.size()-3)=="/.."))return {};
 auto key=normalized;if(key.size()>4&&key.substr(key.size()-4)==".pcx")key.replace(key.size()-4,4,".bmp");
 return{{"MAPS/"+normalized,{}},{normalized,{}},{"DATA/"+normalized,"portraits/"+key},{"SPRITES/"+normalized,{}}};
}
}
