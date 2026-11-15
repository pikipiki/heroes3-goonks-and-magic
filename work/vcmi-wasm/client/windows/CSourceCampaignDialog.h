/* Native query window for original campaign text and multi-choice dialogs. */
#pragma once
#include "InfoWindows.h"
#include "../../lib/era/EraCampaignMovies.h"
#include "../../lib/json/JsonNode.h"
class CTextInput;
class CPicture;
class CAnimImage;
class CSourceCampaignDialog : public CInfoWindow
{
 bool submitted=false,ready=false;
 std::vector<std::shared_ptr<CButton>> choiceButtons;
 std::vector<std::shared_ptr<CComponent>> illustrations;
 std::vector<std::pair<std::size_t,std::shared_ptr<CPicture>>> customPictures;
 struct MovieImage{std::size_t index;std::shared_ptr<CAnimImage> image;const era_campaign_media::Movie * source;std::size_t frame=0;};
 std::vector<MovieImage> moviePictures;
 std::uint64_t movieElapsed=0;
 std::shared_ptr<CTextInput> input;
 std::shared_ptr<CLabel> inputLabel;
public:
 JsonNode model;
 int selection=0;
 explicit CSourceCampaignDialog(QueryID query,const JsonNode & description);
 void choose(int value);
 void submit(int value,const std::string & answer);
 void confirm();
 void draft(int value,const std::string & answer);
 void keyPressed(EShortcut key) override;
 void tick(uint32_t milliseconds) override;
 JsonNode presentation() const;
};
