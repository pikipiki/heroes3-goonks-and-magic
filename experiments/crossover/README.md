# Heroes III × StarCraft — laboratoire navigateur

Branche : `codex/heroes-starcraft-crossover`. Checkout indépendant : `/Users/sevenone./.codex/worktrees/heroes-starcraft/heroes-goonk`. Les modifications du jeu Heroes existant restent séparées de ce laboratoire.

Le site expérimental ouvre directement **Heroes Goonk**. Le bouton **Démo Heroes × StarCraft**, présent dans Heroes, lance une vraie bataille entre sept groupes de créatures finales Heroes et douze unités Terran, Zerg et Protoss, sur un champ de bataille Heroes unique. Aucun écran ni menu StarCraft n’est montré dans ce parcours.

## Jouer à la démo intégrée

1. Dans l’accueil Heroes, appuyer sur **Démo Heroes × StarCraft**. En partie, cette action se trouve dans **☰ → Démo Heroes × StarCraft**. La carte et l’attaque sont préparées automatiquement. Depuis une aventure en cours, le jeu attend d’abord sa sauvegarde dédiée **Avant-demo-StarCraft** ; celle-ci se recharge par le menu Heroes.
2. Attendre le téléchargement initial des données, puis appuyer sur **Commencer le combat** : seul le temps démarre, aucun ordre allié n’est envoyé.
3. Choisir une troupe dans le terrain ou sa carte, puis toucher le terrain pour la déplacer ou un ennemi pour l’attaquer. **Tout sélectionner** sélectionne les groupes alliés. **Attaquer** arme un ordre vers le prochain point choisi ; **Arrêter** annule les ordres et rend la sélection passive. Sans ordre, tes troupes restent immobiles et ne ripostent pas, même sous le feu ennemi. Les Marines ennemis conservent leur IA.
4. Confirmer le bilan Heroes pour poursuivre l’aventure avec les survivants. La sauvegarde après ce retour conserve les pertes.

La démo contient sept groupes de cinq créatures finales Heroes de factions différentes, face à douze unités StarCraft : deux Marines, Firebats, Zerglings, Hydralisks, Zealots et Dragoons, avec leurs améliorations maximales. Les troupes Heroes restent des troupes Heroes ; les Marines ont une véritable définition `heroes-starcraft:marine` dans le catalogue VCMI. Ils ne sont pas des gardes renommés. Chaque type possède ses propres animations originales de déplacement, attaque et mort, ainsi que son son d’attaque, extraits du rendu natif OpenBW. Ces animations fonctionnent aussi dans le combat classique. Les animations et le décor Heroes sont fournis par VCMI.

Le bouton **▶ Temps réel** est disponible pendant ton tour dans les vues de combat classique et verticale. Il délègue la bataille en cours en conservant les pertes, blessures, effets et mana. Le temps démarre immédiatement ; tes troupes attendent toujours tes ordres. Cette option concerne les combats solo de terrain, côté attaquant, avec au plus 32 groupes et 128 combattants par camp.

**Tous les sorts** ouvre le même composant de livre que le combat classique : écoles, pages, icônes et descriptions, sélection puis confirmation de cible. Un sélecteur ajoute les capacités de créatures. Le combat reste en pause pendant ce choix ; les cinq raccourcis restent disponibles.

« ↩ Classique » continue le même combat au tour par tour dans VCMI. Les six types StarCraft, les effectifs, blessures, morts, invocations, mana et effets de sorts sont conservés. Le bouton « Temps réel » reprend ces mêmes groupes avec leurs nouvelles blessures classiques. Les attaques, déplacements, ripostes et tirs classiques suivent les règles Heroes III ; le combat attend les actions du joueur à son tour. Les sauvegardes restent locales. Les sauvegardes de la version précédente peuvent exiger son ancien catalogue de mods ; elles ne sont pas supprimées.

L’accueil n’a plus de panneau flottant : la démo et les options appartiennent au même menu. Le combat utilise le terrain sur toute la largeur et les commandes en dessous en portrait ; en paysage, titre/retour restent à droite et les commandes défilent verticalement. Les cartes d’armée offrent une sélection tactile et leurs effectifs suivent le recensement réel. En portrait, le terrain est projeté verticalement et les sprites restent debout, avec un gabarit comparable de 88 unités logiques sur leur plus grande dimension, sans déformer leurs proportions. Le rendu Retina conserve davantage de détails Heroes ; les sprites StarCraft passent par un agrandissement Scale2x en deux passes et un lissage navigateur. Le décor redimensionné est mis en cache ; la définition du canevas suit sa taille visible et réduit le suréchantillonnage si la cadence baisse, sans réduire la taille des unités. Les transitions d’images et déplacements sont présentés à 50 images/s. Les sprites restent les originaux basse résolution, sans détails HD inventés.

