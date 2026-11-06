/*
 * HostedRestoreServer.h, part of VCMI engine
 *
 * License: GNU General Public License v2.0 or later
 */

#pragma once

#include "TurnCheckpointServer.h"

#include "../lib/mapping/CMapHeader.h"
#include "../lib/mapping/GoonkScenario.h"
#include "../lib/mapObjects/CGHeroInstance.h"
#include "../server/queries/QueriesProcessor.h"
#include "../lib/networkPacks/PacksForLobby.h"
#include "../lib/serializer/GameConnection.h"

class HostedRestoreServer final : public TurnCheckpointServer
{
	using Clock = std::chrono::steady_clock;
	const std::string gatewayKey;
	std::map<NetworkConnectionPtr, Clock::time_point> pending;
	std::map<NetworkConnectionPtr, PlayerColor> authorized;
	bool ready = false;

	struct Encounter
	{
		PlayerColor attacker;
		PlayerColor defender;
		ObjectInstanceID hero;
		int3 destination;
	};
	std::optional<Encounter> waitingEncounter;
	std::optional<PlayerColor> completedEncounter;

	bool connected(PlayerColor color) const
	{
		return std::any_of(activeConnections.begin(), activeConnections.end(), [color](const auto & client) {
			return client->connectionID == connectionFor(color);
		});
	}

	static GameConnectionID connectionFor(PlayerColor color)
	{
		return vstd::next(GameConnectionID::FIRST_CONNECTION, color.getNum());
	}

public:
	HostedRestoreServer(uint16_t port, std::string key)
		: TurnCheckpointServer(port, false, true, false)
		, gatewayKey(std::move(key))
	{
		if(gatewayKey.size() != 43 || gatewayKey.find_first_not_of("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-") != std::string::npos)
			throw std::runtime_error("Invalid hosted gateway key");
	}

	static std::set<PlayerColor> parseSeats(const std::string & colors)
	{
		std::set<PlayerColor> seats;
		for(const auto color : colors)
		{
			if(color < '0' || color > '7' || !seats.emplace(color - '0').second)
				throw std::runtime_error("Invalid hosted seat roster");
		}
		if(seats.size() < 2)
			throw std::runtime_error("Hosted matches require at least two seats");
		return seats;
	}

	static bool supportsMap(const CMapInfo & map, const std::set<PlayerColor> & seats)
	{
		if(!map.mapHeader || map.mapHeader->battleOnly || map.amountOfPlayersOnMap != seats.size())
			return false;
		return std::all_of(seats.begin(), seats.end(), [&](PlayerColor color)
		{
			return map.mapHeader->players.at(color.getNum()).canHumanPlay;
		});
	}

	void start(const std::string & mapName, const std::string & colors, const JsonNode & factions)
	{
		const auto seats = parseSeats(colors);
		if(mapName.empty())
			loadTurnCheckpoint();
		else
		{
			auto map = std::make_shared<CMapInfo>();
			map->mapInit(mapName);
			if(!supportsMap(*map, seats))
				throw std::runtime_error("The hosted map must have exactly the configured human seats");
			si->mode = EStartMode::NEW_GAME;
			si->difficulty = 1;
			for(const auto color : seats)
			{
				const auto id = vstd::next(PlayerConnectionID::FIRST_HUMAN, color.getNum());
				playerNames.emplace(id, ClientPlayer{connectionFor(color), color.toString()});
			}
			updateStartInfoOnMapChange(map);
			if(!factions.isNull())
			{
				if(factions.Vector().size() != seats.size())
					throw std::runtime_error("Hosted factions do not match the seat roster");
				size_t index = 0;
				for(const auto color : seats)
				{
					const auto & chosen = factions.Vector().at(index++);
					if(chosen.isNull())
						continue;
					const FactionID faction(chosen.Integer());
					const auto & player = getPlayerInfo(color);
					if(!allowsCastleChoice(player) || !player.allowedFactions.contains(faction))
						throw std::runtime_error("Hosted faction is unavailable on this map");
					optionSetCastle(color, faction);
				}
			}
		}

		if(si->playerInfos.size() != seats.size() || si->turnTimerInfo.isEnabled()
			|| si->simturnsInfo.requiredTurns || si->simturnsInfo.optionalTurns
			|| mi->mapHeader->battleOnly || (gh && !gh->gameState().currentBattles.empty()))
			throw std::runtime_error("Hosted matches require a sequential multiplayer adventure without timers");

		playerNames.clear();
		for(const auto & [color, player] : si->playerInfos)
		{
			if(!seats.contains(color) || player.connectedPlayerIDs.size() != 1 || !player.isControlledByHuman())
				throw std::runtime_error("Hosted roster and human map slots do not match");
			if(!playerNames.emplace(*player.connectedPlayerIDs.begin(), ClientPlayer{connectionFor(color), player.name}).second)
				throw std::runtime_error("Hosted match found a shared player assignment");
		}

		if(!mapName.empty())
		{
			verifyStateBeforeStart(false);
			if(!prepareToStartGame())
				throw std::runtime_error("The hosted map could not be started");
			ready = true;
		}
		if(mapName.empty())
			restoreEncounter(seats);
		startGameImmediately();
		ready = true;
		prepare(false, false);
		const auto port = getNetworkServer().start(getPort(), true);
		logGlobal->info("Hosted match listening on loopback port %d", port);
	}

