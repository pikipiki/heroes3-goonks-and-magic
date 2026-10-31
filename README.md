# Heroes Goonk

Heroes III dans le navigateur, avec le château Goonk, ses sept familles de peluches et leurs évolutions. Version 0.3.4, moteur VCMI 1.7.3 / Emscripten 4.0.23. Sources et provenance : `UPSTREAM.json` et `WOG-UPSTREAM.json`.

## Jouer sur ce Mac

`npm start`, puis http://127.0.0.1:8765/. Si le port est occupé : `PORT=8766 npm start`.
Le mode tactile s’active sur téléphone ; `?mobile=1` permet de le vérifier sur ordinateur, `?mobile=0` conserve l’interface classique.

L’interface mobile utilise les véritables commandes du moteur :

- **Carte** : glisser pour explorer, pincer pour zoomer, toucher une destination puis **Marcher** pour confirmer. **Héros** et **Villes** remplacent les petites listes latérales. Le défilement automatique de souris est désactivé.
- **Château** : vue de la ville, logements disponibles et grands panneaux de construction/recrutement, avec coûts, prérequis et quantité à recruter. Une construction par jour reste imposée par le moteur.
- **Armées** : toucher une troupe puis sa destination pour déplacer/regrouper ; cocher **Scinder cette troupe** pour séparer une quantité précise vers une case libre.
- **Combat** : glisser/pincer et utiliser la petite vue d’ensemble. **Cibles** présente les unités et la magie ; choisir une cible puis **Confirmer**. Attendre et Défendre sont accessibles directement.
- **Plus** : recentrer, sauvegarder et terminer le tour après confirmation. **Charger une partie** reprend la sauvegarde locale.

En portrait, les commandes sont en bas et les panneaux occupent la largeur ; en paysage, les commandes passent à droite. Les dialogues secondaires natifs, notamment le livre des sorts, restent consultables dans la scène avec zoom/déplacement et Valider/Retour.

## Menu, son et codes de triche

Le bouton **☰ Menu du jeu** est disponible sur ordinateur et dans l’en-tête mobile, y compris pendant les combats. L’onglet **Son** coupe ou réactive à la fois la musique et les effets ; le choix est conservé sur cet appareil et les volumes précédents sont rétablis à la réactivation.

L’onglet **Codes de triche** présente les codes VCMI et leur effet avec un bouton Appliquer : or/ressources, déplacements illimités, carte révélée, sorts, niveau, chance, moral et construction complète. Les actions nécessitant un héros ou une ville demandent une sélection adaptée. Elles sont accessibles pendant ton tour sur la carte ou dans une ville, et respectent l’option du moteur autorisant les codes. Leur utilisation marque la partie comme trichée.

## Installation et Netlify

Après un clonage : `npm ci --prefix work/browser-tests`, puis `npm run prepare:web`. Le moteur web précompilé est inclus dans `outputs/vcmi-wasm-goonk-0.3.3-engine.tar.gz`, et les données du jeu sont intégrées par morceaux de 4 Mo vérifiés dans `game-data/`.
`npm run prepare:web` reconstitue automatiquement les données dans `work/game-data/homm3eng/home/web_user/.local/share/vcmi/`.

`npm run build:web` prépare `dist/` pour Netlify et GitHub Pages ; `node scripts/verify-site.mjs` vérifie les liens du moteur et les données hébergées. La configuration `netlify.toml` lance la préparation automatiquement. `node work/browser-tests/static-server.mjs` permet d’essayer ce dossier public sur le port 8767.

Le site public distribue le moteur, les données Heroes III, les mods Goonk/WoG et les cartes. Au premier lancement, les fichiers se synchronisent automatiquement dans le stockage privé du navigateur (OPFS), sans exiger d'import manuel.

Les données téléchargées portent une empreinte de contenu et sont vérifiées par morceaux de 4 Mo. Un redémarrage réutilise les fichiers inchangés ; une mise à jour télécharge les fichiers modifiés seulement. Les sauvegardes sont préservées. Le moteur compilé constitue toutefois un fichier unique : sa modification entraîne son rechargement.

## Publier sur Netlify ou GitHub Pages

`npm run package:web` prépare le dossier `dist/` et l’archive `outputs/heroes-goonk-netlify-pages.zip`. Elle contient le moteur complet, les données de base et les mods.

**Netlify, dépôt manuel** : décompresser l’archive ZIP, puis déposer le dossier obtenu (ou `dist/`) sur https://app.netlify.com/drop. Déposer le site compilé, pas le dossier de sources. Le fichier `_headers` inclus active les fonctions nécessaires au moteur. Pour les mises à jour, déposer le nouveau dossier compilé dans les déploiements du même site. Le site représente environ 536 Mo : la connexion GitHub ci-dessous est préférable pour un envoi fiable ; Netlify recommande plutôt Git ou son outil en ligne de commande pour les gros sites. Aucun fichier individuel ne dépasse 10 Mo.

