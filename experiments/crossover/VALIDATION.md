# Validation — 14 novembre 2026

## Continuité bidirectionnelle et unités classiques — 15 novembre 2026

- `tests/roundtrip-browser.mjs` réussi dans Chromium et WebKit, au format tactile paysage 844×390 : mêmes six types StarCraft, santé de départ identique, vrais sorts sur un Dragoon et un Behemoth, invocation native, retour classique, deux rounds d’attaques classiques, puis retour RTS. Vérification exacte de la santé totale de chaque groupe dans les deux directions, ainsi que des invocations et de la mana ; aucune modification artificielle de PV dans le test.
- `tests/classic-turns-browser.mjs` réussi dans Chromium et WebKit, au format tactile portrait 390×844 : trois rounds manuels, munitions Marines dépensées, blessures Heroes réelles, stabilité du tour sans action, puis combat natif complet jusqu’au résultat sans exception navigateur.
- Les Zealots et Dragoons partagent une santé canonique incluant les boucliers (160 et 180). La consolidation des blessures utilise la règle Heroes d’un membre blessé par groupe ; le total est conservé.
- Export original pour six créatures : animations distinctes de marche, attaque et mort, WAV d’attaque, palette transparente compatible VCMI. Les tireurs possèdent un projectile et un déclenchement natifs Heroes. `tests/classic-assets.test.mjs` valide les données et les palettes ; preuve de diversité des images : `evidence/classic-art.json`.
- Compilation VCMI `ninja -j32 html5` et compilation de l’adaptateur OpenBW réussies. Tests Heroes : 740, dont 694 réussis et 46 ignorés ; tests crossover : 36 réussis. `verify:web` et TypeScript strict réussis.
- Bundle Pages final : 999 144 535 octets, sous la limite de 1 Go.
- Le retour « Classique » continue maintenant le même combat ; les anciennes preuves d’annulation ci-dessous décrivent le comportement historique.

## Passage classique → temps réel et rendu mobile — 15 novembre 2026

- VCMI : compilation `ninja -j32 html5` réussie ; archive dédiée mise à jour.
- OpenBW : compilation WASI SDK 33.0 réussie, source amont épinglée inchangée, empreintes de l’adaptateur et du binaire vérifiées.
- Tests Heroes : 740 tests, 694 réussis, 46 ignorés, aucun échec. Tests crossover : 33 réussis. TypeScript strict et `verify:web` réussis.
- `tests/mode-switch-browser.mjs` : Chromium et WebKit, écran tactile 390×844 à DPR 2, puis 844×390. Vérification du gabarit des 47 acteurs, livre partagé (écoles, description, confirmation), pause, accès au bouton Temps réel dans les vues classique et verticale.
- Deux vrais sorts classiques tuent les Marines et blessent une créature alliée. Le passage en RTS conserve les morts, effectifs vivants, blessures, mana et les groupes tombés pouvant être ressuscités. Aucun point de vie n’est fabriqué dans le test.
- Le combat reprend immédiatement ; un sort du livre partagé atteint une vraie cible. Cadence de présentation active mesurée : Chromium 49,9 images/s, WebKit 48,0 images/s. Le canevas adapte sa définition à la taille visible et à la cadence, les sprites conservent leur gabarit.
- `tests/universal-magic-browser.mjs` : régression Chromium réussie sur la préparation des cinq raccourcis, 60 sorts du héros, Hâte, trois Cercles de glace réellement dommageables, résurrection de créature, invocation native de 48 combattants, boucliers Protoss et animations de blessure, mort et lancement.
- Lancement à froid validé sur un serveur sans en-têtes COOP/COEP, comme Pages : les scripts des workers possèdent désormais un service worker couvrant leur propre URL.
- Bundle Pages vérifié sous la limite de 1 Go. La publication reste indépendante de `main`.

Les sections ci-dessous conservent les preuves des premiers parcours du laboratoire.

## Bataille depuis Heroes

`tests/heroes-rts-browser.mjs` lance le scénario par le bouton situé directement dans Heroes, attaque le garde avec le héros natif et attend le vrai résultat des deux moteurs. Aucun PV ni résultat de simulation n’est injecté. Le scénario de départ contient 12 archers, 6 piquiers et le commandant WoG du héros, face à 3 Marines ayant leur propre identité dans VCMI.

