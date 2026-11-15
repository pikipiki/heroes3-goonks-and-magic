# Validation — 14 novembre 2026

## Démarrage automatique et nouvelle armée — 15 novembre 2026

- Démo actualisée : sept créatures finales Heroes, une par groupe, face aux douze StarCraft avec leurs améliorations maximales. La carte et le libellé d’accueil ont été régénérés ; le scénario réel fournit bien 7 acteurs Heroes et 12 acteurs StarCraft.
- Les images Heroes gardent leurs six poses et leurs huit frames par pose à définition identique. Une seule planche par troupe est produite et envoyée à la fois, avec accusé de réception. Pour les sept groupes de la démo, le plus gros transfert RGBA passe de 49 545 216 à 7 077 888 octets. Les planches de 1536×1152 évitent la texture unique de 1536×8064.
- Le moteur RTS n’est instancié qu’une fois les images Heroes prêtes. Le catalogue conserve 60 sorts du héros ; aucune animation de sort n’est chargée en masse à l’ouverture. Les effets sont préparés lorsqu’ils sont réellement lancés, avec un cache de huit sorts récents. Leurs sons sont décodés à l’utilisation ; les attaques/blessures/morts des créatures restent préparées, y compris pour les invocations.
- Les trois MPQ restent SHA-256 vérifiés, mais le même instantané vérifié est réutilisé par l’hôte au lieu de relire les fichiers pour chaque étape. L’hôte effectue trois lectures IndexedDB, une par archive. La production des atlas mobiles classiques est suspendue pendant RTS.
- `tests/startup-browser.mjs` : Chromium et WebKit, portrait 390×844 à DPR 3, lancement automatique natif, combat actif puis retour classique sans navigation/redémarrage. Maximal mesuré : 1 769 472 pixels par transfert, 7 planches Heroes, 0 planche de sort préchargée, 60 icônes. Espaces mémoire Wasm relevés après préparation : VCMI 268 435 456 octets ; OpenBW 66 781 184 octets (ces tailles ne mesurent pas la RAM totale du navigateur).
- `ABORT_PREP=1 tests/startup-browser.mjs` : annulation pendant la préparation, reprise classique jouable avant toute instanciation RTS, puis lancement manuel et retour classique. Réussi dans les deux navigateurs. Les règles d’ouverture ne sont pas réappliquées lors de cette annulation.
- `tests/universal-magic-browser.mjs` : parcours Chromium réussi avec les nouveaux effectifs, choix des cinq raccourcis et 60 sorts, Hâte, vrais dégâts/mort par Cercle de glace, résurrection par le héros, invocation de 48 acteurs, animations Heroes et StarCraft, perte de boucliers et santé Protoss exacte.
- `tests/roundtrip-browser.mjs` : Chromium et WebKit, vrais dégâts et invocations, retour classique, dégâts classiques supplémentaires puis retour RTS ; santé et mana conservées.
- Régressions finales sous Chromium et WebKit : Hâte/Lenteur et Dissipation via le livre, puis deux bascules déclenchées à la réponse native avec audio volontairement suspendu ; aucun redémarrage, état bloqué ou reprise RTS pendant le transfert.
- `tests/hosted-assets-browser.mjs` : téléchargement automatique vérifié, cache relu sans retéléchargement, réparation d’une archive altérée et refus d’un morceau corrompu. Aucun téléversement ni origine externe.
- TypeScript strict, `verify:web` et `ninja -j32 html5` réussis. Tests crossover : 42 réussis ; tests Heroes : 694 réussis et 46 ignorés. Bundle Pages : 999 153 831 octets.
- Le démarrage sur appareil physique reste à confirmer ; les allocations inutiles identifiées sont supprimées et les limites ci-dessus sont vérifiées sur les navigateurs de test.

## Hâte/Lenteur et mémoire des bascules — 15 novembre 2026