**Netlify, depuis GitHub** : importer le dépôt dans Netlify. `netlify.toml` définit déjà la commande de compilation et `dist/` comme dossier à publier. Les prochains commits envoyés à la branche connectée déclenchent un nouveau déploiement.

**GitHub Pages** : la publication de ce dépôt est activée sur https://pikipiki.github.io/heroes3-goonks-and-magic/ et chaque envoi sur `main` lance automatiquement la construction puis le déploiement. Pour configurer une autre copie, envoyer ce dépôt dans un dépôt GitHub, puis ouvrir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Dans **Actions**, sélectionner **Publish Heroes Goonk to GitHub Pages**, puis **Run workflow** sur `main`. Les prochains envois sur `main` déclenchent ensuite la publication automatiquement. Le workflow `.github/workflows/pages.yml` compile le site et publie uniquement `dist/` ; aucune clé secrète personnelle n’est nécessaire. GitHub peut demander une validation du déploiement selon les réglages de ton dépôt.

La même archive fonctionne à la racine d’un domaine et dans un chemin de projet, comme `https://ton-compte.github.io/heroes-goonk/`. Les liens sont relatifs. Sur GitHub Pages, le premier accès prépare un service worker limité au dossier du jeu, puis relance la page pour activer les threads WebAssembly. Sur Netlify, les en-têtes du serveur activent directement ces fonctions. Utiliser l’adresse HTTPS publiée. Si le navigateur bloque les service workers sur GitHub Pages, un message et un bouton Réessayer apparaissent.

L’archive ne transforme pas le jeu en application hors ligne. Le service worker ajoute les en-têtes nécessaires ; il ne met pas toutes les ressources en cache. Les données et sauvegardes restent liées au domaine utilisé : passer de Netlify à GitHub Pages déclenche un nouveau chargement automatique des données, et les sauvegardes locales ne sont pas transférées entre domaines.

Validation locale des deux hébergements : `outputs/hosting-validation.json`. Serveur Netlify simulé : `node work/browser-tests/static-server.mjs`. Serveur GitHub Pages simulé sans en-têtes spéciaux : `PORT=8768 BASE_PATH=/heroes-goonk/ ISOLATION_HEADERS=0 node work/browser-tests/static-server.mjs`.

