/* H3 experience words apply only to admitted source campaigns. */
#pragma once
#include "EraCampaignAdmission.h"
#include "EraCampaignChestRule.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../StartInfo.h"
#include "../campaign/CampaignState.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_experience_word
{
inline bool active(const CGHeroInstance & hero)
{
 if(!hero.cb)return false;
 const auto & state=hero.cb->gameState();
 if(era_campaign_admission::admitted(state.getSourceCampaignState()))return true;
 const auto * start=state.getStartInfo();if(!start||!start->campState)return false;
 // Carried heroes are initialized before the next scenario's source VM.
 const auto & carry=start->campState->getSourceCampaignVariables();
 return era_campaign_admission::programAdmitted(carry["sourceExperienceProgramId"].String(),carry["sourceExperienceProgramSha256"].String());
}
}
VCMI_LIB_NAMESPACE_END