	void applyPack(CPackForClient & pack) override
	{
		if(ready)
		{
			TurnCheckpointServer::applyPack(pack);
			if(dynamic_cast<const PlayerStartsTurn *>(&pack))
				completedEncounter.reset();
		}
		else
			CVCMIServer::applyPack(pack);
	}

	bool controlsNeutralBattles() const override { return true; }

	bool isEncounterPendingFor(const PlayerColor & color) const override
	{
		return waitingEncounter && waitingEncounter->attacker == color;
	}

	bool deferAttackWhenAbsent(const PlayerColor & attacker, const PlayerColor & defender,
		const ObjectInstanceID & hero, const int3 & destination) override
	{
		if(connected(defender))
			return false;

		InfoWindow message;
		message.player = attacker;
		message.text.appendRawString("Attack paused until the defending player reconnects.");
		if(!waitingEncounter)
		{
			std::ostringstream marker;
			marker << "\nGOONK-ENCOUNTER/1 " << static_cast<int>(attacker.getNum())
				<< ' ' << static_cast<int>(defender.getNum()) << ' ' << hero.getNum()
				<< ' ' << destination.x << ' ' << destination.y << ' ' << destination.z;
			if(writeCheckpoint(attacker, marker.str()))
				waitingEncounter = Encounter{attacker, defender, hero, destination};
			else
				message.text = MetaString::createFromRawString("The waiting attack could not be saved. Try again.");
		}
		sendPack(message, connectionFor(attacker));
		return true;
	}

	void onNewConnection(const NetworkConnectionPtr & connection) override
	{
		if(pending.size() >= 16)
		{
			connection->close();
			return;
		}
		pending.emplace(connection, Clock::now() + std::chrono::seconds(8));
	}

	void onTimer() override
	{
		const auto now = Clock::now();
		std::vector<NetworkConnectionPtr> expired;
		for(const auto & [connection, deadline] : pending)
			if(deadline <= now)
				expired.push_back(connection);

		for(const auto & connection : expired)
			connection->close();

		if(waitingEncounter && connected(waitingEncounter->attacker) && connected(waitingEncounter->defender)
			&& gh->uiReadyForDialogs.contains(waitingEncounter->attacker)
			&& gh->uiReadyForDialogs.contains(waitingEncounter->defender))
		{
			const auto encounter = *std::exchange(waitingEncounter, std::nullopt);
			gh->moveHero(encounter.hero, encounter.destination, EMovementMode::STANDARD, false, encounter.attacker);
			completedEncounter = encounter.attacker;
		}
		if(completedEncounter && gh->gameState().currentBattles.empty() && gh->queries->allQueries().empty()
			&& gh->turnOrder->isPlayerMakingTurn(*completedEncounter) && writeCheckpoint(*completedEncounter))
			completedEncounter.reset();

		CVCMIServer::onTimer();
	}

	void onDisconnected(const NetworkConnectionPtr & connection, const std::string &) override
	{
		const bool wasPending = pending.erase(connection) != 0;
		if(const auto seat = authorized.find(connection); seat != authorized.end())
		{
			if(!wasPending)
				gh->uiReadyForDialogs.erase(seat->second);
			authorized.erase(seat);
		}
		std::erase_if(activeConnections, [&](const auto & client) { return client->isMyConnection(connection); });
	}

	void onPacketReceived(const NetworkConnectionPtr & connection, const std::vector<std::byte> & message) override
	{
		try
		{
			if(auto ticket = authorized.find(connection); ticket != authorized.end())
			{
				if(pending.contains(connection))
					admit(connection, ticket->second, message);
				else
					CVCMIServer::onPacketReceived(connection, message);
				return;
			}

			if(!pending.contains(connection) || message.size() != gatewayKey.size() + 1)
			{
				connection->close();
				return;
			}

			unsigned difference = 0;
			for(size_t i = 0; i < gatewayKey.size(); ++i)
				difference |= std::to_integer<unsigned>(message[i + 1]) ^ static_cast<unsigned char>(gatewayKey[i]);

			const PlayerColor color(std::to_integer<int>(message.front()) - '0');
			if(difference || !color.isValidPlayer() || !si->playerInfos.contains(color))
			{
				connection->close();
				return;
			}
			authorized.emplace(connection, color);
		}
		catch(const std::exception &)
		{
			logNetwork->warn("Closing invalid hosted gameplay connection");
			connection->close();
		}
	}

