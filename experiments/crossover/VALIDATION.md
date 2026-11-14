# Validation — 14 novembre 2026

## Bataille depuis Heroes

`tests/heroes-rts-browser.mjs` lance le scénario publié par le bouton du produit, attaque le garde avec le héros natif et attend le vrai résultat des deux moteurs. Aucun PV ni résultat de simulation n’est injecté. Le scénario de départ contient 12 archers, 6 piquiers et le commandant WoG du héros, face à 20 gardes répartis par VCMI.

| Contrôle | Résultat |
| --- | --- |
| Nouvelle partie de test | Carte native sélectionnée et démarrée, mode crossover activé |
| Attaque Heroes | Bataille suspendue ; identités et effectifs initiaux transmis à OpenBW |
| Préparation | Frame 0 jusqu’au clic « Commencer le combat » |
| Combat StarCraft | Vraies unités opposées, ordres AttackMove natifs, pertes réelles |
| Retour Heroes | Bilan natif ; chaque effectif de l’armée correspond exactement aux survivants RTS |
| Sauvegarde et rechargement | Sauvegarde native sérialisée, puis chargée par le menu VCMI ; effectifs identiques |
| Annulation | Reprise d’une vraie bataille Heroes jusqu’à sa fin, sans soumission de pertes RTS |

Preuve : [evidence/heroes-rts.json](./evidence/heroes-rts.json). Le test utilise le repli mémoire du stockage Heroes : il démontre la sauvegarde/relecture native, pas la persistance OPFS après fermeture du navigateur. Les sauvegardes personnelles ne sont pas versionnées.

`tests/rts-battle-browser.mjs` vérifie séparément un affrontement OpenBW de 38 unités, depuis la frame 0 jusqu’à l’élimination d’un camp : [evidence/rts-battle.json](./evidence/rts-battle.json). Les résultats peuvent varier selon les commandes et leur frame ; aucun nombre de survivants prédéterminé n’est imposé.

## Constructions et régressions

- VCMI expérimental recompilé avec Emscripten 4.0.23 : `ninja -j32 html5`, réussite. Archive séparée utilisée uniquement par la configuration crossover.
- OpenBW compilé avec WASI SDK 33.0 ; empreintes et exports : [engine-build.json](./public/starcraft/engine-build.json).
- 16 tests du laboratoire réussis : contrats, mapping, validation de résultat, MPQ, recensement, absence de capacités réseau/processus dans le WASM, véritable ABI native.
- Tests Heroes : 737 au total, 691 réussis, 46 ignorés, aucun échec.
- Compilation TypeScript stricte, packaging et `verify:web` réussis.
- Le scénario indépendant `tests/real-game-browser.mjs` vérifie également la production terminée d’un SCV, son déplacement, une perte réelle, les messages natifs entre moteurs et la sérialisation de sauvegarde/replay. Preuve : [evidence/real-game.json](./evidence/real-game.json).

Les archives distribuées sont les trois MPQ issus du paquet Blizzard demandé, reconstruits à partir de morceaux SHA-256 vérifiés ; voir [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). Chromium valide le téléchargement automatique et le cache, sans sélection manuelle de fichier. Les tests sont silencieux et leurs lectures de contrôle restent dans le contexte de test.

## Limites

Pas de validation physique iPhone/iPad ni WebKit. Pas de sauvegarde/reprise d’un combat RTS interrompu, de replay du scénario délégué, de multijoueur ou de transposition des sorts/bonus Heroes. Le mode est limité aux batailles de terrain compatibles, à 32 groupes et 128 unités par camp. Le déploiement Netlify séparé n’a pas été effectué. La version testée est servie localement.