- Correction du chemin de vitesse OpenBW : les unités à déplacement iscript ignoraient la seule modification de `flingy.top_speed`. Le multiplicateur Heroes est maintenant appliqué au calcul natif de chaque déplacement, après les améliorations StarCraft. Le code amont épinglé reste inchangé ; le hook est injecté dans la copie de construction vérifiée.
- VCMI transmet le rapport entre la vitesse avec et sans bonus de sorts. Il fonctionne aussi lorsqu’un effet est déjà actif au passage classique → RTS ; le retrait de l’effet restaure le rapport normal.
- `tests/movement-browser.mjs` réussi dans Chromium et WebKit sur les six types StarCraft et les deux familles de simulation Heroes (mêlée/tireur). Mesures sur 24 frames, multiplicateurs 1 / 1,5 / 0,5 / 1 : Marine 96 / 140 / 50 / 94 pixels ; Dragoon 120 / 180 / 66 / 116 ; Heroes mêlée 122 / 189 / 71 / 126. Scénario isolé, mêmes unités et santé, déplacements natifs réellement simulés.
- `tests/speed-spells-browser.mjs` : vrais sorts Hâte, Lenteur et Dissipation depuis le livre partagé sous Chromium et WebKit. Lenteur touche les six types StarCraft, Hâte affecte les créatures Heroes admissibles. Les multiplicateurs survivent à un aller-retour classique, Dissipation les remet à 1. Les immunités natives Heroes restent appliquées.
- Au retour classique, aucune nouvelle iframe RTS ni copie de ses archives n’est préparée. Le prochain clic Temps réel prépare explicitement le moteur. Le framebuffer natif invisible est limité à 320×240 ; les sprites et le terrain visibles gardent leur rendu indépendant. Les surfaces de rendu et buffers audio retirés sont libérés explicitement, sans attendre le ramasse-miettes.
- Quatre allers-retours actifs par navigateur, avec DPR 3, vues classique/verticale et orientations portrait/paysage : aucune navigation/redémarrage observé. Deux allers-retours supplémentaires par navigateur déclenchés à la réponse native, audio suspendu, vérifient l’absence d’hôte RTS en classique et la mise à zéro immédiate de l’ancien canevas.
- Régression finale `tests/roundtrip-browser.mjs` sous Chromium : dégâts, morts, boucliers, mana et invocations conservés, avec de nouveaux dégâts classiques avant le retour RTS.
- Compilations VCMI `ninja -j32 html5` et OpenBW WASI réussies ; TypeScript strict et `verify:web` réussis. Tests crossover : 40 réussis ; Heroes : 694 réussis, 46 ignorés. Bundle Pages final : 999 149 869 octets.
- Le redémarrage signalé sur appareil physique n’a pas été reproduit sur ordinateur ; les allocations superposées identifiées ont été réduites et les tests navigateur ne montrent pas de redémarrage.

## Blocage des changements de mode — 15 novembre 2026

- Reproduction ciblée : remplacer uniquement la préparation audio par une promesse suspendue bloquait la simulation lors de sa synchronisation périodique. Le délai de réponse était supprimé avant l’achèvement de ce traitement et le contrôleur restait occupé. Aucun PV ou résultat n’est fabriqué.
- Correction : décodage audio indépendant des transferts, déduplication des décodages en cours, délai maintenu jusqu’à la fin de la réponse, rejet des réponses dupliquées et des achèvements après fermeture. Une réponse périodique ne peut pas reprendre RTS pendant le retour classique. Les temporisateurs appartiennent au panneau qui les a créés.
- L’ancien hôte dispose explicitement de sa minuterie native, son rendu, sa passerelle et son contexte audio avant le retrait de l’iframe ; la fermeture est idempotente.
- `STALL_SOUND=1 node experiments/crossover/tests/switch-stress-browser.mjs` : huit allers-retours actifs dans chacun des navigateurs Chromium et WebKit, avec doubles clics, préparation audio suspendue à partir du deuxième passage, actions classiques, vues classique/verticale et rotations portrait/paysage. Aucun blocage ni erreur de synchronisation ; un seul hôte préparé après chaque retour.
- `CLICK_ON_SYNC=1 STALL_SOUND=1 SWITCH_CYCLES=2 node experiments/crossover/tests/switch-stress-browser.mjs` : deux allers-retours par navigateur déclenchés au moment précis de la réponse native. Aucun redémarrage RTS pendant le transfert ; ancienne passerelle explicitement fermée à chaque fois.
- `tests/roundtrip-browser.mjs` réexécuté avec succès sous Chromium et WebKit sur la version finale : santé exacte dans les deux sens, blessures classiques supplémentaires, mana, morts et invocations conservées.
- Trois tests de cycle de vie ajoutés pour l’expiration pendant un traitement suspendu, la fermeture/réponse dupliquée et le refus d’une réconciliation. Total crossover : 39 réussis. Tests Heroes : 694 réussis, 46 ignorés sur 740. TypeScript strict, `verify:web` et `ninja -j32 html5` réussis.
- Bundle Pages final : 999 146 257 octets. La validation navigateur sur ordinateur ne remplace pas un essai sur l’appareil physique.

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

