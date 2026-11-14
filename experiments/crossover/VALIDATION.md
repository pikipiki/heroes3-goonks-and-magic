# Validation exécutée — 14 novembre 2026

| Contrôle | Résultat / portée exacte |
| --- | --- |
| TypeScript 5.9.3 strict + génération du port adapté | Réussite ; pas de modification des sources C++ VCMI ou OpenBW |
| Build natif OpenBW, WASI-SDK 33.0 / Clang 22.1.0 | Réussite, module 1 379 622 octets ; deux builds locaux identiques : `f2a4d72a8b9a6920a3d390d548432d655395e7d7548a07d19053f7d28d68231f` |
| 10 tests du laboratoire | Réussite : enveloppes/sessions, observations/désinscription, validation MPQ, adaptation de message natif sur fixtures de contrat, vrai module WASM instancié avec WASI et ABI vérifiée |
| `npm test` à la racine | 737 tests : 691 réussis, 46 ignorés, aucun échec ; certains contrôles demandent des sources privées absentes de ce checkout |
| `npm run prepare:web`, build statique et `npm run verify:web` | Réussite pour les artefacts existants Heroes ; ABI, données et empreintes vérifiées. Packaging expérimental ajouté ensuite et vérification du site répétée avec succès |
| Chromium : deux interfaces chargées | Véritable VCMI démarré ; événement natif `menu` reçu ; commande native 20 ouvre le lobby ; nouvel événement observé ; arrêt et rechargement du lanceur réussis. OpenBW reste à l’écran d’import sans MPQ |
| Chromium : OpenBW et import local | Vrai WASM téléchargé et compilé avec CSP active ; import partiel/complet, persistance IndexedDB après reload, rejet d’import invalide sans perte des anciennes archives, blocage sur empreinte altérée et récupération après réimportation |
| Formats 390×844, 844×390, 1024×768 / 1280×900 | Lanceur et panneau d’import accessibles sans débordement horizontal ; captures inspectées |
| Réseau pendant l’import | Aucune requête vers un tiers, aucun upload et aucune erreur JS de page |

Les fixtures d’import ne contiennent que des en-têtes MPQ synthétiques, jamais utilisés pour lancer la simulation. Les fixtures d’adaptateur sont explicitement identifiées comme telles. L’instanciation du vrai WASM vérifie un réacteur non initialisé ; elle ne prouve pas une partie StarCraft. Les tests navigateur sont silencieux. Le test VCMI utilise le repli temporaire de stockage existant, sans désactiver CSP ni injecter d’état de simulation.

Résultats condensés : `evidence/browser-native.json` et `evidence/starcraft-import.json`. Captures/journaux locaux : `/private/tmp/heroes-crossover-two-frames-review/` et `/private/tmp/heroes-starcraft-import-review/`. Les preuves du premier lot restent dans l’historique Git.

`tests/real-game-browser.mjs` est prêt : il exige les trois véritables MPQ, puis vérifie le démarrage des deux simulations, les événements Heroes appliqués au journal C++ OpenBW et les échantillons natifs retournés, la production d’un SCV via la carte de commandes et la sérialisation d’un replay. **Non exécuté : aucun MPQ n’est disponible dans les dossiers inspectés.** Le script a seulement passé sa vérification syntaxique. Aucune affirmation de jouabilité StarCraft ne repose sur son existence.

Restent non validés : déplacement/combat/production dans une vraie partie StarCraft, IA, échanges entre deux simulations actives, application de pertes à VCMI, sauvegarde/reprise de simulation, Workers, WebRTC, WebKit et déploiement hébergé. Le jeu Heroes n’a pas été recompilé en C++ dans ce lot. Aucun MPQ, sauvegarde personnelle ou identifiant n’est versionné.
