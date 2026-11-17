#include "Global.h"
#include "era/EraHenchmanCampaign.h"
#include <cassert>

int main()
{
    using era_compat::henchmen::prepareCampaignTransfer;
    JsonNode original;
    original["experience"].Integer()=15000;
    auto & companion=original["henchman"];
    companion["type"].String()="core:peasant";
    companion["experience"].Integer()=790;
    companion["stackExperience"].Integer()=7500;
    companion["alive"].Bool()=false;
    companion["declined"].Bool()=true;
    companion["banner"].Integer()=8;
    for(const bool oldTransfer:{false,true})
      for(const bool freeBanner:{false,true})
        for(const int style:{-1,0,1,8})
        {
            auto next=original;next["henchman"]["banner"].Integer()=style;
            prepareCampaignTransfer(next,oldTransfer,freeBanner);
            const auto & result=next["henchman"];
            assert(result["stackExperience"].Integer()==0);
            assert(result["experience"].Integer()==790);
            assert(result["type"].String()=="core:peasant");
            assert(!result["alive"].Bool()&&result["declined"].Bool());
            assert(result["banner"].Integer()==(oldTransfer&&freeBanner&&style>0?style:-1));
            assert(next["experience"].Integer()==15000);
            auto repeated=next;prepareCampaignTransfer(repeated,oldTransfer,freeBanner);
            assert(repeated==next);
        }
    assert(original["henchman"]["stackExperience"].Integer()==7500);
    assert(original["henchman"]["banner"].Integer()==8);
}