## Correction portée, résurrection et continuité — 15 novembre 2026

- `ninja -j32 html5`, reconstruction OpenBW, TypeScript, `prepare:web`, `build:web` et `verify:web` réussis ; 43 tests du crossover et 695 tests Heroes réussis (46 ignorés).
- Chromium et WebKit : tir réel du Master of Thunder à 596 pixels, déplacement inférieur à 80 pixels avant les dégâts, projectile Heroes dessiné ; pixels non transparents du projectile vérifiés sous WebKit. Démo, livre natif et bascule disponibles sur PC.
- Chromium et WebKit : déplacement réel de l’Antéchrist, huit images de mouvement visibles, position conservée après RTS → case classique → RTS.
- Chromium et WebKit : mort réelle sous Anneau de froid, sélection « Mort · Réanimer », Résurrection du héros, invocations, boucliers Protoss et animations de dégâts. Blessures et mana conservés après des tours classiques réels ; le test attend la réception du paquet de mana du serveur.
- Chromium et WebKit mobiles DPR 3 : préparation annulable et reprise ; pas de transfert d’image de plus de 1 769 472 pixels, pas de chargement massif des effets de sorts, une lecture de chaque MPQ par hôte.
- La reprise automatique d’une interruption audio respecte le silence choisi, l’arrière-plan et la destruction du contexte ; test de régression unitaire.

## Obstacles répétés — 15 novembre 2026

Le rendu utilisait la liste des cases de collision pour redessiner l’image complète de l’obstacle sur chacune d’elles. Le terrain RTS dessine maintenant une seule image par obstacle, dimensionnée sur son emprise, derrière les combattants. La synchronisation initiale transmet les obstacles au rendu avant d’afficher le terrain, y compris lors du premier lancement de la démo.

`tests/obstacles-browser.mjs` vérifie avec Chromium et WebKit qu’un véritable obstacle de huit cases est dessiné une seule fois par image et qu’il est présent dès l’image native zéro, avant l’affichage du terrain. Portrait et paysage inspectés ; les 43 tests du crossover, `verify:web` et le parcours complet de magie sous Chromium passent.

## Proportions StarCraft et transitions — 15 novembre 2026

Les six espèces utilisent 1,5 pixel logique par pixel natif, au lieu d’être toutes agrandies à un gabarit de 88. Les animations classiques ont été réextraites du même OpenBW/MPQ vérifié, dans une page isolée par espèce, et gardent le même ancrage et la même échelle dans toutes leurs poses. Le catalogue de preuve inclut les dimensions natives. Le rendu RTS et le centre des impacts suivent cette échelle.

La compilation du moteur démarre en parallèle avec la lecture/vérification des archives et est réutilisée entre hôtes. Ses objets appartiennent à la fenêtre principale, pour ne pas retenir le contexte d’un iframe détruit. Le cache ne contient pas de mémoire de simulation ni de MPQ. Sur mobile, le retour classique retire toujours l’hôte complet ; sur PC à pointeur fin, le prochain hôte prépare uniquement ses données, sans instancier de simulation. L’écran Heroes reste affiché pendant la préparation annulable, jusqu’à ce que le terrain RTS soit prêt.