Les deux jeux indépendants et l’ancien laboratoire restent accessibles sous `laboratoire.html`. Voir [VALIDATION.md](./VALIDATION.md) pour les vérifications réellement exécutées.

## Essayer le bundle déjà construit

Depuis la racine du checkout indépendant :

```sh
PORT=8778 node work/browser-tests/static-server.mjs
```

Ouvrir http://127.0.0.1:8778/crossover/index.html. « Jouer à StarCraft » ouvre son moteur indépendant. « Lancer les deux moteurs » ouvre VCMI et OpenBW dans deux iframes de même origine. Dans StarCraft, les trois MPQ fournis directement par Blizzard se téléchargent automatiquement depuis ce site, avec contrôle SHA-256, puis restent dans IndexedDB sans upload. Aucune sélection de fichier n’est nécessaire sur téléphone. Les anciens caches StarCraft sont supprimés. La carte Weave, CC BY 4.0, est fournie ; une carte locale peut aussi être choisie.

La validation d’import vérifie les noms, bornes des en-têtes MPQ et empreintes SHA-256 du stockage. Le moteur vérifie ensuite le contenu dont il a besoin : un en-tête valide ne prouve pas que toutes les ressources StarCraft sont présentes. Si le stockage est indisponible ou plein, l’interface affiche l’erreur. Un import rejeté préserve les archives précédentes ; une archive altérée est bloquée jusqu’à sa réimportation.

Pour l’aperçu avec les sources Heroes courantes : lancer `npm start`, puis `node experiments/crossover/server.mjs` dans un autre terminal et ouvrir http://127.0.0.1:8774/crossover/. `HEROES_ORIGIN` change le serveur Heroes cible et `PORT` le port du laboratoire.

## Compiler le Web et tester

Node 22, npm et le Chromium Playwright utilisé par le dépôt :

```sh
npm ci --prefix experiments/crossover
npm run build --prefix experiments/crossover
npm test --prefix experiments/crossover
npm ci --prefix work/browser-tests
```

Le JavaScript généré et le WASM sont versionnés pour servir le prototype immédiatement. TypeScript 5.9.3 et les sources natives sont épinglés. `scripts/generate-host.mjs` adapte le port original conservé dans `vendor/openbw/` : import local, carte locale, interface native explicite, suppression des téléchargements distants et désactivation des contrôles de diagnostic du port.

## Recompiler le véritable moteur OpenBW

Extraire le [SDK WASI 33.0 officiel](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-33), puis :

```sh
WASI_SDK=/chemin/wasi-sdk-33.0-arm64-macos npm run build:engine --prefix experiments/crossover
```

Sur Linux, utiliser l’archive SDK pour son architecture et adapter le chemin. Le script vérifie la version exacte du compilateur et l’empreinte des sources, compile avec C++17 le wrapper `native/openbw-crossover.cpp` (qui inclut l’entrée amont inchangée) et le backend original, produit `public/starcraft/openbw.wasm` et enregistre l’ABI et le SHA-256 dans `engine-build.json`. C++17 correspond aux constructions déjà utilisées par le port. Ce module utilise WASI, pas Emscripten ; VCMI conserve son build Emscripten existant. Deux compilations locales ont produit le même WASM ; la reproduction entre systèmes n’est pas encore vérifiée.

## Construire le site statique expérimental

```sh
npm run prepare:web
GOONK_TEST_ORIGIN=http://127.0.0.1:8778 npm run build:web
npm run verify:web
node experiments/crossover/package.mjs
```

L’origine de test autorise le chargement du moteur Heroes dans cet aperçu local sans contourner CSP. Pour un build de production sur les origines habituelles, omettre `GOONK_TEST_ORIGIN`. Le packaging ajoute `dist/crossover/` et une politique CSP dédiée aux modules/WASM de ce chemin. Les entrées normales du jeu sont conservées. Le lanceur et StarCraft n’entrent pas dans le cache hors ligne préexistant ; la reprise hors ligne complète n’est pas validée.

Avec le serveur statique sur 8778 :

```sh
CROSSOVER_URL=http://127.0.0.1:8778/crossover/index.html node experiments/crossover/tests/browser.mjs
node experiments/crossover/tests/starcraft-browser.mjs
```

Le premier test utilise VCMI réel et charge également l’interface StarCraft. Le scénario complet ci-dessous utilise les deux simulations actives. Le second teste IndexedDB avec des en-têtes d’archives synthétiques explicitement limités aux tests d’import ; il ne lance jamais une simulation avec ces fixtures. Les tests sont silencieux grâce au helper du dépôt. Pour tester une vraie partie et les échanges :