| Contrôle | Résultat |
| --- | --- |
| Bouton Démo dans Heroes | Carte native sélectionnée et démarrée, mode crossover activé |
| Attaque Heroes | Bataille suspendue ; identités et effectifs initiaux transmis à OpenBW |
| Préparation | Frame 0 jusqu’au clic « Commencer le combat » |
| Combat mixte | Unités Heroes originales et Marines StarCraft sur une vue unique ; PV Heroes conservés, ordres natifs et pertes réelles |
| Retour Heroes | Bilan natif ; chaque effectif de l’armée correspond exactement aux survivants RTS |
| Sauvegarde et rechargement | Sauvegarde native sérialisée, puis chargée par le menu VCMI ; effectifs identiques |
| Annulation | Reprise d’une vraie bataille Heroes jusqu’à sa fin, sans soumission de pertes RTS |

Preuve : [evidence/heroes-rts.json](./evidence/heroes-rts.json). Le test utilise le repli mémoire du stockage Heroes : il démontre la sauvegarde/relecture native, pas la persistance OPFS après fermeture du navigateur. Les sauvegardes personnelles ne sont pas versionnées.

`tests/rts-battle-browser.mjs` vérifie séparément un affrontement OpenBW de 38 unités, depuis la frame 0 jusqu’à l’élimination d’un camp : [evidence/rts-battle.json](./evidence/rts-battle.json). Les résultats peuvent varier selon les commandes et leur frame ; aucun nombre de survivants prédéterminé n’est imposé.

La version actuelle passe **14 cas de parcours réel**, dont le lancement depuis une aventure existante avec sa sauvegarde dédiée, la sélection/déplacement au format 844×390 et le défilement de la colonne de commandes. Ce contrôle est effectué dans Chromium avec une petite fenêtre ; il ne remplace pas un test matériel iPhone/Safari.

Le parcours a été réexécuté avec l’accueil intégré, les commandes manuelles et le cadrage agrandi. Vérifications : absence de panneau superposé, Options dans le même menu, boutons sans chevauchement en paysage ; commandes en dessous en portrait et à droite en paysage ; geste tactile réel sur la colonne de commandes ; formats téléphone 390×844 / 844×390 et tablette 768×1024 / 1024×768. Le test vérifie ensuite que commencer n’envoie aucun ordre : les alliés gardent leurs positions et ne blessent pas les Marines, même lorsqu’ils sont touchés. Un déplacement, un arrêt et une attaque explicite fonctionnent, puis le bilan, la sauvegarde/relecture et l’annulation restent valides. Le rendu isolé des sprites est compilé avec WASI SDK 33.0 ; la vérification `ninja -j32 html5` de VCMI reste réussie.

Captures : [accueil portrait](./evidence/menu-portrait.png), [accueil paysage](./evidence/menu-landscape.png), [combat portrait](./evidence/mixed-field-portrait.png).

Capture du champ mixte en paysage : [evidence/mixed-field-landscape.png](./evidence/mixed-field-landscape.png).

## Constructions et régressions

- VCMI expérimental recompilé avec Emscripten 4.0.23 : `ninja -j32 html5`, réussite. Archive séparée utilisée uniquement par la configuration crossover.
- OpenBW compilé avec WASI SDK 33.0 ; empreintes et exports : [engine-build.json](./public/starcraft/engine-build.json).
- 17 tests du laboratoire réussis : contrats, mapping, validation de résultat, MPQ, recensement, absence de capacités réseau/processus dans le WASM, véritable ABI native.
- Tests Heroes : 737 au total, 691 réussis, 46 ignorés, aucun échec.
- Compilation TypeScript stricte, packaging et `verify:web` réussis.
- Le scénario indépendant `tests/real-game-browser.mjs` vérifie également la production terminée d’un SCV, son déplacement, une perte réelle, les messages natifs entre moteurs et la sérialisation de sauvegarde/replay. Preuve : [evidence/real-game.json](./evidence/real-game.json).

Les archives distribuées sont les trois MPQ issus du paquet Blizzard demandé, reconstruits à partir de morceaux SHA-256 vérifiés ; voir [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). Chromium valide le téléchargement automatique et le cache, sans sélection manuelle de fichier. Les tests sont silencieux et leurs lectures de contrôle restent dans le contexte de test.

## Limites

Pas de validation sur un iPhone/iPad physique. Les tests WebKit sont exécutés sur ordinateur. Pas de sauvegarde/reprise d’un combat RTS interrompu, de replay du scénario délégué ou de multijoueur. Le mode est limité aux batailles solo de terrain compatibles, à 32 groupes et 128 unités par camp. La publication utilise le projet GitHub Pages séparé `heroes-starcraft`. Les sprites originaux sont lissés et agrandis ; ce ne sont pas des images HD de remplacement.