	void handleReceivedPack(std::shared_ptr<GameConnection> connection, CPackForLobby & pack) override
	{
		if(dynamic_cast<LobbyClientDisconnected *>(&pack))
			connection->getConnection()->close();
	}

private:
	void restoreEncounter(const std::set<PlayerColor> & seats)
	{
		const auto file = VCMIDirs::get().userSavePath() / "Hosted-Turn.vsgm1";
		std::ifstream input(file.c_str(), std::ios::binary | std::ios::ate);
		const auto length = std::min<std::streamoff>(input.tellg(), 256);
		if(length < 1)
			throw std::runtime_error("Could not read hosted encounter marker");
		input.seekg(-length, std::ios::end);
		std::string trailer(length, '\0');
		if(!input.read(trailer.data(), length))
			throw std::runtime_error("Could not read hosted encounter marker");
		const std::string prefix = "\nGOONK-ENCOUNTER/1 ";
		const auto marker = trailer.rfind(prefix);
		const auto turn = trailer.rfind("\nGOONK-TURN/1 ");
		if(marker == std::string::npos || turn == std::string::npos || marker > turn)
			return;

		std::istringstream fields(trailer.substr(marker + prefix.size(), turn - marker - prefix.size()));
		int attacker, defender, hero;
		int3 destination;
		if(!(fields >> attacker >> defender >> hero >> destination.x >> destination.y >> destination.z)
			|| fields.peek() != EOF || attacker < 0 || attacker > 7 || defender < 0 || defender > 7
			|| attacker == defender || hero < 0 || !seats.contains(PlayerColor(attacker)) || !seats.contains(PlayerColor(defender))
			|| !gh->gameState().isInTheMap(destination) || !gh->turnOrder->isPlayerMakingTurn(PlayerColor(attacker)))
			throw std::runtime_error("Invalid hosted encounter marker");
		const auto * attackerHero = gh->gameInfo().getHero(ObjectInstanceID(hero));
		if(!attackerHero || attackerHero->getOwner() != PlayerColor(attacker))
			throw std::runtime_error("Hosted encounter attacker does not match the save");
		waitingEncounter = Encounter{PlayerColor(attacker), PlayerColor(defender), ObjectInstanceID(hero), destination};
	}

	void admit(const NetworkConnectionPtr & connection, PlayerColor color, const std::vector<std::byte> & message)
	{
		if(message.size() > 4096 || !gh->gameState().currentBattles.empty())
		{
			if(!gh->gameState().currentBattles.empty())
				logNetwork->info("Hosted join rejected during active battle for seat %d", color.getNum());
			connection->close();
			return;
		}

		auto client = std::make_shared<GameConnection>(connection);
		auto pack = client->retrievePack(message);
		auto * hello = dynamic_cast<LobbyClientConnected *>(pack.get());
		if(!hello || hello->version != ESerializationVersion::CURRENT)
		{
			logNetwork->info("Hosted join rejected for invalid or incompatible hello from seat %d", color.getNum());
			connection->close();
			return;
		}

		// A valid reconnect can replace a socket left open when a phone was suspended.
		const auto previous = std::find_if(authorized.begin(), authorized.end(), [&](const auto & entry)
		{
			return entry.second == color && !pending.contains(entry.first);
		});
		if(previous != authorized.end())
		{
			const auto old = previous->first;
			onDisconnected(old, "Seat reconnected");
			old->close();
			logNetwork->info("Replaced previous hosted connection for seat %d", color.getNum());
		}

		client->connectionID = connectionFor(color);
		client->setCallback(gh->gameInfo());
		hello->clientId = client->connectionID;
		hello->hostClientId = GameConnectionID::INVALID;
		hello->mode = EStartMode::LOAD_GAME;
		client->sendPack(*hello);

		LobbyUpdateState statePack;
		statePack.state = static_cast<const LobbyState &>(*this);
		statePack.state.si = std::make_shared<StartInfo>(*si);
		statePack.state.si->mode = EStartMode::LOAD_GAME;
		client->sendPack(statePack);

		LobbyStartGame start;
		start.initializedStartInfo = si;
		start.initializedGameState = gh->gs;
		client->sendPack(start);

		pending.erase(connection);
		activeConnections.push_back(client);
		for(const auto & [seat, player] : si->playerInfos)
		{
			if(!gh->turnOrder->isPlayerMakingTurn(seat))
				continue;
			PlayerStartsTurn turn;
			turn.player = seat;
			client->sendPack(turn);
		}
		logNetwork->info("Hosted player reconnected to seat %d", color.getNum());
	}
};
