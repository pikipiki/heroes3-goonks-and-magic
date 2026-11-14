# Validation exécutée — 14 novembre 2026

Résultats du checkout indépendant, basé sur `062afb00750ff3833b8251b467718f31dcc04413` :

| Contrôle | Résultat / portée |
| --- | --- |
| `npm ci --prefix experiments/crossover` puis `npm run build --prefix experiments/crossover` | TypeScript 5.9.3 depuis le lockfile ; compilation stricte réussie |
| `npm test --prefix experiments/crossover` | 4 tests réussis : statuts dans les deux directions, contrats invalides/sessions périmées, observation/désinscription/reconnexion, inscription explicite |
| `npm test` à la racine | 737 tests : 691 réussis, 46 ignorés, aucun échec. Certains contrôles nécessitent des données source privées absentes de ce checkout. |
| `npm run prepare:web` | Artefacts moteur et données reconstitués depuis les sources versionnées |
| `GOONK_TEST_ORIGIN=http://127.0.0.1:8778 npm run build:web` puis `npm run verify:web` | Construction statique et vérification de l’ABI, des données et des empreintes réussies |
| `node experiments/crossover/package.mjs` | Lanceur ajouté ; packaging idempotent, CSP limitée à `/crossover/*` dans les en-têtes générés |
| Chromium, bundle statique sur 8778 | Véritable VCMI WebAssembly démarré, premier événement natif `menu` observé ; commande native `20` exécutée, transition réelle vers le lobby et nouvel événement observé ; arrêt et rechargement du lanceur réussis, aucune erreur JS de page |
| Chromium, préfixe `/heroes-goonk/` sur 8779 | Lanceur, modules et liens relatifs accessibles ; moteur non lancé dans ce contrôle de préfixe |
| 390×844, 844×390 et 1280×900 | Lanceur sans débordement horizontal, captures inspectées |

Les résultats navigateur condensés sont versionnés dans `evidence/`. Les captures et journaux locaux complets sont dans `/private/tmp/heroes-crossover-isolated-review/` et `/private/tmp/heroes-crossover-prefix-review/`. Le test native utilise le repli temporaire existant du stockage pour éviter d’importer tout OPFS dans un contexte éphémère. Il ne remplace pas la simulation, ne réinjecte pas d’état et ne désactive pas CSP. Son audio est coupé par le helper du dépôt.

L’essai initial dans le checkout partagé donnait 707 réussites, 33 ignorés et 2 échecs d’inventaire d’empreintes, sur des fichiers déjà modifiés par un autre travail. Les changements ont été laissés sur `main` et aucun d’eux n’est dans ce lot. Les résultats du checkout indépendant ci-dessus constituent la référence de cette branche.

L’aperçu de développement initial a également révélé un 404 sur `vcmiclient.data.<hash>.js` ; le proxy expérimental normalise ce chemin sans modifier le serveur existant. Un test statique sur une origine locale non autorisée échouait à cause de la politique CSP existante : le build final autorise explicitement l’origine de test avec `GOONK_TEST_ORIGIN`. La politique de production est conservée.

Non vérifiés / non réalisés : recompilation C++/WASM complète avec Emscripten, partie Heroes jusqu’au combat, StarCraft interactif, échanges entre deux simulations, pertes appliquées à VCMI, sauvegarde/reprise crossover, persistance OPFS de cette intégration, Worker, WebRTC et déploiement hébergé. L’absence de licence établie pour OpenBW bloque sa réutilisation conformément aux consignes du projet.
