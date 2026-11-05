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

Après un premier lancement connecté complet, le solo peut démarrer hors ligne sur le même site et dans le même navigateur. Le service worker conserve le moteur et l’interface, tandis que les données et sauvegardes restent dans le stockage local du jeu. Une mise à jour est préparée en ligne et s’applique après fermeture des onglets du jeu. Si elle change des données, le premier lancement de cette version doit rester connecté le temps de les installer. Netlify et GitHub Pages disposent de stockages séparés. Les navigateurs, profils et sessions privées gardent également des installations distinctes. La gestion intégrée libère les données du jeu et son cache hors ligne dans le profil courant et conserve les sauvegardes. Ouvrir le jeu après cette suppression déclenche une nouvelle installation.

Validation locale des deux hébergements : `outputs/hosting-validation.json`. Serveur Netlify simulé : `node work/browser-tests/static-server.mjs`. Serveur GitHub Pages simulé sans en-têtes spéciaux : `PORT=8768 BASE_PATH=/heroes-goonk/ ISOLATION_HEADERS=0 node work/browser-tests/static-server.mjs`.

Références : [déploiement Netlify](https://docs.netlify.com/deploy/create-deploys/), [workflow GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [isolation WebAssembly](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).

## Multijoueur web

Le bouton **Online** utilise le [relais Docker](https://github.com/pikipiki/heroes-goonk-relay) hébergé sur Render. L’adresse publique `GOONK_LOBBY_RELAY` est définie dans `netlify.toml` pour la production Netlify et dans les variables GitHub Actions pour GitHub Pages. Pour un autre déploiement, configurer une adresse `wss://<hôte>/lobby` et autoriser l’origine du site sur le relais. Sans cette variable, le bouton reste masqué sur mobile.

Dans un salon privé, l’hôte peut choisir **Goonks Online**, inviter un autre joueur connecté par son pseudo dans **Invite Players**, puis démarrer la partie. L’invité ouvre son invitation et confirme l’entrée dans le salon.

L’hôte peut régler le chronomètre avant le départ. Les options vont d’une à dix minutes, avec un mode sans limite. La dernière sauvegarde automatique en ligne est conservée dans le navigateur de l’hôte pendant ses tours. Pour reprendre après fermeture, l’hôte ouvre un nouveau salon privé en mode **Load game**, choisit **Last online save**, invite l’autre joueur puis lance **Resume game**.

Active **Turn notifications** dans les réglages du jeu pour recevoir une notification système au début de ton tour si le client reçoit encore les événements en arrière-plan. Sur iPhone, ouvre le jeu depuis l’écran d’accueil et accorde l’autorisation depuis ce bouton.

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

## Ville Goonk illustrée en portrait (0.4.8)

En portrait mobile, la ville Goonk utilise une illustration verticale originale et des bâtiments indépendants répartis sur ses terrasses. Le décor couvre toute la scène sans bande vide et les bâtiments restent entièrement visibles. Seuls les bâtiments réellement construits sont affichés ; les améliorations remplacent leur variante de base au même emplacement. Les logements conservent leurs couleurs et leur aspect d’origine. Les zones tactiles mesurent au moins 44 pixels ; le survol ou le focus montre un contour et le nom du bâtiment. Les éléments tactiles sont conservés pendant les mises à jour pour préserver les appuis.

Chaque bâtiment appelle directement `CCastleBuildings::buildingClicked` via la commande mobile 39, après validation native du propriétaire, du tour et de l’existence de la construction. Les fenêtres du moteur (recrutement animé, hôtel de ville, etc.) restent les vraies fenêtres de VCMI. La façade mobile ne construit et ne recrute rien à la place du moteur. « Vue classique » permet de revoir le panorama ; « Vue portrait » rétablit l’illustration. La rotation vers le paysage conserve la vue native, puis le retour en portrait rétablit la composition verticale. Les autres factions conservent leur vue native.

Le nouveau décor est `web/town/portrait-v2.webp` (environ 556 Ko), créé avec l’outil image_gen intégré puis optimisé pour le téléchargement. Son prompt est dans `web/town/portrait-v2.prompt.txt`. Le paysage natif existant et les illustrations des autres factions restent inchangés. Le moteur utilise l’archive recompilée `outputs/vcmi-wasm-goonk-0.4.8-engine.tar.gz`.

Validation : 52 tests automatiques ; compilation `ninja -j32 html5` ; ville complète et cibles tactiles sous Chromium/WebKit en 320 × 568, 390 × 844 et 430 × 932, coins de la scène effectivement peints, contours, appui maintenu pendant les mises à jour, aller-retour classique et rotation. Le vrai moteur vérifie le recrutement Paingpaing depuis le bâtiment, l’ouverture de l’hôtel de ville, le refus d’une construction inexistante, la construction du logement de niveau 2 et son apparition dans le décor, le changement d’orientation. Le scénario de ville classique vérifie aussi le défilement, le recrutement et la fermeture après rotation. Aucun essai sur iPhone physique n’est revendiqué. Rapports : `outputs/town-portrait-native-e2e.json`, `outputs/town-portrait-layout-e2e.json`, `outputs/town-e2e.json`.

## Ressources illustrées (0.4.9)

L’en-tête mobile affiche les sept icônes originales Heroes III et leurs quantités : bois, mercure, minerai, soufre, cristaux, gemmes et or, dans l’ordre du moteur. En portrait, elles occupent une rangée compacte sous le nom ; en paysage elles partagent la première rangée. Les points de déplacement du héros restent séparés. Le combat conserve son en-tête consacré à l’unité active. Les nombres utilisent un format français compact (20k, 19,3k, 1M) sans arrondir le budget disponible à la hausse. Le nombre exact reste dans le libellé accessible et l’infobulle. Seule la présentation est abrégée : les achats et calculs du moteur utilisent toujours les valeurs exactes.

Les images proviennent de SMALRES.DEF, extrait avec `node work/browser-tests/extract-h3-resources.mjs`. Les nœuds des icônes restent en place lors des mises à jour des quantités. Les vues portrait Goonk se basent sur l’orientation de l’écran, afin de rester accessibles lorsque l’en-tête réduit la hauteur disponible.

Validation : 54 tests automatiques ; affichage et chargement des sept icônes, valeurs extrêmes, formats k/M, absence de débordement et mise à jour sans remplacement des images sous Chromium/WebKit en 320 × 568, 390 × 844, 430 × 932, 568 × 320 et 844 × 390. La ville Goonk complète est également contrôlée avec la nouvelle barre. Le scénario dans le vrai moteur vérifie les icônes, une construction et la diminution du montant d’or affiché, ainsi que le recrutement et la rotation. Rapports : `outputs/resource-header-e2e.json`, `outputs/town-portrait-native-e2e.json`.

## Château Goonk Retina sur la carte (0.4.10)

La vue mobile reçoit désormais un véritable framebuffer 1600 × 1200 pour 800 × 600 coordonnées logiques. Le château dispose d’une texture `Content/Sprites2x/goonk/map-town-v2.png` de 384 × 320 pixels, produite directement depuis l’illustration originale de 1536 × 1024, avec le même ancrage et la même emprise que la version 192 × 160. Les détails ne sont donc plus limités au petit sprite agrandi. Le moteur conserve la composition des cases : héros, drapeaux, obstacles et brouillard restent dans leur ordre normal. Le panoramique de ville et les autres illustrations ne sont pas remplacés.

Les textures existantes utilisent un agrandissement simple sur mobile pour éviter le coût du filtre xBRZ ; les textures HD sont chargées directement. Les couches optionnelles absentes (ombre/couleur du joueur) des PNG sans palette ne sont plus générées à partir de leur image entière, ce qui évite de teinter tout le château en rouge. Les préférences vidéo enregistrées ne sont pas réécrites. Le téléchargement supplémentaire du château est d’environ 205 Ko et utilise le cache habituel.

Génération : `node work/browser-tests/build-map-castle-hd.mjs` (également appelée lors de la reconstruction du mod). Moteur recompilé avec `ninja -j32 html5`, archive `outputs/vcmi-wasm-goonk-0.4.10-engine.tar.gz`. Le scénario `map-castle-hd-e2e.mjs` vérifie dans le vrai moteur le framebuffer Retina, les couleurs des toits, le zoom, les deux orientations et le recrutement natif. Rapport : `outputs/map-castle-hd-e2e.json`. Les 54 tests automatiques passent ; les scénarios natifs de déplacement et de combat classique passent également, ainsi que les contrôles de cadrage et de commandes sous Chromium/WebKit. Les essais navigateur ne constituent pas un essai sur iPhone physique.

## Bâtiments HD et fermeture tactile de la taverne (0.4.11)

Les bâtiments Goonks, leurs améliorations, les contours et les cartes de construction disposent de textures à résolution double dans `Content/Sprites2x/goonk`. Elles sont produites depuis l’atlas original, avec les mêmes dimensions logiques, ancrages et emplacements. Le panorama natif utilise aussi le décor original en 1600 × 748. La vue portrait et les cartes mobiles préfèrent ces ressources HD, avec repli sur les textures standard si une ressource HD n’existe pas. La construction progressive et les couleurs des logements restent celles du mod.

La taverne expose au mobile la position réelle de son bouton d’annulation. Sa cible tactile est agrandie à au moins 44 × 44 pixels et suit le cadrage, le zoom et les changements d’orientation. Une croix de fermeture reste accessible dans l’en-tête. Ces deux commandes, ainsi que Retour dans la taverne, utilisent une annulation native dédiée qui ne peut pas valider une action ou fermer la ville située derrière ; les commandes retardées après fermeture sont ignorées. Le cadre d’origine Heroes III est conservé. L’appui précis sur le bouton d’origine fonctionnait dans l’essai initial sur navigateur ; le nouveau chemin évite de dépendre d’une petite cible et du routage des gestes sur le canvas.

Génération : `node work/browser-tests/build-town-hd.mjs`, également appelée lors de la reconstruction du mod. Compilation `ninja -j32 html5`, archive `outputs/vcmi-wasm-goonk-0.4.11-engine.tar.gz`. Les 56 tests automatiques passent. Dans le vrai moteur, `town-hd-native-e2e.mjs` vérifie les bâtiments et cartes HD, le recrutement, la fermeture en touchant le bord agrandi du bouton en trois tailles d’écran, la rotation et l’appui maintenu, puis le refus d’une annulation périmée. Les scénarios Chromium/WebKit contrôlent les bâtiments réellement dessinés en HD, les contours et les zones tactiles de fermeture en portrait/paysage. Rapports : `outputs/town-hd-native-e2e.json`, `outputs/tavern-touch-layout-e2e.json`, `outputs/town-portrait-layout-e2e.json`. Aucun essai sur iPhone physique n’est revendiqué.

## Carte mobile après rotation (0.4.12)

Le moteur tactile conserve sa source Retina 1600 × 1200 pendant les rotations : le navigateur recadre uniquement la vue mobile. Les notifications DOM de redimensionnement et les événements SDL de taille/restauration ne reconstruisent plus les textures du moteur mobile. Les redimensionnements réellement nécessaires sur les autres présentations restent possibles ; une demande aux dimensions déjà courantes devient une opération sans effet.

Les notifications de rotation, de barre d’adresse et de hauteur d’en-tête sont regroupées avant de traiter la géométrie finale. Les notifications tardives aux dimensions identiques n’annulent plus un nouvel appui sur la carte. Les échantillons de glissement sont additionnés en coordonnées logiques et envoyés au plus une fois par image ; les échantillons non envoyés sont annulés lors d’une réinitialisation de geste.

Validation : 58 tests automatiques et compilation `ninja -j32 html5`. Le scénario natif `map-rotation-native-e2e.mjs` effectue huit aller-retours portrait/paysage, dont quatre pendant un glissement, vérifie que la rotation ne déplace pas le héros, sollicite 120 notifications de redimensionnement, ouvre et referme réellement la ville, puis choisit un trajet au toucher et déplace réellement le héros en portrait. La mémoire WebAssembly reste à 512 Mo dans ce scénario et la source reste 1600 × 1200. Le scénario Chromium/WebKit vérifie que le rendu continue, que les notifications tardives ne mangent pas un appui et que Marcher reste accessible. Rapports : `outputs/map-rotation-native-e2e.json`, `outputs/map-rotation-layout-e2e.json`. Le moteur utilise `outputs/vcmi-wasm-goonk-0.4.12-engine.tar.gz`. Ces contrôles navigateur ne constituent pas un essai sur iPhone physique.

## Reprise du son sur mobile (0.4.13)

Le navigateur peut suspendre ou interrompre son AudioContext après une interruption ou un changement d’orientation alors que les volumes du moteur restent positifs. `web/audio-recovery.mjs` reprend le contexte SDL existant depuis les gestes de l’utilisateur et au retour au premier plan ; il ne crée pas de deuxième circuit audio. Les écouteurs restent actifs après la première interaction. Une ancienne demande de reprise qui attend l’autorisation de lecture ne bloque pas les essais suivants au toucher. Le choix « son coupé » reste prioritaire.

Le menu Son indique l’état du circuit audio et propose « Rétablir le son », avec le bruit de bouton natif comme confirmation lorsque les effets sont actifs. Réactiver un moteur silencieux alors que ses deux volumes sont nuls restaure les valeurs disponibles ; si elles sont toutes deux nulles, la demande explicite rétablit 75 %. Les volumes déjà actifs et les réglages séparés musique/effets sont conservés. Les boutons restent les mêmes éléments pendant les mises à jour, et les anciens états du moteur ne renversent plus une demande muet/réactivation encore en attente de confirmation.

Validation : 63 tests automatiques, compilation `ninja -j32 html5`, archive `outputs/vcmi-wasm-goonk-0.4.13-engine.tar.gz`. Le test natif suspend volontairement l’audio, effectue un aller-retour d’orientation et vérifie sa reprise au toucher, puis mesure un signal sonore réel dans le circuit SDL. Il contrôle également la restauration depuis deux volumes initialement nuls, la conservation du même contexte audio, le mode muet et sa désactivation. Les contrôles Chromium/WebKit utilisent un vrai AudioContext pour la reprise au geste, les réponses natives tardives simulées, la stabilité des boutons et la préférence muet mémorisée. Rapports : `outputs/audio-native-e2e.json`, `outputs/audio-menu-layout-e2e.json`. La mesure du signal logiciel ne constitue pas une écoute sur iPhone physique.

### Reprise après retour dans l’application (0.4.14)

Un simple retour au premier plan conserve le moteur et la partie en mémoire. Le retour depuis le cache de navigation ne recharge plus systématiquement la page ; le verrou de stockage est repris. Une suppression ou modification des données du jeu pendant cette absence exige encore un rechargement.

Après un vrai redémarrage de la page, la sauvegarde locale compatible la plus récente est sélectionnée puis chargée automatiquement, avec un indicateur de progression et sans double commande de démarrage. Une sauvegarde vide ou dont le moteur ne peut pas lire l’en-tête est ignorée. Le bouton « Choisir une autre partie » permet de reprendre la main avant le lancement du chargement.

La sauvegarde périodique reste à 10 secondes ; un dernier enregistrement est aussi demandé au passage en arrière-plan si l’état du moteur le permet. Le navigateur peut suspendre ce dernier enregistrement : seule une sauvegarde dont la persistance est confirmée peut être reprise. Les combats en cours ne sont pas enregistrables et les sauvegardes restent propres au domaine du site.

### Audio et animations des Goonks (0.4.15)

La réactivation du son et « Rétablir le son » reconnectent la sortie SDL et remplacent un processeur audio bloqué, en conservant le même AudioContext et le callback du mixeur. Une confirmation sonore est jouée après réactivation. L’Audio Session est réglée sur `playback` lorsque la plateforme le permet ; les navigateurs sans cette API restent compatibles et le choix muet est préservé. Un signal du véritable moteur a été mesuré après une déconnexion volontaire sous Chrome ; le remplacement du processeur et les gestes sont aussi vérifiés sous WebKit. Ces essais ne remplacent pas une écoute sur un iPhone physique.

Les fonds natifs des créatures mesurent désormais 100×120 et 100×130 pixels, avec des sources 2×. Les contours de lignes et de colonnes des planches sont détectés dans leurs espaces transparents pour éviter de couper un personnage ou de récupérer son voisin. Les quatorze unités disposent de douze poses de marche et de dix à douze poses d’attaque distinctes ; les cellules montrant uniquement un projectile sont remplacées par une pose corporelle, car le moteur dessine déjà le projectile. Les cycles d’attente utilisent une respiration progressive. La vitesse d’attente en combat passe de 2,4 à 30 images/s ; les aperçus Goonks avancent toutes les 33 ms. Le rendu mobile suit désormais requestAnimationFrame au lieu d’une limite à 25 images/s. Il ne s’agit pas d’une promesse de 60 poses distinctes par seconde sur tous les appareils.

Les quatre planches originales ont été créées avec l’outil intégré `image_gen` et sont conservées dans `outputs/goonk-art/*-v3.png`. Les prompts sont dans `outputs/goonk-art/animation-v3-prompts.json`. `work/browser-tests/build-goonk-poses.mjs` réalise leur découpage reproductible en animations natives, sans interpolation entre deux silhouettes différentes.

### Transferts d’armées sans fermer le panneau (0.4.16)

Le panneau « Organiser les armées » reste ouvert après un déplacement, un regroupement ou une séparation de troupe. Les cases sont actualisées après confirmation du moteur, en conservant le défilement et le focus sur la destination. Les commandes de transfert sont temporairement désactivées pendant cette confirmation pour éviter une deuxième action sur des quantités périmées. Les sauvegardes seules ne reconstruisent pas le panneau et leur notification n’intercepte plus les touches. La croix permet toujours de fermer volontairement le panneau.

### Un seul bouton Son (0.4.17)

Dans le menu, l’onglet général s’appelle « Réglages ». Il contient un unique interrupteur « Son activé / Son coupé », avec un état accessible et mémorisé. La commande « Rétablir le son » est supprimée : sa réparation de la sortie audio est exécutée automatiquement lors de la réactivation. Le contrôle attend la confirmation du moteur avant d’accepter une nouvelle action.

### Vue d’ensemble de la carte d’aventure (0.4.18)

La mini-carte native est visible dans la vue mobile de la carte d’aventure, en portrait et en paysage. Elle représente le monde complet au niveau actuellement affiché, avec les terrains explorés, les couleurs du joueur et le brouillard de guerre d’origine. Un cadre doré indique la portion réellement visible après le recadrage ou le zoom mobile. Les cartes rectangulaires gardent leurs proportions.

Toucher la mini-carte recentre la caméra via le véritable composant natif ; cette action ne crée pas de trajet et ne dépense aucun point de déplacement du héros. Les flèches du clavier fonctionnent aussi lorsque la mini-carte a le focus. Les boutons de zoom et de recentrage restent séparés de cet aperçu, y compris sur un écran de 320 pixels de large. La compilation WebAssembly, 78 tests unitaires et un scénario natif XL en 390×844, 844×390 et 320×568 ont été vérifiés.

### Toucher le château et cohérence des images locales (0.4.19)

En vue mobile, toucher les murs ou le toit de son château ouvre sa ville sans déplacer le héros. Un appui long prépare un trajet vers l’entrée ; « Marcher » confirme le déplacement. Des touchers répétés sur un trajet ne font plus partir le héros automatiquement. Une commande de carte retardée est ignorée si une fenêtre de ville s’est ouverte entre-temps.

Le serveur de développement synchronise les sources des mods au démarrage. Les anciens aperçus locaux pouvaient conserver les animations précédant la correction des morceaux d’autres personnages. Les 861 images référencées par les quatorze animations Goonks ont été contrôlées et un combat natif a été lancé avec les données actuelles. Une partie déjà ouverte garde ses images en mémoire : il faut recharger sa page pour charger la version mise à jour, sans supprimer ses sauvegardes.

La compilation WebAssembly et les 78 tests unitaires de la version ont été vérifiés, ainsi que l’ouverture de la ville sur 390×844, 844×390 et 320×568 (après déplacement de la carte lorsque ses commandes couvrent le château), la préparation du trajet sans dépense de points, puis l’arrivée du héros après confirmation.

## Évolutions TUM pour VCMI

`mod/third-upgrades/` contient **Wrath of the Creators 1.1.12**, avec les évolutions des neuf villes, les nouveaux bâtiments, les unités neutres et le sous-mod de compatibilité WoG. Il est chargé avec WoG et ses créatures de niveau 8 dans les versions locale et publiée. Les correctifs HotA et Tides of War restent désactivés en l’absence de ces extensions.

`mod/tum-era/` ajoute **Blood Dragon → Red Bones Dragon**, avec l’animation de combat, l’animation de carte et les deux portraits originaux extraits de TUM Full 3.5.0. Ses statistiques viennent de `Crtraits.txt` : 400 PV, vitesse 18, attaque 30, défense 27, dégâts 40–75, coût 6 000 or et 3 mercure. Il dispose des capacités natives du Blood Dragon WoG, de 50 PV de régénération et de l’absence de riposte. Le quatrième logement de Necropolis permet le recrutement et l’amélioration ; il réutilise le visuel et l’icône du Dragon Vault avancé. Sur mobile, **Construire → Plan complet et évolutions TUM** donne accès à tous les niveaux du plan natif, avec zoom tactile. Son prix de construction (30 000 or, 10 bois, 10 minerai, 20 mercure) est un choix d’adaptation local.

Les trois sources sont disponibles dans les dépôts voisins `Third-Upgrade-Mod-Full`, `third-upgrades` et `tow-tum`. Le dernier est une variante autonome qui redéfinit les mêmes villes : il n’est pas chargé simultanément. Les révisions exactes, la provenance des ressources et les limites sont dans `TUM-UPSTREAM.json`. L’import initial peut être reproduit avec `node scripts/import-tum.mjs /chemin/vers/les/depots` après installation des dépendances de `work/browser-tests` ; le script refuse d’écraser une importation existante.

Cette intégration ne constitue pas un port complet de TUM 3.5 : les autres quatrièmes évolutions propres à ERA, les effets d’impact ERM et ses mécanismes Windows restent à adapter. Les capacités de peur, vieillissement et vol de vie suivent le comportement du port WoG VCMI. Commencer une nouvelle partie pour obtenir les nouvelles définitions ; les anciennes sauvegardes conservent leur liste de mods et leurs créatures.

Validation TUM : 81 tests passent sur l’instantané du commit ; construction et vérification du site réussies. Le scénario `work/browser-tests/tum-native-e2e.mjs` démarre une partie Necropolis, ouvre le plan natif et recrute un Red Bones Dragon dans la garnison. Il utilise le code de construction complète pour atteindre le quatrième logement : une progression normale sur plusieurs jours et toutes les capacités en combat restent à vérifier. Rapport : `outputs/tum-native-e2e.json`.

### Fragments dans les anciens sprites Goonks

Certaines anciennes images conservées après le remplacement des animations v3 contenaient encore des morceaux de la case voisine : par exemple `fire-royal-breathe-0.png` portait les bandes violettes au-dessus de la tête et un second personnage à droite. Le nettoyage s’applique maintenant aussi aux 539 images référencées par les animations antérieures ; 490 fichiers ont changé. Les couleurs sous les pixels entièrement transparents sont effacées également. La taille du canevas et la position du personnage restent inchangées. Le générateur applique ce nettoyage pour éviter une régression.

Un test vérifie la suppression des fragments et du RGB invisible sans déplacer la créature. Les 81 tests unitaires de la version passent. Un combat natif a aussi été joué avec les anciennes définitions d’animation et les formes évoluées pour vérifier directement ces références de compatibilité. Une page déjà ouverte conserve ses images : recharger la page applique les nouveaux fichiers sans effacer les sauvegardes.

### Repères immédiats et commandes d’équipe en haut (0.4.20)

La vue mobile montre immédiatement la troupe active avec un anneau doré au sol et une étiquette à côté d’elle. Les cases de destination autorisées sont mises en évidence et comptées sans toucher le terrain ni activer « Déplacer ». Le moteur fournit la portée : le placement tactique utilise ses emplacements autorisés, puis le combat utilise la portée réelle, avec les obstacles et les portes franchissables. Les cases occupées ne sont pas proposées comme destinations ; le dessin protège les corps des créatures. La caméra retrouve la nouvelle troupe lorsqu’on change d’unité ou que le premier tour commence, sans préparer un déplacement.

« Retraite » et « Autocombat » se trouvent dans les commandes d’équipe en haut, sur deux rangées en portrait et une rangée en paysage. Les actions du bas concernent la créature. L’autocombat est celui du moteur ; le bouton permet de reprendre la main pendant le mode animé, même lorsque l’IA contrôle les actions des troupes. Les demandes répétées d’activation sont idempotentes et les commandes manuelles sont désactivées pendant ce mode. Le réglage natif de résolution rapide est conservé. La retraite respecte les permissions du combat et conserve sa confirmation.

Vérifications : compilation `ninja -j32 html5`, 88 tests unitaires, combats natifs avec et sans placement, changement de troupe, premier tour, rotations et écrans de 390×844, 844×390 et 320×568. Le scénario vérifie l’affichage des cases et de l’anneau sans aucune interaction préalable avec le champ de bataille, la présence et la taille tactile des deux commandes en haut, l’annulation de la retraite, l’activation/arrêt de l’IA, puis une bataille menée jusqu’au résultat final en autocombat.

## Bridge ERA natif

Le développement du bridge est décrit dans `ERA-BRIDGE.md`. Il réutilise les données TUM et les services natifs VCMI ; la compatibilité complète avec ERA 3.5 reste explicitement incomplète et les opérations sans adaptateur vérifié sont rejetées. L’audit détaillé est dans `outputs/era-bridge-audit.json`.

### Combat portrait : terrain complet et vue rapprochée

En portrait, une vue stratégique affiche en permanence tout le champ de bataille natif. Toucher une zone y recentre la vue rapprochée du dessous sans préparer de déplacement ; toucher une troupe permet de l’examiner ou de préparer une cible. Le cadre pointillé situe le cadrage rapproché sur la carte entière. Les flèches du clavier déplacent aussi ce cadrage lorsque la vue stratégique a le focus.

La vue du dessous conserve les animations, sorts, projectiles et décors natifs, avec des hexagones d’au moins 44 pixels CSS de large. Toucher une case autorisée ou une cible prépare l’action ; la confirmation reste nécessaire. Une rotation conserve la cible choisie. Les commandes de la créature sont regroupées en bas et le panneau de détails est compact ; en paysage, la présentation native habituelle est conservée.

Validation : 124 tests unitaires sur la version isolée du changement, combat natif avec déplacement confirmé, choix de cible, ouverture/fermeture de la magie, orientations 390×844 et 844×390, petit écran 320×568, puis autocombat jusqu’au résultat et retour sur la carte. Les gestes et performances sur téléphone physique restent à confirmer.

### Cycles Goonks comparés aux animations Heroes III (0.4.21)

Les fichiers `H3sprite.lod` et `CRANIM.TXT` fournis ont servi à comparer neuf créatures : lancier, hallebardier, gnoll, ogre, orc, archer, cyclope, mage et beholder. `work/browser-tests/audit-native-animation.mjs` reproduit la mesure des groupes et des durées ; `h3-animation-reference.json` en conserve le résultat. Les dessins Goonks existants sont conservés.

Le groupe de réaction au survol/repos utilisait des images de marche, avec une fréquence de réaction supérieure à celle des unités natives. Il utilise maintenant des poses stationnaires. Les cycles de marche, attente, rotation, démarrage/arrêt, mêlée et tir sont affectés séparément. Le déplacement visuel de Bubu et Glouglou reprend le rythme plus lourd de l’ogre ; Picpique suit le lancier puis le hallebardier. Les attaques à distance suivent une préparation, une émission du projectile et une récupération distinctes : Bobope utilise les 17 temps du lancer du cyclope et son émission à la septième image. Certaines poses sont maintenues pour le rythme ; cela ne représente pas 17 nouveaux dessins. Les statistiques de vitesse tactique sont conservées.

Le raccourci qui imposait 33 ms à toutes les animations d’aperçu Goonks est supprimé : elles utilisent les 100 ms des autres créatures. Le générateur conserve ces profils lors d’une reconstruction. La cadence mesurée dans les aperçus natifs est de 100,3 ms pour Paingpaing, 100,1 ms pour Bobope et 100,5 ms pour le gnoll original. Le déplacement de Bobope a montré 14 images distinctes pendant ses différentes phases, puis un combat de tirs a été joué jusqu’au résultat. Compilation `ninja -j32 html5`, 125 tests et vérification du site statique réussis. Les services natifs ERA déjà présents sont conservés dans le nouveau moteur.

### Caméra de combat et repères d’action (0.4.23)

Dans la vue rapprochée, la caméra suit les positions animées transmises par le moteur pendant les déplacements. Les attaques et sorts cadrent leurs cibles réelles, y compris celles de l’adversaire et les alliés touchés. Le cadrage s’élargit progressivement pour plusieurs cibles. La carte complète indique l’attaquant, les cibles, les cases touchées des troupes et le trajet natif. Elle reste visible en portrait.

Explorer une zone suspend le suivi ; « Revenir à l’action » le reprend. Une nouvelle action native reprend aussi le suivi. Le livre des sorts et les dialogues de combat conservent le choix de vue ; une nouvelle bataille commence toujours en vue entière. Le réglage de réduction des animations supprime les transitions de caméra.

Le moteur est livré dans `outputs/vcmi-wasm-goonk-camera-follow-engine.tar.gz`. La compilation isolée utilise `ninja -j32 html5`. Vérifications : 137 tests unitaires, scénarios tactiles Chrome/WebKit, construction et vérification du site, puis bataille native avec sort de zone. Le téléphone physique reste à confirmer.

Les commandes du combat sont agrandies à 52–56 pixels de haut (48 pixels pour certaines commandes sur les plus petits écrans), espacées et protégées contre les clics de compatibilité retardés qui pourraient atteindre un bouton voisin après un changement de vue. Un glissement, un changement d’écran ou un toucher commencé sur une commande désactivée n’active pas une autre action.

La grille utilise les dimensions natives réelles des créatures et des cadavres. Les cases qui recouvriraient leur corps ne sont pas dessinées, et les repères tactiques au sol sont retirés pendant les animations et l’autocombat. Les scénarios `battle-accessibility-e2e.mjs` vérifient les boutons, la navigation au clavier, les rotations et l’absence de pixels de grille sur un corps, sous Chrome et WebKit.

La reprise après changement d’onglet évite également une attente bloquante sur le verrou de l’interface : les événements SDL de focus/visibilité sont différés si un worker détient ce verrou, puis traités dans l’ordre, par lots de 64 au maximum par image. Les callbacks ne reprennent pas ce verrou une seconde fois sur Emscripten. Le comportement des autres plateformes reste inchangé.

Le test natif `browser-event-queue.test.mjs` reproduit le cas où un worker attend le navigateur en conservant le verrou. `background-resume-e2e.mjs` simule perte de visibilité, suspension et reprise dans une vraie partie, y compris sur le résultat de combat ; il vérifie les nouveaux états du moteur et le retour à la carte avec Valider, sans rechargement. Une validation physique Safari/iPhone reste nécessaire.


## Mémoire mobile et données lues à la demande

Les données installées restent sur OPFS. Au démarrage, le moteur récupère des
snapshots `File` des ressources de plus de 4 Kio, puis ne lit que les blocs demandés
par VCMI. Le cache LRU commun est limité à 16 Mio, avec des blocs de 64 Kio :
les archives LOD/SND et les images ne sont plus toutes recopiées dans MEMFS.
Les petits fichiers de 4 Kio ou moins restent chargés pour éviter de multiplier
les lectures synchrones de minuscules métadonnées (environ 3,5 Mio au total).
La lecture native étant synchrone, les défauts de cache lisent de petits fragments
Blob locaux par XHR synchrone ; aucune requête réseau n'est faite pendant ces
lectures. Les URL temporaires sont révoquées immédiatement. Les sauvegardes et
les réglages restent inscriptibles ; modifier une ressource matérialise uniquement
ce fichier, sans rendre le reste du catalogue résident. La troncature ne charge
pas l'ancien contenu. La vérification de l'installation et le fonctionnement hors
ligne restent assurés par OPFS.

La présentation tactile utilise une source fixe de 800 × 600 et une échelle native
1, sans textures HD ni suréchantillonnage xBRZ dans le moteur. L'interface HTML
reste adaptée à la densité de l'écran. L'espace initial WebAssembly passe de
512 à 256 Mio et peut toujours croître par pas de 32 Mio. Cette réservation
n'est pas une mesure de la mémoire physique résidente du navigateur.

Le moteur est `outputs/vcmi-wasm-goonk-mobile-memory-engine.tar.gz`.
`engine-build.json` identifie le WASM publié par son SHA-256 ; la version native
`vcmiWebMemoryVersion()` vaut 1 et est contrôlée au démarrage et par `verify:web`.
Le cache des images exportées libère désormais ses surfaces via `SDL_FreeSurface`.
Les imports des modules et du worker OPFS portent la version du moteur pour
éviter de mélanger un ancien worker en cache avec une nouvelle version du jeu.

Après `npm run prepare:web && npm run build:web && npm run verify:web`, le scénario
`work/browser-tests/mobile-memory-e2e.mjs` peut cibler une version locale ou publiée
avec `GAME_URL`. Il vérifie trois constructions normales sur trois jours, une ville entièrement bâtie,
sept achats réels, vingt cycles de recrutement, trois tailles d'écran et le
rechargement de la sauvegarde. Il produit les mesures mémoire, les tâches longues,
un profil CPU et une capture dans `GOONK_REPORT_DIR`. `GOONK_CPU_THROTTLE=4`
ralentit le thread navigateur via CDP pour compléter la simulation mobile.
Ces essais ne remplacent pas une mesure sur un téléphone physique.


### Version 0.4.24 — mobile towns, armies and spellbook

English is the default; Settings provides an English/French selector. Native game text applies on the next opening. The native engine archive for this version is `outputs/vcmi-wasm-goonk-0.4.24-engine.tar.gz`, including the OPFS memory improvements described above.

Town shortcuts span the screen: Build, Recruitment Hall, Mage Guild and Marketplace. Native animated creature previews fill recruitment and inspection views; original and modded army portraits use the native icon atlas as a fallback. Recruit All asks for confirmation and respects available resources and army slots. Landscape towns and the optional dual combat view use the available screen area; the whole battlefield remains the default.

Combat uses one confirmation action for movement, melee, ranged attacks and spell targets. Magic opens the native spellbook through accessible spell rows, five school filters and previous/next pages. The bridge retains native validation. Game date/week information, equipment, direct access to a single owned town, campaigns and vertical custom-map settings are available. Rotation cancels unfinished taps rather than redirecting them to newly positioned buttons. Saving avoids hero movement, and its notification lasts at most 250 ms unless saving fails. Returning to a live tab retains the running game.

Validation: `ninja -j32 html5`, `npm test` (272 passed, 16 optional host checks skipped), `npm run verify:web`. `work/browser-tests/mobile-upgrade-e2e.mjs` checks Chromium and WebKit layouts, direct spellbook access, portraits, bulk-recruit confirmation and language switching. `mobile-upgrade-native-e2e.mjs` runs the real engine: animated previews, recruitment, building-window cycles, a cast spell, a completed fight and tab resume. Configure `CHROME_PATH`, `WEBKIT_PATH`, `GOONK_TEST_ORIGIN` and optionally `GOONK_REPORT_DIR`; a local build must allow that test origin. `GOONK_WINDOW_CYCLES` defaults to 30. After warmup, the measured JS heap stabilized during 30 building/recruitment cycles, with a constant 288 MiB WASM buffer and stable canvas count. This is a bounded regression check, not a claim that every leak or frame stall is eliminated. A generated four-player/two-human map and the 21 original campaign entries/scenario selection were also checked. No complete campaign or physical iPhone test is claimed.


### Version 0.4.25 — rotation and touch targets

Pointer actions now require a completed press/release pair in the same viewport geometry. This includes Safari touch compatibility clicks with `detail=0`, which previously escaped the temporary suppression after rotation. Keyboard activation stays available. Menus, direct controls and combat controls reject gestures started before a viewport change, including a landscape/portrait round trip that restores the original button coordinates. Duplicate resize events do not cancel a new gesture. Canvas input uses the current displayed rectangle and accepts input only after that geometry has been painted.

Regression checks: `tests/touch-geometry.test.mjs`, `tests/mobile-press.test.mjs` and `work/browser-tests/rotation-targets-e2e.mjs`. The latter reproduces the old misdirected army activation, then checks physical button-center taps at 390×844, 844×390 and 568×320 under Chromium/WebKit. Use `CHROME_PATH`, `WEBKIT_PATH` and `GOONK_TEST_ORIGIN` as for the 0.4.24 browser checks. The WebAssembly binary remains the verified 0.4.24 engine.


### Version 0.4.26 — action feedback

The map's Castle centering action no longer starts a loader: it changes only the camera, not the game fields previously used as acknowledgements. Spellbook paging/filtering and zero-cost recruitment now acknowledge their loading controls through the actual page/school/army state. `tests/action-feedback.test.mjs` covers these cases.

A fresh native stress run performed three normal construction days, seven creature purchases, twenty recruitment-window cycles, rotation and saved-game recovery. It did not reproduce a spontaneous restart; WASM memory remained at 256 MiB, the asset cache at or below 16 MiB and ordinary VFS data below 4 MiB. This desktop-browser run does not establish the cause of a reported phone restart or rule out phone memory pressure.


### Version 0.4.27 — bounded menu opening and incremental map catalogue

The hidden native mobile selector seeds only the bundled Goonk maps. The mobile bridge publishes the remaining map headers in append-only batches of at most four per tick (or an 8 ms budget), keeping indices stable while more maps arrive. Desktop native selection retains its full list. Connection screens and native information/error dialogs are now represented explicitly instead of remaining behind the mobile home screen. Duplicate new/load/campaign requests are ignored while a join/lobby/dialog is already open.

A menu launch disables competing actions and shows progress. After 25 seconds without a successful opening, it stops the spinner and offers an explicit fresh-runtime retry, retaining saves and cached game files. It does not reload automatically. Session-recovery openings have the same bounded wait; campaign retries preserve their destination.

Validation: `ninja -j32 html5`, 286 unit checks passed, 16 optional host checks skipped, and `verify:web`. `work/browser-tests/menu-launch-e2e.mjs` covers stalled opening, duplicate requests, explicit retry and native-error presentation in Chromium/WebKit. `menu-launch-native-e2e.mjs` observes the real partial catalogue, stable IDs, a started game, saved-game loading and opening one of the 21 original campaigns. Initial options were available after roughly 0.4–0.5 s on the test Mac, with 4 of 357 maps catalogued; this is not a phone performance guarantee. Both scripts accept the browser/origin environment variables used by the other browser scenarios; the native scenario also accepts `GOONK_REPORT_DIR`. The engine archive is `outputs/vcmi-wasm-goonk-0.4.27-engine.tar.gz`.


### Version 0.4.34 — catalogue creature details no longer freeze the engine

The mobile bridge now excludes the synthetic stack owned by a catalogue preview from live-army refresh and paid-upgrade handling. Previously, refreshing such a preview could retain its temporary stack after the original window was destroyed, causing a WebAssembly out-of-bounds trap and leaving all native commands unresponsive. This was reproduced with the affected iPhone save; the X/Back touch targets themselves received the correct input. Real army stacks still support consecutive paid upgrades without closing the details window.

Validation: `ninja -j32 html5`, 293 unit checks passed (16 optional host checks skipped), and the native creature-close scenario, including catalogue windows held open across multiple state publications. A private copy of the affected save passed fifteen Vermin catalogue open/close cycles in Chromium. No user save is included in the repository. Physical iPhone validation is recorded separately after publication.

### Version 0.4.36 — evolution-family recruitment and legendary Goonks

The recruitment hall now keeps every form of a creature family on the same horizontal row. The family list scrolls vertically; the selected creature, its native animated preview, quantity controls and recruitment action remain in a separate panel below in portrait and to the right in landscape. Small portraits use transparent native silhouettes. Unbuilt forms stay visible with their required dwelling; forms share their family's stock. Recruitment waits for a stock/army acknowledgement and prevents duplicate purchases. The engine validates ownership, the dwelling, stock and garrison space; existing server checks still control resources and final purchases.

All seven Goonk families now have three forms, with seven additional native upgrade buildings, paid upgrades and English/French descriptions. Their final forms use new imperial, crystal, storm, toxic-armour, alchemical and archmage designs rather than palette swaps. Each final form has its own walk, attack, idle, hurt, death, map sprite and transparent icons. Animation construction isolates a single creature per frame and never crossfades two bodies; the anatomy specification is at most two arms and two feet. The 21 canonical poses were visually reviewed in `outputs/goonk-three-grades-contact-0.4.36.png`. Design sources/specifications are in `outputs/goonk-art/exalted-*.png` and `exalted-designs.json`; they were generated with the built-in Imagegen tool.

Validation: `ninja -j32 html5`; 305 unit checks passed, 16 optional host checks skipped; production `verify:web`. The real engine scenario `work/browser-tests/goonk-third-native-e2e.mjs` checks all seven base → royal → final paid chains with exact resource spending and no automatic close, then native gallery selection and final-form recruitment. `recruitment-families-e2e.mjs` checks Chromium/WebKit at portrait/landscape widths down to 320 pixels, including six-form modded families, pending purchases, locked dwellings and non-overlapping controls. The prior catalogue X/Back regression scenario remains part of native validation. An existing private save also loaded successfully after the content update; no private save is tracked. These bounded tests do not claim a complete campaign or a physical-iPhone validation of this new layout.

### Version 0.4.38 — nine original towns: final TUM evolutions

The original nine towns now connect their existing WoG level-eight troops to their final TUM evolutions. Their fourth dwellings use source prices, native building57 and the extracted building77 icons. Paid upgrades retain the creature-details window; recruitment uses the current evolution-family interface. The release preserves the published56 artifacts and28 object configurations, and the latest Goonk artwork.

Validation: `ninja -j32 html5`;377 Node tests passed,22 optional host checks skipped. All nine real WebAssembly town cases verify exact construction and upgrade spending, recruitment, catalogue safety, and save/reload of the final troop, count, resources and XP0. Their120 warning records are identical across cases and retained in `outputs/native-evidence/towns038/`; this is not a warning-free claim. An initial Rampart test-fixture prerequisite omission was corrected without changing production requirements. The separately recorded earned-XP regression now also covers upgrade/recruitment/save-load with nonzero XP and effective rank bonuses. This is a bounded stabilization release, not complete TUM ERA3.5 support.

### Earned stack XP persistence regression

Two real WebAssembly cases close the remaining nonzero-XP check, without changing gameplay code or production experience profiles. With normal source profiles, earned XP per creature is200, then150 after the paid upgrade and100 after recruiting one untrained creature;save/load preserves total XP300 and the live creature details. A separate fixture-only accelerated profile checks100→75→50XP and ranks10→8→6;health650,attack/defense51,damage81 and speed22 are identical after reloading. The25% upgrade loss and recruitment dilution are intentional source behavior.

Both cases have zero detected JS/native errors. `ninja -j32 html5` passed and the published WASM hash remained unchanged. See `outputs/native-evidence/earned-xp-persistence/report.json` and the reusable `work/browser-tests/tum-earned-xp-upgrade-e2e.md`. The test fixture handles legitimate morale extra actions and Castle-stables arrival messages. Evidence records its bounded scope and distinguishes the original executed harness from reporting/context-safety cleanup in the reusable one. This is not an assertion of complete ERA compatibility.


Les trois voies expérimentales ont été retirées des nouvelles parties. Leur prototype reste archivé ; seules les définitions nécessaires aux sauvegardes de la version 0.4.46 sont conservées. Voir [la note de retrait](HERO-PATHS.md).