```sh
STARCRAFT_DATA_DIR=work/game-data/starcraft-classic node experiments/crossover/tests/real-game-browser.mjs
```

Ce dernier exige les vrais fichiers et ne les remplace jamais. Il vérifie les frames natives, l’événement réel VCMI vers le journal C++ OpenBW et le retour d’état, une transition native VCMI vers le lobby, la production d’un SCV via les commandes du jeu et la sérialisation native d’un replay. **Exécuté avec succès avec les trois MPQ Blizzard téléchargés automatiquement.** Il attend réellement la fin de l’entraînement, vérifie le drapeau natif de complétion et teste aussi une attaque forcée sur une unité du même camp, sans injection de PV. Ses lectures de contrôle restent dans le contexte de test, sans poignée de diagnostic dans le produit.

## Contrat et limites

`HeroesObserver` écoute `goonk-state`. `StarCraftObserver` écoute `openbw-state`, lit les frames/empreintes/résultats natifs et appelle une interface explicite qui écrit les transitions de mode Heroes dans le journal C++ OpenBW via `openbw_post_message`. OpenBW renvoie son état au bridge. Une fois StarCraft démarré et Heroes au menu, « Préparer Heroes depuis StarCraft » transmet cet état à l’adaptateur Heroes, qui appelle la commande C++ existante d’ouverture du lobby ; un nouvel événement natif confirme l’application. Aucune modification des règles n’est nécessaire pour cet aller-retour. Les répétitions de modes sont dédupliquées ; les sessions incohérentes et séquences périmées sont rejetées. Aucun objet interne C++ n’est partagé.

Le mode d’observation indépendant conserve son signal de préparation et son suivi de cohorte. Le mode aventure utilise une API native distincte : le serveur VCMI suspend la bataille, conserve les armées initiales, vérifie l’identité du combat et chaque quantité de survivants, puis applique le résultat une seule fois par son traitement normal de fin de bataille. Les résultats incomplets, effectifs augmentés, doublons et identifiants inconnus sont refusés.

Pour le temps réel, OpenBW reçoit des définitions privées par troupe Heroes : PV VCMI exacts, dégâts moyens de l’intervalle VCMI, armure égale à défense/4 (division entière), délai d’attaque borné entre 12 et 48 frames selon 160/vitesse. Ses types StarCraft originaux restent inchangés. Le moteur réutilise les comportements de déplacement/tir/mêlée StarCraft ; cette adaptation n’est pas une conservation exacte des règles de combat au tour par tour. Les sorts, morale/chance, bonus conditionnels, munitions Heroes et améliorations ne sont pas transposés. L’équilibrage reste expérimental. L’adversaire reçoit des ordres AttackMove natifs périodiques, sans IA économique avancée.

Les unités sont agrandies individuellement, avec un cadrage initial resserré et stable. Les silhouettes Heroes sont dessinées plus grandes ; chaque sprite StarCraft est exporté isolément avant agrandissement pour ne pas copier ses voisins. Les barres de vie sont plus épaisses, les contours de sélection plus visibles et les zones tactiles suivent les corps agrandis. Les commandes compensent le cadrage avant d’être transmises au moteur ; les positions de simulation restent inchangées.

Le compositeur `shared-field.ts` affiche les positions et PV natifs, les animations DEF Heroes et une couche transparente de sprites OpenBW. Il ne calcule aucun dégât ni résultat. Les commandes de sélection/déplacement/attaque passent dans le flux de commandes C++ existant. Une iframe technique invisible héberge OpenBW ; seule la vue de combat Heroes est présentée au joueur.

Ce prototype accepte au plus 32 groupes et 128 unités par camp, avec un seul joueur humain attaquant un adversaire non humain. Les sièges, invocations et batailles incompatibles conservent le combat Heroes. La reprise d’une bataille RTS interrompue et son replay ne sont pas pris en charge : reprendre Heroes ou recharger une sauvegarde antérieure. Les Workers, WebRTC et une validation physique sur iPhone/iPad restent à réaliser.

La licence générale d’OpenBW reste non spécifiée. Le développement continue sur l’hypothèse demandée explicitement par le propriétaire ; aucune licence amont n’est déclarée acquise. Provenance, sources originales et attribution de la carte sont conservées.

Voir [AUDIT.md](./AUDIT.md) et [VALIDATION.md](./VALIDATION.md).

## Projet Netlify séparé

