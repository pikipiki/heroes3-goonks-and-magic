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