Références : [déploiement Netlify](https://docs.netlify.com/deploy/create-deploys/), [workflow GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [isolation WebAssembly](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).

## Wake of Gods

WoG **9.1.82**, branche officielle `vcmi-1.7`, est inclus dans `mod/wake-of-gods/`. La 9.1.83 vise VCMI 1.8 et ne convient pas au moteur 1.7.3 actuel. La provenance exacte figure dans `WOG-UPSTREAM.json`.
Le dossier voisin `Third-Upgrade-Mod-Full` contient un mod ERA, incompatible avec ce moteur. Le port WoG pour VCMI apporte ses créatures, commandants, artefacts et autres sous-mods compatibles ; il ne remplace pas intégralement le moteur Windows ERA ni tous ses scripts ERM. Les sous-mods déclarés désactivés par défaut restent désactivés.

## Sources et compilation

`mod/goonk/` contient le mod, `maps/000-Goonk.vmap` la carte, `web/` l’interface tactile et le cache, `scripts/` la préparation du site. `work/vcmi-wasm/client/MobileBridge.cpp` publie l’état du moteur et transmet les commandes tactiles sur son fil principal. Les coûts, déplacements, recrutements et résultats de combat restent gérés par VCMI.

`npm run build:mod` régénère les ressources du mod ; `npm test` vérifie le cache, la géométrie et les limites de recrutement. Les scénarios navigateur sont dans `work/browser-tests/mobile-*-e2e.mjs` et `mobile-combat-finish.mjs` ; ils nécessitent Chrome avec débogage sur 9223 et le serveur sur 8766.

Le moteur se compile avec Emscripten 4.0.23, CMake/Ninja et ses dépendances SDL2, Boost, zlib et FuzzyLite. Après configuration du dossier `emscripten`, exécuter `ninja -j32 html5`. FuzzyLite est fourni à la révision `13b3122f5c353c0389ed4e66041d548c44ec9df6`, afin de conserver les sources nécessaires à la compilation. Les sources VCMI conservent leur licence GPL ; les licences des dépendances sont dans leurs dossiers.

## Vérifications et limites

Voir `outputs/mobile-e2e.json`, `outputs/mobile-battle-e2e.json` et les captures `outputs/mobile-*.png`. Les essais portent sur une véritable partie de la carte Goonk dans Chrome, avec WoG activé, en fenêtres 390×844 et 844×390 : déplacement, construction, recrutement, séparation/regroupement, combat, victoire, déplacement après combat et sauvegarde/reprise.

Il reste à valider sur des téléphones physiques, notamment Safari/iPhone : mémoire WebAssembly, stockage disponible, chargement initial et gestes multitactiles réels. Une campagne entière n’a pas été terminée. Le décor de siège conserve encore celui du Château classique. Les anciennes sauvegardes gardent les bâtiments déjà construits ; commencer une nouvelle partie pour retrouver la progression de construction.

## Réduction des blocages intermittents (0.3.2)

Les notifications du moteur vers l’interface sont désormais asynchrones, avec une seule notification en attente et une détection des changements. La musique et les effets ne sont plus remis à zéro à répétition lorsque le son est coupé. Les sauvegardes locales sont synchronisées en file, avec regroupement des rafales ; le moteur ne recopie plus chaque sauvegarde entière pour un service cloud inutilisé et n’attend plus les traitements du navigateur sous son verrou d’interface.

Ces changements suppriment des sources de blocage identifiées dans le code. Le gel aléatoire de plusieurs secondes rapporté par le joueur n’a pas été reproduit à l’arrêt pendant les essais locaux ; cela ne prouve pas que toutes ses causes ont été éliminées. Les rapports de mesure sont dans `outputs/freeze-profile-*.json`.

## Souris sur Mac (0.3.3)

Le déplacement du curseur WebAssembly est appliqué après regroupement des événements, sous le verrou de la frame, plutôt que de bloquer le navigateur à chaque événement brut. La prise du verrou de rendu est désormais non bloquante sur le Web, pour supprimer la course après la vérification préalable de disponibilité. La variante native conserve son comportement habituel.

## Jeu intégré pour les tests (0.3.4)

À la demande du propriétaire, les données de son installation Heroes III sont versionnées dans `game-data/` : 418 fichiers (environ 335 Mio), stockés en morceaux de 4 Mio avec leurs empreintes. Le site de 536 Mio inclut les données, les cartes et musiques, le moteur et les mods. Le premier chargement est automatique et les lancements suivants réutilisent le stockage du navigateur. `npm run pack:game-data` permet de régénérer les morceaux depuis l’installation locale ; les sauvegardes et configurations personnelles sont exclues.

## Badge Netlify (0.3.5)

La construction autorise les scripts livrés avec le jeu et leurs modules, sur le domaine Netlify et sous le chemin GitHub Pages du projet. Les scripts ajoutés par l’hébergeur, dont `/.netlify/scripts/hud`, ne sont pas autorisés. La politique est fournie dans les pages et dans les en-têtes Netlify ; les workers et la compilation WebAssembly restent autorisés. Pour un nouveau domaine, adapter `scriptBases` dans `scripts/build-site.mjs`.

Netlify permet aussi de désactiver ce badge dans **Project configuration → General → Powered by Netlify badge → Off**, y compris sur une offre gratuite : [documentation officielle](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/). Aucun accès au compte Netlify n’était disponible pour changer ce réglage ; la correction publiée est dans le site.

Validation navigateur : `netlify-badge-e2e.mjs` vérifie le composant Netlify réel avec puis sans protection ; `badge-game-e2e.mjs` vérifie le démarrage WebAssembly et une nouvelle partie Goonk. Ces scénarios utilisent Chrome sur le port 9224 et le serveur statique sur 8767 ; construire avec `GOONK_TEST_ORIGIN=http://127.0.0.1:8767 npm run build:web` pour cet essai local. La construction publiée n’autorise pas cette adresse locale.

## Chargement parallèle et progression (0.3.6)

Les 5 446 fichiers ne sont plus téléchargés un par un : huit fichiers au maximum sont transférés en parallèle, avec lecture progressive des réponses. Les morceaux de chaque fichier restent séquentiels et vérifiés par SHA-256 ; les écritures et les points de sauvegarde sont ordonnés. Les fichiers déjà validés sont conservés après une interruption et réutilisés au prochain lancement. Le site conserve les liens relatifs compatibles GitHub Pages.

Le chargement affiche le pourcentage total calculé en octets (y compris les fichiers déjà présents), les volumes reçus, la vitesse globale, le nombre de fichiers restants et le nom, la progression et la vitesse de chacun des fichiers actifs. Les phases de vérification et d’enregistrement sont indiquées séparément ; 100 % n’est affiché qu’après enregistrement. Les vitesses sont mesurées sur une fenêtre récente, en octets reçus par le navigateur, et peuvent différer du débit radio ou des octets compressés sur le réseau.

`work/browser-tests/loading-e2e.mjs` teste une installation réelle, les deux orientations, le lancement d’une partie et le cache au second chargement. Avec une latence artificielle de 40 ms par requête sur le serveur local, le chargement complet testé prend environ 37 secondes ; ce chiffre ne prédit pas la vitesse d’un téléphone ou de Netlify.

## Petits fichiers regroupés (0.3.7)

Les 4 580 fichiers de mod de 64 Kio ou moins sont regroupés en **26 lots d’au plus 2 Mio** pour l’installation. Cela remplace 4 580 requêtes par 26, sans modifier les fichiers du moteur, leurs empreintes, ni invalider les données déjà présentes. Les URL individuelles des images sont conservées pour les portraits et les cartes de l’interface ; les lots ajoutent environ 50 Mio au site hébergé, sans doubler le téléchargement du joueur. Le cache de lots libère chaque tampon dès que ses fichiers nécessaires sont extraits. L’interface indique « Extraction du lot » lorsque les octets sont déjà disponibles, plutôt qu’une fausse vitesse réseau.

Le test complet avec la même latence locale de 40 ms par requête passe d’environ 37 à **19 secondes** avec ces lots ; le temps réel dépend du serveur et de l’appareil. Les erreurs réseau transitoires et certaines réponses temporaires du serveur déclenchent au maximum deux nouvelles tentatives. Les erreurs permanentes et les fichiers altérés restent signalés. Les tests vérifient aussi l’extraction des lots, les empreintes et la conservation des fichiers déjà validés après une interruption.

## Carte noire sur Safari mobile (0.3.8)

L’interface tactile copie le canevas WebGL du moteur dans un canevas 2D à chaque image. WebKit efface par défaut le tampon après présentation ; notre test a reproduit une copie transparente/noire, même lorsque la source était hors écran, alors que Chrome conservait cette source hors écran. Le canevas du moteur utilise désormais `preserveDrawingBuffer: true` en mode tactile, avant sa première création de contexte, et reste dans le viewport derrière l’interface. Les contextes de bureau et les canevas 2D conservent leurs options. Aucune modification du moteur compilé n’est nécessaire.

`work/browser-tests/mobile-render-e2e.mjs` vérifie le contenu réel des pixels après présentation dans Chromium et WebKit, avec une source visible et hors écran. `one-on-one-e2e.mjs` lance la carte originale « 1 on 1 » dans Chromium, vérifie que la carte contient des pixels visibles en portrait et paysage, puis déplace le héros. Une partie native complète dans WebKit n’a pas pu être validée ici : son essai a échoué pendant la préparation du stockage avec une erreur transitoire, avant le démarrage du moteur. Le téléphone physique reste à confirmer.

Référence du comportement : [spécification WebGL — tampon après présentation](https://registry.khronos.org/webgl/specs/1.0/).

## Recrutement natif animé sur mobile (0.3.9)

Le panneau de choix ouvre désormais la vraie fenêtre `CRecruitmentWindow` de VCMI : décor, fond de faction, créatures animées, variantes, coûts et commandes du jeu. Des commandes tactiles ajoutent la saisie de quantité, un curseur, « Tout », « Recruter » et « Annuler », en portrait et paysage. Le moteur reste responsable des limites de stock, du prix et des places disponibles.

Les achats passent par le même chemin que la fenêtre habituelle et arrivent dans `town->getUpperArmy()` (garnison ou héros en garnison). L’ancien panneau ciblait le héros visiteur lorsqu’il existait, ce qui différait du comportement natif et pouvait rendre les recrues difficiles à retrouver. Le message mobile de confirmation attend désormais la modification de l’armée ; il ne se contente plus d’annoncer l’envoi d’une demande.

Le moteur a été recompilé avec `ninja -j32 html5` ; la construction publique utilise `outputs/vcmi-wasm-goonk-0.3.9-engine.tar.gz`. Le test `native-recruitment-e2e.mjs` vérifie un achat de deux créatures classiques et de deux Paingpaing : variation exacte de l’or, du stock et de la garnison, animation réelle sur plusieurs images, orientations, quantité nulle désactivée et annulation sans achat. Voir `outputs/native-recruitment-e2e.json` et `outputs/recruit-*.png`. Ces tests utilisent Chromium en format téléphone ; le téléphone physique reste à confirmer.

## Recrutement direct, thème Heroes III et rotation (0.3.10)

Le bouton « Recruter » ouvre immédiatement la fenêtre native animée du premier logement, sans panneau de noms intermédiaire. Une rangée défilante permet de choisir les autres créatures et la croix de l’en-tête ferme le recrutement. Les logements sans stock restent consultables ; l’achat reste limité par le moteur. Les commandes réutilisent le moteur 0.3.9.

L’interface tactile et le menu utilisent désormais les textures `DIBOXBCK.PCX` et le cadre `TPRCRT.PCX` extraits des données Heroes III du propriétaire : `web/h3-theme/`, régénérables avec `work/browser-tests/extract-h3-theme.mjs`. Les boutons sont rectangulaires, à bordure dorée et fond brun/rouge, avec une police à empattements. Les commandes du dialogue natif conservent leurs graphismes et animations du jeu.

À l’ouverture/fermeture d’un panneau, lors d’une rotation, d’un changement de viewport ou de la perte de focus, les captures de pointeur et les gestes en attente sont libérés. Le fond devient inerte pendant un panneau ; sa croix a son propre gestionnaire et une cible de 48 px. La hauteur d’en-tête est mesurée, y compris la zone de sécurité, et le titre ne se réduit plus pour laisser le contenu déborder. La cause exacte sur l’iPhone du signalement n’a pas pu être observée physiquement.

`mobile-rotation-e2e.mjs` vérifie la fermeture après paysage → portrait et après interruption d’un pointeur maintenu, dans Chromium et WebKit. `native-recruitment-e2e.mjs` vérifie l’accès direct, les images animées, le changement de créature, l’achat et la croix après rotation dans une vraie partie.

## Combat tactile sans zoom répété et navigation (0.3.11)

Le combat affiche désormais le canevas natif complet (800 × 600), y compris la file d’initiative en haut. Le cadrage ne zoome plus à l’entrée, au changement d’unité ou au choix d’une cible. En portrait, le champ complet est suivi d’un panneau de commandes ; en paysage, ce panneau se place à droite. Les cartes d’unités affichent des extraits animés de la scène native et permettent de viser précisément un allié ou un adversaire avant confirmation. « Magie » donne accès aux sorts du héros et aux capacités de la créature.

Pour un déplacement, un toucher du terrain sélectionne le centre d’un hexagone ; une loupe et six grandes flèches ajustent la case sans agrandir ou déplacer le champ principal. Le moteur conserve la validation des déplacements et des attaques. Les commandes natives hors de la grille restent cliquables. Les anciens boutons de zoom et la mini-carte sont masqués pendant le combat, puisque le champ complet reste visible.

Sur la carte, « ◎ Héros » recentre directement sur le héros sélectionné et rétablit la vue normale. Le signe du déplacement envoyé au moteur est inversé : le décor suit désormais le doigt, au lieu de partir dans l’autre sens. Le test réel compare les pixels avant/après un glissement pour vérifier ce sens, puis recentre et démarre un combat.

Tests : `battle-ux-e2e.mjs` joue un combat Goonk réel, vérifie le cadrage, les centres de cases, le choix de cible, la loupe, les orientations et une attaque confirmée. `battle-layout-e2e.mjs` vérifie les pixels des bords supérieur et inférieur et les commandes de précision sous Chromium et WebKit. Les essais complets de moteur restent exécutés sous Chromium ; l’iPhone physique reste à confirmer. Les captures sont dans `outputs/battle-new-*.png`.

## Vue tactique mobile et sauvegarde périodique (0.4.0)

Le combat tactile s’ouvre sur un plateau adapté : votre armée en bas et l’adversaire en haut en portrait ; plateau à gauche et commandes à droite en paysage, y compris les petits écrans. Les figurines restent droites. Chaque unité animée est extraite séparément par le moteur dans un atlas transparent, sans découper ses voisins dans la scène. Leur taille est limitée à la case. Les cases accessibles et les obstacles viennent du moteur ; toucher une case ou une cible prépare l’action, puis « Confirmer » l’exécute. Le bouton « Classique » retrouve la scène native complète. Les zones de sécurité latérales sont respectées en paysage.

La vue tactique conserve les poses animées natives des créatures et les règles du combat. Elle simplifie le décor et place les unités sur leurs cases logiques ; les déplacements continus, projectiles et effets globaux de sorts restent visibles dans la vue classique.

Une sauvegarde silencieuse `Goonk-auto` est demandée toutes les 10 secondes pendant votre tour sur la carte ou dans une ville, avec une seule écriture à la fois. Son statut confirme la persistance locale effective. Le moteur ne sait pas reprendre un combat en cours : la sauvegarde y est différée, puis relancée dès le retour sur la carte. Le premier état jouable est également sauvegardé. Les noms de fichiers sélectionnés dans le chargement mobile sont désormais résolus depuis leur chemin natif, ce qui permet de reprendre cette sauvegarde après rechargement.

Validation : moteur WebAssembly recompilé avec `ninja -j32 html5`, archive `outputs/vcmi-wasm-goonk-0.4.0-engine.tar.gz`, 33 tests automatiques. `tactical-e2e.mjs` termine un vrai combat Goonk, observe plusieurs images animées distinctes et deux écritures espacées d’environ 10 secondes, vérifie le report pendant le combat, puis recharge le point de contrôle après la victoire avec les mêmes points de déplacement. `tactical-layout-e2e.mjs` vérifie les cibles tactiles, les limites de l’écran et les changements d’orientation sous Chromium et WebKit ; `battle-layout-e2e.mjs` vérifie le cadrage classique. Le moteur complet a été testé sous Chromium ; aucun essai sur iPhone physique n’est revendiqué.

## Ville panoramique et commandes Heroes III (0.4.1)

La ville occupe maintenant la zone de jeu disponible, avec un panorama que l’on fait glisser au doigt, sans déformer son dessin. « Vue entière » permet de retrouver le château complet ; l’aperçu affiche la partie visible et permet d’atteindre directement une autre zone. Les clics sont reconvertis dans les coordonnées du moteur. En paysage, la ville reste accompagnée d’une barre d’actions latérale ; la rangée des logements reste visible dans les deux orientations.

Le grand panneau qui répétait le nom et les actions de la ville est remplacé par une bande de recrues défilante. Chaque logement montre sa créature et son stock et ouvre le recrutement natif animé. Les quatre commandes restent Construire, Recruter, Armées et Carte. Les emojis sont remplacés par les icônes de l’hôtel de ville, du fort, des armées et de validation extraites des données originales. Les boutons utilisent les contours et textures normaux/enfoncés des boutons Heroes III, adaptés à des cibles tactiles d’au moins 44 px. L’extraction reproductible est dans `work/browser-tests/extract-h3-controls.mjs` ; l’atlas CPRSMALL restitue les portraits des créatures classiques qui manquaient dans le panneau mobile.

Validation : 34 tests automatiques, essais de panorama, de construction et d’accès au recrutement dans le vrai moteur, achats de recrues avec vérification de l’or et de la garnison, fermeture après rotation. `town-layout-e2e.mjs` vérifie l’espace occupé, les coordonnées des clics et les commandes à 390 × 844, 844 × 390 et 568 × 320 sous Chromium et WebKit. Les captures réelles et rapports sont dans `outputs/town-*`. L’essai sur iPhone physique reste à effectuer.

## Retour au vrai combat Heroes III sur mobile (0.4.2)

Le plateau abstrait de la version 0.4.0 est retiré. Le combat affiche directement la scène originale du moteur : terrain, obstacles, héros, créatures à leur taille native relative, déplacements, attaques, projectiles et effets de sorts. Les unités ne sont plus replacées dans des cases reconstruites. Le cadre des commandes de bureau en bas est remplacé par les actions tactiles ; la perspective du champ reste celle de Heroes III.

En portrait, une caméra rapprochée utilise la hauteur disponible et suit l’unité active ou la cible choisie dans la liste. Une partie du champ est alors hors écran : le glissement, l’aperçu cliquable et « Vue entière » donnent accès aux deux armées. En paysage, le champ complet est affiché par défaut ; « Rapprocher » reste disponible. Les changements de cadrage conservent les proportions des images et les clics sont reconvertis en coordonnées natives. Un grand portrait animé montre l’unité active ou la cible ; choisir une case vide garde le portrait de l’unité active.

Les réglages mobiles masquent par défaut la grille permanente, les plages de déplacement du moteur, les grandes fiches de héros et la file d’initiative VCMI. Les cases accessibles ne sont indiquées que lorsqu’on prépare un déplacement. Les réglages du combat restent accessibles dans « Magie » → « Options du combat », ainsi que les commandes natives de fuite et de reddition. Les préférences de son et les autres réglages sont conservés.

Le test avec les créatures classiques a révélé une inversion rouge/bleu dans l’atlas des portraits : les blitters DEF utilisent la disposition ARGB du moteur. Les portraits sont désormais dessinés en ARGB puis convertis en RGBA uniquement avant l’envoi au navigateur. Le moteur a été recompilé avec `ninja -j32 html5` et l’archive publiée est `outputs/vcmi-wasm-goonk-0.4.2-engine.tar.gz`.

Validation : 32 tests automatiques ; `native-battle-layout-e2e.mjs` contrôle les proportions, les limites d’écran, les clics et les grands portraits sous Chromium et WebKit à trois tailles de téléphone. `native-battle-e2e.mjs` observe plusieurs images animées, termine un combat Goonk réel et recharge la sauvegarde après la victoire. `native-classic-battle-e2e.mjs` vérifie une Harpie classique, ses couleurs et un déplacement réel ; seule la carte en mémoire de ce navigateur de test reçoit cette armée, la carte publiée reste intacte. Ces scripts remplacent les anciens essais de plateau abstrait et de cadrage classique. Captures et rapports : `outputs/native-battle-*` et `outputs/native-classic-*`. Le moteur complet a été testé sous Chromium, sans prétendre à un essai sur iPhone physique.

## Bouton de vue et grille de combat (0.4.3)

Le libellé du bouton de cadrage n’est plus réécrit pendant chaque image du combat. Le bouton a son propre gestionnaire d’appui : activation au relâchement, capture de pointeur et dédoublonnage du clic de compatibilité ; clavier et technologies d’assistance gardent leur accès. Son en-tête passe explicitement devant la scène. Une cible préparée est conservée lors du passage entre vue entière et rapprochée.

La grille est désormais visible en permanence par-dessus le terrain natif : contours fins et transparents, sans tuiles opaques. Elle reprend les centres et la géométrie des hexagones du moteur ; les lignes proches des créatures sont omises pour préserver leur dessin. Les cases accessibles restent mises en évidence lorsqu’on prépare un déplacement. Quand aucun stack actif n’est encore publié à l’ouverture du combat, la caméra cherche une créature amie plutôt que de rester au centre d’un terrain vide.

Validation : 36 tests automatiques, appui maintenu pendant 220 ms et stabilité du libellé pendant le rendu continu sous Chromium et WebKit, vérification des coordonnées en vue entière et des commandes en portrait/paysage. Le test dans le vrai moteur vérifie le passage à la vue entière, le retour au cadrage rapproché et un déplacement de Harpie. Captures : `outputs/combat-grid-whole.png` et `outputs/native-classic-*.png`. Les vérifications navigateur ne remplacent pas un essai sur iPhone physique.

## Placement tactique et magie (0.4.4)

La barre mobile distingue maintenant la phase de placement du combat normal. Pendant le placement, elle propose « Combattre », « Placer », « Troupes » et « Suivante ». « Combattre » termine la phase via le mécanisme natif VCMI. La magie, l’attente et la défense restent indisponibles jusqu’au premier tour de combat ; le moteur vérifie lui aussi cette règle avant d’émettre une action. La transition attend l’état effectif du serveur pour éviter qu’une action arrive avant la fin du placement. Le saut de l’introduction ne termine pas le placement. Les boutons mobiles conservent leurs éléments lorsque leurs états changent, pour préserver les appuis pendant les mises à jour du combat.

Le panneau explique « Placement des troupes » plutôt que d’afficher un faux tour adverse. Le menu de magie indique le mana, la présence du grimoire et la disponibilité réelle du héros ou du pouvoir de la créature. Un héros sans grimoire reçoit une explication et son bouton de sort reste désactivé. Les autres réglages du combat restent accessibles depuis ce menu pendant le combat normal.

Le moteur WebAssembly a été recompilé avec `ninja -j32 html5` ; le site utilise `outputs/vcmi-wasm-goonk-0.4.4-engine.tar.gz`. Validation : 39 tests automatiques et contrôles d’interface sous Chromium/WebKit. Le test `tactics-magic-e2e.mjs` donne Tactique expert et un grimoire au héros uniquement dans la carte en mémoire de son navigateur, vérifie le blocage des commandes incompatibles, le changement et le repositionnement d’une troupe, la fin du placement puis un vrai sort avec baisse du mana et des effectifs ennemis, sans erreur serveur. La carte publiée n’est pas modifiée par ce test. Captures et rapport : `outputs/tactics-*`.

## Goonks XL, retraite et sons (0.4.5)

La commande « Retraite » est directement visible à côté de Déplacer et Magie, en portrait comme en paysage. Elle utilise le raccourci natif et sa confirmation, avec les règles du moteur (tour actif et fuite autorisée). Elle reste bloquée pendant le placement tactique et les animations. Annuler la confirmation conserve le combat ; la valider mène au résultat puis à la carte.

La carte « Goonks », dans `maps/001-Goonks.vmap`, mesure 144 × 144 cases : rouge humain uniquement, bleu ordinateur uniquement, difficulté normale. Elle est présélectionnée pour une nouvelle aventure mobile, avec la faction Goonk. Le sélecteur Château permet de changer de faction avant le lancement ; les deux villes de départ sont des villes aléatoires liées à leur propriétaire, donc leur apparence et leurs logements suivent réellement la faction choisie. Les villes commencent avec un fort et leurs bâtiments de départ, puis se développent normalement. La carte comporte six villes neutres, quatorze mines, des gardes Goonks, des ressources, des bois et des rochers. Les dotations des deux côtés sont identiques et les objectifs disposent d’une approche accessible. Le générateur reproductible est `python3 scripts/build-goonks-map.py`. Les scripts de publication incluent désormais toutes les cartes `.vmap` de `maps/`.

Sept bruitages ElevenLabs Sound Effects v2 sont intégrés au moteur audio natif : nez, lance, flèche électrique, pet de Bubu (premier audio proposé), vomi, caillou et feu. Les évolutions utilisent les mêmes effets adaptés à leur type d’attaque. Les WAV mono PCM 22 050 Hz durent moins de 1,3 seconde ; les fichiers et leur provenance sont dans `mod/goonk/Content/Sounds/goonk/` et `mod/goonk/sound-effects.json`. Les boutons couper/rétablir le son fonctionnent avec ces effets. Le générateur de créatures conserve ces associations et copie les sons.

Validation : 44 tests automatiques, compilation WebAssembly `ninja -j32 html5`, vérification du site, démarrage réel XL et accès au recrutement Goonk, démarrage avec la faction Castle et recrutement Pikeman, passage réel au jour 2 après le tour IA, annulation de retraite après rotation puis retraite complète. Un autre test effectue un vrai tir de Bubu, vérifie le chargement du WAV et le mute/unmute sans erreur audio. Les contrôles Chromium/WebKit couvrent le bouton Retraite en 390 × 844, 844 × 390 et 568 × 320. Les tests ne constituent pas une partie XL entière terminée ni un essai sur iPhone physique. Rapports : `outputs/goonks-xl-e2e.json`, `outputs/goonk-sound-e2e.json`.

## Identifier et libérer le stockage (0.4.6)

Le menu affiche le nom Heroes Goonk et une rubrique « Stockage du jeu ». Elle montre un encadré HEROES GOONK, le domaine de la page à rechercher dans les données des sites du navigateur, la taille des fichiers du jeu et celle des sauvegardes. Les fichiers sont dans le stockage privé du navigateur pour ce site, pas dans un dossier Téléchargements ; le chemin Linux du moteur est un chemin virtuel et n’est pas présenté comme un dossier réel du téléphone. Les indications couvrent Safari iPhone/iPad, Chrome Android, Chrome/Edge PC et Safari Mac, avec des liens d’aide Apple/Google. Effacer toutes les données du site dans le navigateur efface aussi ses sauvegardes ; le menu l’indique.

La page indépendante `storage.html`, accessible avec « Quitter le jeu et gérer le stockage », propose de supprimer les fichiers Data/Maps/Mp3/Mods avec confirmation, en conservant Saves, les réglages et les autres données. Elle ne lance pas le moteur ni le téléchargement, et invalide uniquement l’index des fichiers installés pour les retélécharger à la prochaine ouverture du jeu. Un verrou partagé pendant une session de jeu et exclusif pendant le nettoyage bloque la suppression si un autre onglet compatible joue encore. Le bouton de sortie vers la gestion est bloqué en combat ou dans une fenêtre du jeu. Les pages de jeu restaurées depuis le cache de navigation se rechargent pour remonter correctement les fichiers. Si l’API de stockage ou les verrous sont indisponibles, la page explique de passer par les réglages du navigateur. Netlify et GitHub Pages ont des stockages séparés.

Validation : 49 tests automatiques ; nettoyage réel de six fichiers factices de moins de 100 octets dans un profil Chromium neuf et isolé, avec vérification préalable du stockage vide, annulation, refus si un autre onglet est actif, conservation octet pour octet d’une sauvegarde et des réglages, conservation du choix du son. WebKit en contexte privé refuse l’OPFS dans cet environnement : le scénario vérifie alors l’identification visible, les instructions et la suppression désactivée, sans prétendre avoir testé un nettoyage Safari/iPhone réel. Le test avec le vrai moteur vérifie aussi le démarrage d’une partie 1 contre 1, le rendu portrait/paysage et le déplacement du héros. Rapports : `outputs/storage-e2e.json` et `outputs/one-on-one-e2e.json`.

## Commandes de carte directement accessibles (0.4.7)

La carte mobile affiche désormais six commandes sans menu Plus : Marcher, Héros, Villes, Armée, Sauvegarder et Terminer le tour. Le recentrage sur le héros reste directement accessible en haut de la carte. En portrait, les commandes occupent deux rangées de trois ; en paysage mobile, elles occupent trois rangées de deux dans une barre latérale adaptée. Aucun défilement de cette barre n’est nécessaire sur les formats vérifiés. Les notifications se placent au-dessus ou à côté des commandes selon l’orientation.

Terminer le tour ouvre sa confirmation depuis la carte ; Annuler ne transmet aucune commande, et Oui, terminer laisse jouer l’ordinateur. La confirmation vérifie encore que le joueur a la main, même si l’état du jeu a changé pendant l’affichage. Sauvegarder et Armée sont également accessibles en un appui, avec désactivation selon l’état de la partie. La sauvegarde utilise la fenêtre de confirmation native du moteur.

Validation : 49 tests automatiques, contrôles Chromium/WebKit des six cibles tactiles en 320 × 568, 390 × 844, 844 × 390 et 568 × 320 ; accès Armée, sauvegarde, recentrage, confirmation/annulation et refus d’une confirmation devenue périmée. Le test dans le vrai moteur démarre Goonks, ouvre l’armée, enregistre une sauvegarde, conserve le jour après annulation, puis passe réellement du jour 1 au jour 2 après confirmation et tour IA. Rapports : `outputs/map-actions-layout-e2e.json` et `outputs/map-actions-native-e2e.json`.
