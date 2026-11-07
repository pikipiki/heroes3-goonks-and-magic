/*
 * EntryPoint.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"

#include "HostedRestoreServer.h"

#include "../lib/CConsoleHandler.h"
#include "../lib/logging/CBasicLogConfigurator.h"
#include "../lib/VCMIDirs.h"
#include "../lib/GameLibrary.h"
#include "../lib/CConfigHandler.h"
#include "../lib/json/JsonNode.h"
#include "../lib/mapping/GoonkScenario.h"
#include "../lib/entities/faction/CFaction.h"

#include <boost/program_options.hpp>
#include <iostream>

static const std::string SERVER_NAME_AFFIX = "server";
static const std::string SERVER_NAME = GameConstants::VCMI_VERSION + std::string(" (") + SERVER_NAME_AFFIX + ')';

static void handleCommandOptions(int argc, const char * argv[], boost::program_options::variables_map & options)
{
	boost::program_options::options_description opts("Allowed options");
	opts.add_options()
	("help,h", "display help and exit")
	("version,v", "display version information and exit")
	("run-by-client", "indicate that server launched by client on same machine")
	("dummy-run", "Shutdown immediately after loading was sucessful")
	("hosted-seats", boost::program_options::value<std::string>(), "Map colors authorized by the dedicated gateway")
	("hosted-map", boost::program_options::value<std::string>(), "Start a new dedicated match on the named map")
	("hosted-scenarios", boost::program_options::value<std::string>(), "List maps compatible with the given dedicated seat colors")
	("hosted-factions", boost::program_options::value<std::string>(), "Starting castles in authorized seat order, as a JSON array")
	("hosted-turn-minutes", boost::program_options::value<double>()->default_value(0), "Minutes per dedicated adventure turn")
	("hosted-restore", "Restore a dedicated match and accept authenticated loopback connections")
	("verify-turn-checkpoint", "Load and validate the hosted save without opening a network listener")
	("turn-checkpoint", "Save to Hosted-Turn.vsgm1 when a human turn starts (one game per user data directory)")
	("port", boost::program_options::value<ui16>(), "port at which server will listen to connections from client")
	("lobby", "start server in lobby mode in which server connects to a global lobby");

	if(argc > 1)
	{
		try
		{
			boost::program_options::store(boost::program_options::parse_command_line(argc, argv, opts), options);
		}
		catch(boost::program_options::error & e)
		{
			std::cerr << "Failure during parsing command-line options:\n" << e.what() << std::endl;
			exit(1);
		}
	}

	boost::program_options::notify(options);

	if(options.count("help"))
	{
		auto time = std::time(nullptr);
		printf("%s - A Heroes of Might and Magic 3 clone\n", GameConstants::VCMI_VERSION.c_str());
		printf("Copyright (C) 2007-%d VCMI dev team - see AUTHORS file\n", std::localtime(&time)->tm_year + 1900);
		printf("This is free software; see the source for copying conditions. There is NO\n");
		printf("warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\n");
		printf("\n");
		std::cout << opts;
		exit(0);
	}

	if(options.count("version"))
	{
		printf("%s\n", GameConstants::VCMI_VERSION.c_str());
		std::cout << VCMIDirs::get().genHelpString();
		exit(0);
	}
}

int main(int argc, const char * argv[])
{
	// Correct working dir executable folder (not bundle folder) so we can use executable relative paths
	boost::filesystem::current_path(boost::filesystem::system_complete(argv[0]).parent_path());

	CConsoleHandler console;
	CBasicLogConfigurator logConfigurator(VCMIDirs::get().userLogsPath() / "VCMI_Server_log.txt", &console);
	logConfigurator.configureDefault();
	logGlobal->info(SERVER_NAME);

	boost::program_options::variables_map opts;
	handleCommandOptions(argc, argv, opts);
	LIBRARY = new GameLibrary;
	LIBRARY->initializeFilesystem(false);
	logConfigurator.configure();

	LIBRARY->initializeLibrary();

	int exitCode = 0;
	if(opts.count("hosted-scenarios"))
	{
		try
		{
			const auto seats = HostedRestoreServer::parseSeats(opts["hosted-scenarios"].as<std::string>());
			auto files = CResourceHandler::get()->getFilteredFiles([](const ResourcePath & path)
			{
				return path.getType() == EResType::MAP && path.getName().starts_with("MAPS/") && !isGoonkShowcaseMap(path);
			});
			std::vector<JsonNode> maps;
			for(const auto & file : files)
			{
				try
				{
					CMapInfo map;
					map.mapInit(file.getOriginalName());
					if(!HostedRestoreServer::supportsMap(map, seats))
						continue;
					JsonNode row;
					row["id"].String() = file.getOriginalName();
					const auto name = map.getNameForList();
					row["name"].String() = name.empty() ? file.getOriginalName() : name;
					row["width"].Integer() = map.mapHeader->width;
					row["height"].Integer() = map.mapHeader->height;
					for(const auto color : seats)
					{
						JsonNode choices;
						const auto & player = map.mapHeader->players.at(color.getNum());
						if(allowsCastleChoice(player))
							for(const auto id : player.allowedFactions)
							{
								JsonNode faction;
								faction["id"].Integer() = id.getNum();
								faction["name"].String() = id.toFaction()->getNameTranslated();
								faction["key"].String() = id.toFaction()->getJsonKey();
								choices.Vector().push_back(std::move(faction));
							}
						row["castles"].Vector().push_back(std::move(choices));
						JsonNode fixed;
						if(!allowsCastleChoice(player))
						{
							const auto id = player.defaultCastle();
							fixed["id"].Integer() = id.getNum();
							if(id.isValid())
							{
								fixed["name"].String() = id.toFaction()->getNameTranslated();
								fixed["key"].String() = id.toFaction()->getJsonKey();
							}
						}
						row["fixedCastles"].Vector().push_back(std::move(fixed));
					}
					maps.push_back(std::move(row));
				}
				catch(const std::exception &)
				{
					// A map supplied by an incompatible mod must not hide the catalogue.
				}
			}
			std::sort(maps.begin(), maps.end(), [](const JsonNode & a, const JsonNode & b)
			{
				return std::tie(a["name"].String(), a["id"].String()) < std::tie(b["name"].String(), b["id"].String());
			});
			JsonNode catalogue;
			catalogue.Vector() = std::move(maps);
			auto json = catalogue.toCompactString();
			std::erase(json, '\n');
			std::cout << "\nGOONK_SCENARIOS " << json << std::endl;
		}
		catch(const std::exception & error)
		{
			logGlobal->error("Hosted scenario catalogue failed: %s", error.what());
			exitCode = 1;
		}
	}
	else if(opts.count("verify-turn-checkpoint"))
	{
		try
		{
			TurnCheckpointServer server(0, false, false, false);
			server.loadTurnCheckpoint();
		}
		catch(const std::exception & error)
		{
			logGlobal->error("Hosted checkpoint rejected: %s", error.what());
			exitCode = 1;
		}
	}
	else if(opts.count("hosted-restore") || opts.count("hosted-map"))
	{
		try
		{
			const auto * key = std::getenv("GOONK_HOSTED_GATEWAY_KEY");
			const auto port = opts.count("port") ? opts["port"].as<uint16_t>() : settings["server"]["localPort"].Integer();
			HostedRestoreServer server(port, key ? key : "");
			if(!opts.count("hosted-seats") || (opts.count("hosted-restore") && opts.count("hosted-map")))
				throw std::runtime_error("Specify hosted seats and exactly one hosted start mode");
			JsonNode factions;
			if(opts.count("hosted-factions"))
			{
				const auto & text = opts["hosted-factions"].as<std::string>();
				factions = JsonNode(text.data(), text.size(), "hosted factions");
			}
			server.start(opts.count("hosted-map") ? opts["hosted-map"].as<std::string>() : "", opts["hosted-seats"].as<std::string>(),
				factions, opts["hosted-turn-minutes"].as<double>());
			server.run();
			// The supervisor retires a match only after a confirmed game outcome.
			if(server.matchFinished())
				exitCode = 42;
		}
		catch(const std::exception & error)
		{
			logGlobal->error("Hosted match could not start: %s", error.what());
			exitCode = 1;
		}
	}
	else if(!opts.count("dummy-run"))
	{
		bool connectToLobby = opts.count("lobby");
		bool runByClient = opts.count("runByClient");
		uint16_t port = settings["server"]["localPort"].Integer();
		if(opts.count("port"))
			port = opts["port"].as<uint16_t>();

		TurnCheckpointServer server(port, runByClient, opts.count("turn-checkpoint") != 0);
		server.prepare(connectToLobby, true);
		server.run();

		// CVCMIServer destructor must be called here - before LIBRARY cleanup
	}

	logConfigurator.deconfigure();

	delete LIBRARY;
	return exitCode;
}