- 47 tests du crossover et 695 tests Heroes réussis (46 ignorés) ; TypeScript et `verify:web` réussis.
- Chromium et WebKit, DPR 3 : proportions Marine/Dragoon dans les deux modes, captures portrait/paysage, écran classique conservé pendant la préparation ; une compilation pour deux instances successives, trois lectures d’archives vérifiées par hôte, objets compilés dans la fenêtre principale.
- Chromium et WebKit : annulation de la préparation, reprise, limites des transferts d’image conservées.
- Chromium PC : projectile réel du Master of Thunder et préchargement classique sans deuxième simulation.
- WebKit : deux bascules avec retour pendant une réponse magique et décodage audio bloqué, sans reprise intempestive ni rechargement du jeu.
- Dossier Pages : 998 975 736 octets. Les sprites restent les originaux classiques, sans ressources HD de remplacement.

## Sélection dans une mêlée — 15 novembre 2026

Un toucher normal privilégie désormais les alliés réellement touchés, même avec une sélection précédente et plusieurs ennemis superposés. Les pixels transparents ne suffisent plus à intercepter un toucher ; les barres de vie servent aussi de poignée de sélection. Le ciblage d’attaque explicite conserve la priorité aux ennemis. Sélectionner une autre troupe désarme un ancien ordre d’attaque et remet le bouton dans son état normal.

49 tests du crossover et `verify:web` passent. Le test de composant navigateur `melee-selection-browser.mjs` utilise un pont espion, sans simuler de dégâts : sur Chromium et WebKit, portrait et paysage, il vérifie le corps et la barre d’un allié entouré de douze ennemis, l’absence d’ordre envoyé par l’ancienne sélection, le clic direct sur un ennemi distinct et le ciblage explicite dans la mêlée. Le parcours complet du vrai combat avec sorts, résurrection, dégâts et morts passe également sous Chromium.

## Retour classique, Bouclier de feu et rebase — 15 novembre 2026

Rebase des 30 commits du crossover sur `origin/main` (`8bae90cd4b2abc82d555b5c2eabb7260b073e79c`, version 0.4.201). Le dépôt n’a pas de branche `master`. Les messages de campagne 270–272 sont conservés ; le message crossover utilise désormais l’identifiant libre 273. Reconstruction complète du moteur Heroes avec `ninja -j32 html5`, reconstruction OpenBW et vérification des deux sites réussies.

Les ennemis survivants possédaient leurs sprites, mais leurs petits corps pouvaient être recouverts par les grands Heroes et les repères de cible. Les vues mobiles classique et verticale redessinent leur pose native réelle au-dessus de ces recouvrements, avec un contour de repérage, sans créer de troupe ni changer la taille, les effectifs ou les cases.

Bouclier de feu reflète les dégâts physiques effectivement subis après réduction, plafonnés à la santé disponible. Les boucliers Protoss absorbent la riposte avant les points de vie. Les tirs restent exclus, conformément à Heroes. Les contacts réfléchis publient leur effet natif ; la protection garde son animation tant qu’elle est active.

- 50 tests du crossover et 734 tests Heroes réussis, 48 ignorés.
- Chromium et WebKit : vrais coups natifs Zergling/Zealot/Marine, avec et sans Bouclier de feu ; perte de santé Zergling, perte de bouclier Zealot sans perte de santé, aucune réflexion de tir Marine.
- Chromium et WebKit : sort 29 lancé depuis le vrai livre, ripostes et animation, puis présence des six groupes survivants et de leurs poses non transparentes en classique normal et vertical.
- Chromium : blessures, boucliers, mana et invocations conservés à travers des tours natifs classiques et le retour RTS.

Le rebase augmente les ressources du site au-delà du plafond Pages. Les JSON stricts du paquet de publication sont compactés sans réécrire leurs tokens, y compris les entiers de 64 bits et les clés dupliquées ; les JSON legacy commentés restent inchangés. Le moteur classique et son paquet de données sont distribués en gzip sans perte, décodés en flux par le navigateur. L’empreinte du WASM décompressé reste identique ; les noms JS, SRI, CSP et empreintes hors ligne sont renouvelés. Les tests contrôlent le retour exact des octets et les autorisations des scripts modifiés. Aucun contenu de campagne n’est retiré. Paquet Pages final : 996 290 951 octets.
