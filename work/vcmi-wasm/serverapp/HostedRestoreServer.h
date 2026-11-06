/*
 * HostedRestoreServer.h, part of VCMI engine
 *
 * License: GNU General Public License v2.0 or later
 */

#pragma once

#include "TurnCheckpointServer.h"

#include "../lib/mapping/CMapHeader.h"
#include "../lib/networkPacks/PacksForLobby.h"
#include "../lib/serializer/GameConnection.h"

class HostedRestoreServer final : public TurnCheckpointServer
{
	using Clock = std::chrono::steady_clock;
	const std::string gatewayKey;
	std::map<NetworkConnectionPtr, Clock::time_point> pending;
	std::map<NetworkConnectionPtr, PlayerColor> authorized;
	bool ready = false;

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

	void start(const std::string & mapName, const std::string & colors)
	{
		std::set<PlayerColor> seats;
		for(const auto color : colors)
		{
			if(color < '0' || color > '7' || !seats.emplace(color - '0').second)
				throw std::runtime_error("Invalid hosted seat roster");
		}
		if(seats.size() < 2)
			throw std::runtime_error("Hosted matches require at least two seats");

		if(mapName.empty())
			loadTurnCheckpoint();
		else
		{
			auto map = std::make_shared<CMapInfo>();
			map->mapInit(mapName);
			if(map->mapHeader->battleOnly || map->amountOfPlayersOnMap != seats.size())
				throw std::runtime_error("The hosted map must have exactly one slot per seat");
			si->mode = EStartMode::NEW_GAME;
			si->difficulty = 1;
			for(const auto color : seats)
			{
				const auto id = vstd::next(PlayerConnectionID::FIRST_HUMAN, color.getNum());
				playerNames.emplace(id, ClientPlayer{connectionFor(color), color.toString()});
			}
			updateStartInfoOnMapChange(map);
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
		startGameImmediately();
		ready = true;
		prepare(false, false);
		const auto port = getNetworkServer().start(getPort(), true);
		logGlobal->info("Hosted match listening on loopback port %d", port);
	}

	void applyPack(CPackForClient & pack) override
	{
		if(ready)
			TurnCheckpointServer::applyPack(pack);
		else
			CVCMIServer::applyPack(pack);
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

		CVCMIServer::onTimer();
	}

	void onDisconnected(const NetworkConnectionPtr & connection, const std::string &) override
	{
		pending.erase(connection);
		authorized.erase(connection);
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
			if(difference || !color.isValidPlayer() || !si->playerInfos.contains(color)
				|| std::any_of(authorized.begin(), authorized.end(), [color](const auto & entry) { return entry.second == color; }))
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
	void admit(const NetworkConnectionPtr & connection, PlayerColor color, const std::vector<std::byte> & message)
	{
		if(message.size() > 4096 || !gh->gameState().currentBattles.empty())
		{
			connection->close();
			return;
		}

		auto client = std::make_shared<GameConnection>(connection);
		auto pack = client->retrievePack(message);
		auto * hello = dynamic_cast<LobbyClientConnected *>(pack.get());
		if(!hello || hello->version != ESerializationVersion::CURRENT)
		{
			connection->close();
			return;
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
