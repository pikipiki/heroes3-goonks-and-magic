# Validation réelle — 14 novembre 2026

Le scénario `tests/real-game-browser.mjs` a été exécuté avec les trois véritables archives locales de `work/game-data/starcraft-classic/`, extraites du paquet StarEdit indiqué par le propriétaire. Aucun MPQ ni sauvegarde personnelle n’est ajouté au dépôt ou au site.

| Contrôle | Résultat / portée exacte |
| --- | --- |
| Deux jeux actifs dans Chromium | OpenBW démarre sur Weave avec ses unités natives ; VCMI démarre ensuite son véritable monde de jeu, avec une armée native au jour 1 |
| Heroes → StarCraft | Les événements natifs `menu`, `lobby`, puis `map` arrivent dans le journal C++ OpenBW |
| StarCraft → Heroes | Un état natif OpenBW active l’action « Préparer Heroes depuis StarCraft » ; la commande C++ VCMI ouvre le lobby et son nouvel événement confirme l’application |
| Production native | 4 SCV initialement ; paiement exact de 50 minerais ; entraînement suivi de la frame 38 à la frame 338 ; file vide et 5 SCV avec le drapeau natif `completed` |
| Déplacement / pathfinding | Une commande Move traverse le backend d’entrée original ; la position native passe de (1104,1864) à (1121,1880) dans le contrôle enregistré |
| Combat / absence réelle | Deux SCV reçoivent une attaque forcée contre un autre SCV du même camp ; le moteur détruit exactement cette unité, sans changement direct des PV ou du résultat |
| Cohorte initiale | L’identité détruite remonte comme absente dans la passerelle ; le SCV nouvellement produit ne masque pas la perte du SCV initial |
| Sauvegarde Heroes | Le moteur sérialise une sauvegarde de 533 262 octets pendant que StarCraft continue ; aucune équivalence après rechargement n’est affirmée dans ce test |
| Replay StarCraft | Le moteur sérialise 23 279 octets à la frame 522 ; la relecture du replay n’a pas été testée |
| 12 tests du laboratoire | Réussite : contrats, sessions, désinscription, commande native Heroes idempotente, validation MPQ, recensement, suivi des identités et véritable module WASM instancié avec WASI |
| Régressions Heroes | 737 tests : 691 réussis, 46 ignorés, aucun échec |
| Build OpenBW reproductible localement | Deux compilations identiques : `bf664778720569019b66ac82b08f5b8dab70bff3e86fb5d8077a92b65a43043d`, 1 380 833 octets. Le manifeste inclut séparément l’empreinte du wrapper C++ et des sources amont inchangées |
| TypeScript et site statique | Compilation stricte, génération de l’hôte, packaging et vérification du site exécutés ; la CSP reste active |

Preuve condensée : [evidence/real-game.json](./evidence/real-game.json). Captures et diagnostics locaux : `/private/tmp/heroes-starcraft-real-game-review/`. Les sources d’archives et leurs SHA-256 sont conservés dans `work/game-data/starcraft-classic/download-source.json` (hors Git). Les preuves précédentes d’import/persistance IndexedDB restent valides : import rejeté sans écraser les archives, données altérées bloquées, aucun upload ni téléchargement tiers.

Le premier essai complet a révélé un cadrage de l’iframe dans le test, corrigé par un défilement explicite vers StarCraft. Le test attend désormais la fin réelle de la production : une unité en cours de fabrication existe déjà dans les structures natives et sa simple présence ne prouve pas son achèvement. Les coordonnées d’attaque utilisent le recensement de la vue native, plutôt qu’une caméra supposée. Aucune donnée de simulation n’est réinjectée. Les seules aides de sélection et de lecture des tests restent dans leur contexte, sans poignée de diagnostic publiée.

Les tests sont silencieux, en conservant le moteur audio. Le monde VCMI utilise le repli temporaire de stockage existant ; la sauvegarde vérifiée est une vraie sérialisation native en mémoire, pas une preuve de persistance OPFS ou de reprise après fermeture du navigateur.

**Limite essentielle :** la cohorte remontée à la passerelle ne modifie pas encore les armées VCMI. Une absence d’identité n’est pas un résultat de bataille complet (par exemple, une transformation peut retirer une unité). Il reste à définir les mappings explicites, déléguer une véritable bataille Heroes et appliquer son résultat atomiquement/idempotemment dans le serveur VCMI. L’IA, un combat entre camps opposés, la sauvegarde/reprise StarCraft, les Workers, WebRTC, WebKit et le déploiement hébergé restent également à vérifier.
