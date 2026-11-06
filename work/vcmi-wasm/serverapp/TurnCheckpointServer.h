/*
 * TurnCheckpointServer.h, part of VCMI engine
 *
 * License: GNU General Public License v2.0 or later
 */

#pragma once

#include <fstream>
#include <sstream>

#include "../lib/CPlayerState.h"
#include "../lib/VCMIDirs.h"
#include "../lib/callback/GameRandomizer.h"
#include "../lib/gameState/CGameState.h"
#include "../lib/filesystem/Filesystem.h"
#include "../lib/mapping/CMapInfo.h"
#include "../lib/networkPacks/PacksForClient.h"
#include "../lib/serializer/CSaveFile.h"
#include "../server/CGameHandler.h"
#include "../server/CVCMIServer.h"
#include "../server/TurnTimerHandler.h"
#include "../server/battles/BattleProcessor.h"
#include "../server/processors/HeroPoolProcessor.h"
#include "../server/processors/PlayerMessageProcessor.h"
#include "../server/processors/TurnOrderProcessor.h"

class TurnCheckpointServer : public CVCMIServer
{
public:
	TurnCheckpointServer(uint16_t port, bool runByClient, bool checkpointTurns, bool discover = true)
		: CVCMIServer(port, runByClient, discover)
		, checkpointTurns(checkpointTurns)
	{
	}

	// Use the saved assignment verbatim. Lobby map selection reallocates seats
	// in connection order, which is inappropriate for a hosted checkpoint.
	void loadTurnCheckpoint()
	{
		const auto checkpoint = VCMIDirs::get().userSavePath() / "Hosted-Turn.vsgm1";
		const ResourcePath resource("Saves/Hosted-Turn", EResType::SAVEGAME);
		const auto resolved = CResourceHandler::get()->getResourceName(resource);
		if(!resolved || !boost::filesystem::equivalent(*resolved, checkpoint))
			throw std::runtime_error("Hosted checkpoint missing from the match save directory");

		std::ifstream input(checkpoint.c_str(), std::ios::binary | std::ios::ate);
		const auto size = input.tellg();
		if(size < 48)
			throw std::runtime_error("Invalid hosted checkpoint size");
		input.seekg(-48, std::ios::end);
		std::string trailer(48, '\0');
		if(!input.read(trailer.data(), trailer.size()))
			throw std::runtime_error("Could not read hosted checkpoint trailer");
		const std::string prefix = "\nGOONK-TURN/1 ";
		const auto marker = trailer.rfind(prefix);
		int seat = -1;
		int day = 0;
		if(marker != std::string::npos)
		{
			std::istringstream turn(trailer.substr(marker + prefix.size()));
			turn >> seat >> day;
		}
		if(seat < 0 || seat >= PlayerColor::PLAYER_LIMIT_I || day <= 0
			|| trailer.substr(marker) != prefix + std::to_string(seat) + " " + std::to_string(day) + "\n")
			throw std::runtime_error("Invalid hosted checkpoint turn marker");

		auto map = std::make_shared<CMapInfo>();
		map->saveInit(resource);
		StartInfo saved = *map->scenarioOptionsOfSave;
		saved.mode = EStartMode::LOAD_GAME;
		saved.mapname = map->fileURI;
		const PlayerColor active(seat);
		const auto player = saved.playerInfos.find(active);
		if(player == saved.playerInfos.end() || !player->second.isControlledByHuman())
			throw std::runtime_error("Hosted checkpoint turn must belong to a human seat");

		auto handler = std::make_shared<CGameHandler>(*this);
		handler->load(saved);
		if(handler->gameState().getDate() != day || !handler->turnOrder->isPlayerMakingTurn(active))
			throw std::runtime_error("Hosted checkpoint turn marker does not match saved state");

		mi = std::move(map);
		si = std::make_shared<StartInfo>(std::move(saved));
		gh = std::move(handler);
		logGlobal->info("Restored hosted checkpoint for seat %d on day %d", seat, day);
	}

	void applyPack(CPackForClient & pack) override
	{
		CVCMIServer::applyPack(pack);
		if(!checkpointTurns)
			return;

		const auto * turn = dynamic_cast<const PlayerStartsTurn *>(&pack);
		if(!turn || !gh->gameInfo().getPlayerState(turn->player)->isHuman())
			return;

		const auto directory = VCMIDirs::get().userSavePath();
		const auto checkpoint = directory / "Hosted-Turn.vsgm1";
		const auto staging = directory / "Hosted-Turn.tmp";
		try
		{
			CSaveFile save;
			gh->gameState().saveGame(save);
			save.save(*gh);
			save.write(staging);
			// Keep the turn marker and save in one atomic replacement. The VCMI
			// reader consumes the serialized state and ignores the trailing marker.
			std::ofstream marker(staging.c_str(), std::ios::binary | std::ios::app);
			marker.exceptions(std::ios::failbit | std::ios::badbit);
			marker << "\nGOONK-TURN/1 " << static_cast<int>(turn->player.getNum())
				<< ' ' << gh->gameState().getDate() << '\n';
			marker.close();
			boost::filesystem::rename(staging, checkpoint);
		}
		catch(const std::exception & error)
		{
			logGlobal->error("Failed to replace hosted turn checkpoint: %s", error.what());
		}
	}

private:
	const bool checkpointTurns;
};
