#include "../../work/vcmi-wasm/lib/era/EraCampaignDrawingDepth.h"
#include <cassert>
#include <string>
#include <vector>
int main()
{
 const auto sample=[](const std::vector<std::string> & mask,int x,int y,int priority=0)
 {
  return era_campaign_drawing::depth(x,y,priority,[&](int column,int row)
  {
   const int line=int(mask.size())-1-row;
   if(line<0||line>=int(mask.size()))return false;
   const int at=int(mask[line].size())-1-column;
   return at>=0&&(mask[line][at]=='B'||mask[line][at]=='A');
  });
 };
 // Actual zc1-0 deletion at56/9: Inferno town anchor56/9 versus
 // ore pit anchor58/10. The pit is a ground-priority template.
 const std::vector<std::string> town={"VVVVVV","VVVVVV","VVVVVV","VVBBBV","VBBBBB","VBBABB"};
 const std::vector<std::string> mine={"BBB","BAB"};
 assert(sample(town,0,0)==1);
 assert(sample(mine,2,1,100)==0);
 assert(sample(town,0,0)>sample(mine,2,1,100));
 // Ground-priority templates stay at zero even where their footprint blocks.
 for(int x=0;x<8;++x)for(int y=0;y<6;++y)assert(sample(town,x,y,100)==0);
 // A new blocked strip above a passable cell starts another depth run.
 assert(sample({"B","V","B"},0,0)==1);
 assert(sample({"B","V","B"},0,1)==2);
 assert(sample({"B","V","B"},0,2)==1);
 // A passable cell inherits the depth of a blocked neighbour to its right.
 assert(sample({"VB","BB"},1,1)==2);
 // Both extremes of the original fixed mask are admitted; foreign geometry
 // must not silently acquire an arbitrary priority.
 assert(sample({"V"},7,5)==6);
 for(const auto & point:std::vector<std::pair<int,int>>{{-1,0},{8,0},{0,-1},{0,6}})
 {bool rejected=false;try{sample(town,point.first,point.second);}catch(const std::runtime_error &){rejected=true;}assert(rejected);}
}
