# Audit technique — 14 novembre 2026

## Périmètre et méthode

Inspection du checkout Heroes `062afb00750ff3833b8251b467718f31dcc04413` (version 0.4.168) et du checkout OpenBW voisin `469d2037e2fd03085dac4729912f4188bc2a778b`, origin `https://github.com/heiner/openbw.git`. Lecture des AGENTS, README, UPSTREAM, scripts build/verify/prepare, tests, MobileBridge et sources Web OpenBW. Consultation des dépôts officiels ci-dessous. Une affirmation dans un README tiers est distinguée d’un résultat exécuté ici.

## Heroes Engine : réutilisable

- VCMI 1.7.3 / Emscripten 4.0.23 annoncés dans README et UPSTREAM ; code C++ présent, artefact WASM local présent. Licence moteur GPL-2.0-or-later, fichier `work/vcmi-wasm/license.txt`. L’intégration devra conserver les sources et obligations de cette licence, ainsi que les notices des dépendances.
- `scripts/build-site.mjs` produit les noms de runtime par empreinte, le manifeste de données et les pages index/game/storage. `scripts/verify-site.mjs` vérifie l’ABI ERA et les empreintes. La compilation et la vérification du site sont exécutées pour ce lot ; ce n’est pas une recompilation du C++.
- OPFS, montage à la demande et installation sont présents dans `web/game-storage.mjs`, `web/game-mount.mjs`, `web/install.mjs` ; `web/temporary-startup.mjs` fournit le démarrage temporaire. Les tests existants couvrent ces modules, mais aucune sauvegarde/reprise crossover n’existe.
- `MobileBridge.cpp` publie déjà des instantanés JSON via `goonk-state`, avec acquittement et déduplication. Ils exposent des modes, armées et batailles à l’interface. Ils ne fournissent pas un contrat pour suspendre une bataille et appliquer un résultat externe : une API native autoritaire dédiée sera nécessaire.
- Des modules de lobby, transport et notifications existent. Leur présence ne certifie pas un multijoueur P2P WebRTC opérationnel ; aucun essai réseau multijoueur n’est exécuté ici.
- Le build moteur prescrit reste `ninja -j32 html5` dans `work/vcmi-wasm/emscripten`. Aucun `build.ninja` n’y est présent dans ce checkout. Aucune modification C++ n’est faite ; reproductibilité de la compilation WASM complète non vérifiée dans ce lot.

## StarCraft : comparaison des candidats

| Candidat | Réutilisation / Web | Écart ou blocage |
| --- | --- | --- |
| [OpenBW officiel](https://github.com/OpenBW/openbw) | Sources C++ de simulation, actions, chargement, replay et UI ; intégration BWAPI séparée | Aucune licence générale trouvée ; [issue officielle #17](https://github.com/OpenBW/openbw/issues/17) ouverte. Ne pas assimiler code public à autorisation de réutilisation. Version interactive navigateur non exécutée ici. |
| Fork local heiner/openbw, SHA ci-dessus | `web/wasm_main.cpp`, `sandbox.h`, `wasm_backend.cpp`, `openbw.js`, build WASI et flux de commandes ; rendu canvas et entrées présents. Le code inclut pathfinding/combat via le moteur existant. | Aucun fichier de licence générale suivi ; seule licence Asio trouvée. Aucun WASM local à lancer. Build WASI-SDK 33, pas Emscripten ; chemin SDK par défaut propre à une autre machine. Tests/README du fork affirment des parties et bots, non reproduits ici. |
| [OpenBW/bwapi](https://github.com/OpenBW/bwapi) | Interface BWAPI et couche serveur utilisées par le fork pour les bots | Ni BWAPI autonome ni moteur Web indépendant ; n’élimine pas le blocage OpenBW. Audit de licences bots et dépendances à faire séparément. |
| [Stargus](https://github.com/Wargus/stargus) + Stratagus | Scripts/importateur, fichier COPYING présent ; moteur Stratagus différent | Ne conserve pas la simulation Brood War originale. Le [site du projet](https://stargus.sourceforge.net/) le dit explicitement. Port Emscripten interactif et licences de chaque composant non validés ici ; candidat écarté pour cet objectif, sans copier de code. |

La liste n’est pas un recensement exhaustif de tous les ports. Aucun candidat inspecté ne réunit aujourd’hui une preuve de réutilisation autorisée et une partie Brood War navigateur exécutée dans cet audit. L’intégration StarCraft est donc suspendue au périmètre inspecté ; aucune simulation de remplacement n’est créée.

Le port local utilise WASI avec des imports JS de fichiers et un framebuffer. Il pourrait rester un module WASM autonome avec hôte JS, sans forcer un port Emscripten supplémentaire, si l’exigence Emscripten est assouplie. Une build reproductible doit épingler SDK, compilateur, révisions du moteur et bots (le README bot reconnaît que les révisions vendues restent à épingler). Le confinement dans un Worker exige d’abord une vérification des accès DOM/canvas et de la temporisation du moteur ; pas d’activation présumée.

## Données et redistribution

Le fork local tente de télécharger les MPQ depuis Internet Archive et une icône propriétaire à distance. Ce mécanisme ne doit pas être repris : aucun droit de redistribution n’est établi ici. Prévoir l’import local de `StarDat.mpq`, `BrooDat.mpq`, `Patch_rt.mpq` et d’une carte avec validation, conservation OPFS et repli IndexedDB. La disponibilité d’une URL ne vaut pas permission. Le fichier `web/maps/ATTRIBUTION.md` cite CC BY 4.0 pour une carte ; cette notice ne couvre ni le moteur ni les MPQ. Bots : auditer chaque licence et épingler chaque source avant d’activer une distribution.

Heroes distribue déjà des données propriétaires, selon les consignes existantes. Ce lot ne les ajoute pas et ne valide pas les droits annoncés par le dépôt. Le lanceur indépendant n’inclut aucun octet de jeu.

## Architecture progressive

Un adaptateur Heroes observe l’API existante. Un adaptateur StarCraft futur encapsulera ses exports WASM ; il devra exposer un état issu de la simulation, des commandes validées et des résultats identifiés. Le bridge transporte des DTO versionnés, jamais des pointeurs/structures internes. Première version livrée : état en lecture seule, session et corrélation. Aucun mapping de créatures n’est inventé.

Pour une bataille déléguée, l’autorité VCMI devra vérifier l’identifiant de bataille, l’état initial, les pertes bornées par les effectifs et les règles victoire/fuite ; la validation et la mutation seront atomiques et idempotentes. Ne jamais écrire seulement dans le JSON de l’interface. Conserver un checkpoint moteur avant transfert, puis un journal de résultat appliqué, et gérer annulation/rechargement avant les interactions simultanées.

## Priorités suivantes

1. Établir une licence/autorisation vérifiable sur la révision OpenBW et le port Web ; sans cela, aucune copie, compilation intégrée ou redistribution.
2. Épingler et compiler le module autonome ; remplacer les téléchargements propriétaires par un import local ; vérifier une partie réelle, mouvement, attaque, pathfinding, IA et persistance dans Chromium/WebKit.
3. Ajouter un adaptateur StarCraft pour événements réels ; tester l’aller-retour avec les deux moteurs et les interruptions, puis la compatibilité Worker.
4. Ajouter une API native VCMI de bataille externe, des mappings explicites et une application idempotente ; tests natifs, WASM, sauvegarde/reprise et scénario jouable.
5. Étudier seulement ensuite carte commune, fusion graphique, temps réel et WebRTC P2P.