Le code reste dans ce dépôt sur `codex/heroes-starcraft-crossover`. La publication GitHub Pages séparée est gérée par [pikipiki/heroes-starcraft](https://github.com/pikipiki/heroes-starcraft) : son fichier `source-ref` fixe le commit vérifié à construire. Le jeu est accessible sur https://pikipiki.github.io/heroes-starcraft/battle.html. La branche `main` et le déploiement du jeu classique restent indépendants.
Pour préparer le même dossier de publication localement, après les builds ci-dessus :

```sh
node experiments/crossover/scripts/build-standalone.mjs
```

Le téléchargement initial StarCraft représente environ 86 Mio ; les fichiers sont déjà versionnés par morceaux dans `game-data/starcraft/`. Pour les renouveler depuis un dossier de MPQ scannés accompagné de `provenance.json`, utiliser `STARCRAFT_DATA_DIR=... node experiments/crossover/scripts/package-data.mjs`, puis reconstruire l’hôte et retester une vraie partie. Les ZIP/CD de travail ne sont jamais publiés.

Voir [SECURITY-REVIEW.md](./SECURITY-REVIEW.md) pour les sources, analyses antivirus et limites. Les scans négatifs ne constituent pas une garantie absolue.

## Construire le moteur Heroes expérimental

Après compilation des sources VCMI avec `ninja -j32 html5`, utiliser l’archive expérimentale lors de la préparation du site ; le moteur classique reste le défaut :

```sh
GOONK_ENGINE_ARCHIVE=outputs/vcmi-wasm-heroes-starcraft-engine.tar.gz npm run prepare:web
GOONK_CROSSOVER=1 GOONK_TEST_ORIGIN=http://127.0.0.1:8779 npm run build:web
npm run verify:web
npm run build --prefix experiments/crossover
node experiments/crossover/package.mjs
node experiments/crossover/scripts/build-standalone.mjs
```

Les tests `tests/rts-battle-browser.mjs` et `tests/heroes-rts-browser.mjs` utilisent respectivement le serveur de test sur 8778 et le bundle séparé sur 8779.

## Livre de sorts et commandes tactiles

La démo oppose sept cohortes de cinq créatures finales de factions différentes à douze unités StarCraft (Marine, Firebat, Zergling, Hydralisk, Zealot, Dragoon), avec les améliorations maximales. Le héros dispose du livre de combat complet ; les capacités des créatures utilisent également le moteur VCMI natif.

Avant de commencer, « Préparer 5 sorts » permet d’affecter les cinq raccourcis au héros ou aux créatures. La préparation ne dépense pas de mana et ne démarre pas la simulation. Les préférences sont mémorisées localement par identité de créature. Pendant le combat, les touches 1–5 ou les boutons ouvrent directement le ciblage en pause. Le livre complet reste accessible.

Les boutons utilisent les icônes originales Heroes dans une grille de commandes RTS : cinq raccourcis en bas en portrait, carte 3 × 3 à droite en paysage. Le panneau reste défilable verticalement. Les sorts, invocations, soins, résurrections, obstacles, effets temporaires et animations sont évalués par les règles natives ; les boucliers Protoss absorbent les dégâts avant les points de vie.

Validation navigateur sur le bundle séparé : `node experiments/crossover/tests/universal-magic-browser.mjs` (Chromium et WebKit). Ce test emploie de vrais sorts pour provoquer blessures, morts, résurrection et invocation ; aucun point de vie artificiel n’est injecté. `tests/render-fps-browser.mjs` mesure séparément le rendu à 50 fps.

Les mêmes cinq choix sont disponibles dans les combats natifs Heroes, en « Classic view » et « Vertical view », y compris après « Classique » dans la démo crossover. La préparation se fait avant une action de ton équipe ; elle ne dépense pas de mana et ne passe pas le tour. Les capacités de créatures attendent le tour du lanceur réel. Les raccourcis appellent directement le ciblage natif : coûts, charges, immunités et limite de sorts par round restent contrôlés par VCMI. Le sélecteur défile sur mobile et change de disposition en paysage.

`tests/native-shortcuts-browser.mjs` vérifie les deux vues et orientations sur Chromium et WebKit avec de vrais sorts, blessures et résurrection, sans changer artificiellement les points de vie.

## Continuité entre les modes

Les deux modes partagent une santé de groupe compatible Heroes : plusieurs membres complets et un membre blessé. Le transfert conserve la santé totale et regroupe les blessures distribuées selon cette règle. Pour les Protoss, cette santé inclut les boucliers (Zealot : 160 ; Dragoon : 180) ; en temps réel, les boucliers absorbent les dégâts avant les PV. Les sorts et créatures invoquées passent par les objets natifs VCMI, et non une reconstruction de leurs noms.

`node scripts/export-classic-art.mjs` (depuis ce dossier) régénère les sprites classiques à partir du moteur et des archives locales vérifiées. Il nécessite Playwright et Python avec Pillow. Les PNG indexés réservent les couleurs de transparence, ombres et sélection attendues par VCMI.
