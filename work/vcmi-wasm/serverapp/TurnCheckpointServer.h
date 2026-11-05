/*
 * TurnCheckpointServer.h, part of VCMI engine
 *
 * License: GNU General Public License v2.0 or later
 */

#pragma once

#include <fstream>

#include "../lib/CPlayerState.h"
#include "../lib/VCMIDirs.h"
#include "../lib/callback/GameRandomizer.h"
#include "../lib/gameState/CGameState.h"
#include "../lib/networkPacks/PacksForClient.h"
#include "../lib/serializer/CSaveFile.h"
#include "../server/CGameHandler.h"
#include "../server/CVCMIServer.h"
#include "../server/TurnTimerHandler.h"
#include "../server/battles/BattleProcessor.h"
#include "../server/processors/HeroPoolProcessor.h"
#include "../server/processors/PlayerMessageProcessor.h"
#include "../server/processors/TurnOrderProcessor.h"

class TurnCheckpointServer final : public CVCMIServer
{
public:
	TurnCheckpointServer(uint16_t port, bool runByClient, bool checkpointTurns)
		: CVCMIServer(port, runByClient)
		, checkpointTurns(checkpointTurns)
	{
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
