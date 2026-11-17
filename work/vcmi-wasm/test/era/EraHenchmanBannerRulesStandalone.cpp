#include "../../lib/era/EraHenchmanBannerRules.h"
#include "../../lib/era/EraHenchmanBannerSourceRows.h"
#include "../../lib/era/EraExperienceHealth.h"
#include <cassert>

using namespace era_bridge::henchmen;

int main()
{
    // These expected values follow the source ApplyMod statements, including
    // its surprising '=' and negative '%' results, rather than VCMI's native
    // banner definitions (which use different constant percentages).
    assert(experienceScalarRow(15,'H','%',10,BannerStyle::HEALTH)==20);
    assert(experienceScalarRow(15,'H','%',10,BannerStyle::ATTACK)==17);
    assert(experienceScalarRow(17,'A','+',3,BannerStyle::ATTACK)==25);
    assert(experienceScalarRow(17,'D','-',3,BannerStyle::DEFENCE)==13);
    assert(experienceScalarRow(17,'A','=',3,BannerStyle::ATTACK)==8);
    assert(experienceScalarRow(17,'m','%',0,BannerStyle::DAMAGE)==18);
    assert(experienceScalarRow(17,'M','+',2,BannerStyle::DAMAGE)==22);
    assert(experienceScalarRow(7,'S','+',1,BannerStyle::SPEED)==10);
    assert(experienceScalarRow(10,'A','%',-7,BannerStyle::ATTACK)==11);
    assert(experienceScalarRow(17,'A','+',3,BannerStyle::EXPERIENCE)==20);
    assert(experienceScalarRow(17,'A','+',3,BannerStyle::NONE)==20);

    assert(bannerReducedDefence(19,false,'+',0,BannerStyle::DEFENCE_REDUCTION)==14);
    assert(bannerReducedDefence(19,true,'+',30,BannerStyle::DEFENCE_REDUCTION)==8);
    assert(bannerReducedDefence(100,true,'+',95,BannerStyle::DEFENCE_REDUCTION)==0);
    assert(bannerReducedDefence(100,true,'+',-5,BannerStyle::DEFENCE_REDUCTION)==75);
    assert(bannerReducedDefence(19,false,'+',0,BannerStyle::HEALTH)==19);

    assert(bannerPartialBlockPercent(40,30,40,25,BannerStyle::PARTIAL_BLOCK)==50);
    assert(bannerPartialBlockPercent(40,70,40,25,BannerStyle::PARTIAL_BLOCK)==70);
    assert(bannerPartialBlockPercent(40,70,41,25,BannerStyle::PARTIAL_BLOCK)==50);
    assert(bannerPartialBlockPercent(40,70,40,26,BannerStyle::PARTIAL_BLOCK)==70);
    assert(bannerPartialBlockPercent(40,70,41,26,BannerStyle::PARTIAL_BLOCK)==0);
    assert(bannerPartialBlockPercent(0,70,1,25,BannerStyle::PARTIAL_BLOCK)==50);
    assert(bannerPartialBlockPercent(40,70,41,1,BannerStyle::NONE)==0);
    assert(bannerRetaliations(1,2,BannerStyle::RETALIATIONS)==5);
    assert(bannerRetaliations(1,2,BannerStyle::NONE)==3);

    StackExperienceTable table{10000,2000,20,1000};
    assert(stackExperienceGain(0,5000,true,table)==3000);
    assert(stackExperienceGain(0,100,true,table)==150);
    assert(stackExperienceGain(11900,100,true,table)==12000);

    Settings settings;
    assert(initialBanner(settings)==BannerStyle::NONE);
    settings.freeBanner=true;
    assert(initialBanner(settings)==BannerStyle::HEALTH);
    assert(!bannerWrittenToCampaignIni(BannerStyle::HEALTH,settings));
    assert(!bannerWrittenToCampaignIni(BannerStyle::NONE,settings));
    assert(bannerWrittenToCampaignIni(BannerStyle::ATTACK,settings));
    settings.banner=false;
    assert(initialBanner(settings)==BannerStyle::NONE);
    assert(validBannerStyle(-1)&&validBannerStyle(8)&&!validBannerStyle(9));
    const auto * peasants=sourceExperienceTable(0);
    assert(peasants&&peasants->rank10==17500&&peasants->aboveRank10==12250);
    assert(peasants->battleCapPercent==50&&peasants->multiplier==1000);
    const auto * skeletons=sourceExperienceTable(56);
    assert(skeletons&&skeletons->multiplier==500);
    assert(stackExperienceGain(0,101,true,*skeletons)==75);
    int healthRows=0;
    for(const auto & row:sourceBannerRows)
    {
        assert(row.slot>=0&&row.slot<14);
        if(row.sourceId==0&&row.code=='H')
        {
            ++healthRows;
            assert(row.modifier=='%'&&row.values[0]==0&&row.values[10]==50);
            assert(experienceScalarRow(51,row.code,row.modifier,row.values[0],BannerStyle::HEALTH)==53);
        }
    }
    assert(healthRows==1);
    // Cross-check the generic EA arithmetic against the separately attested
    // native health-percent adapter across float32 rounding boundaries.
    for(int base:{1,51,127,999,10001,999983,16777215,16777216})
        for(int percent=0;percent<=255;++percent)
            assert(experienceScalarRow(base,'H','%',percent,BannerStyle::NONE)
                ==era_bridge::sourceExperienceHealth(base,percent));
}
