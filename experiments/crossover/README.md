# Heroes III × StarCraft — laboratoire navigateur

Branche : `codex/heroes-starcraft-crossover`. Checkout indépendant : `/Users/sevenone./.codex/worktrees/heroes-starcraft/heroes-goonk`. Les modifications du jeu Heroes existant restent séparées de ce laboratoire.

Le site expérimental ouvre directement **Heroes Goonk**. Le bouton **Démo : Heroes × StarCraft**, présent dans Heroes, lance une vraie bataille entre archers/piquiers Heroes et Marines StarCraft, sur un champ de bataille Heroes unique. Aucun écran ni menu StarCraft n’est montré dans ce parcours.

## Jouer à la démo intégrée

1. Dans Heroes, appuyer sur **Démo : Heroes × StarCraft**. La carte et l’attaque sont préparées automatiquement. Depuis une aventure en cours, le jeu attend d’abord sa sauvegarde dédiée **Avant-demo-StarCraft** ; celle-ci se recharge par le menu Heroes.
2. Attendre le téléchargement initial des données, puis appuyer sur **Commencer le combat**.
3. Toucher une troupe pour sélectionner son groupe, puis le terrain pour le déplacer ou un ennemi pour attaquer. **Toute l’armée** sélectionne toutes les troupes ; **Attaquer avec l’armée** donne un ordre d’attaque général.
4. Confirmer le bilan Heroes pour poursuivre l’aventure avec les survivants. La sauvegarde après ce retour conserve les pertes.

La démo contient 12 archers, 6 piquiers et le commandant Heroes, face à 3 Marines. Les troupes Heroes restent des troupes Heroes ; les Marines ont une véritable définition `heroes-starcraft:marine` dans le catalogue VCMI. Ils ne sont pas des gardes renommés. Le sprite de catalogue est extrait du rendu natif OpenBW ; le combat utilise ses sprites animés natifs. Les animations et le décor Heroes sont fournis par VCMI.

« Reprendre le combat classique » annule la délégation et reprend la bataille VCMI avec les effectifs initiaux. Les sauvegardes restent locales. Les sauvegardes de la version précédente peuvent exiger son ancien catalogue de mods ; elles ne sont pas supprimées.

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

Le compositeur `shared-field.ts` affiche les positions et PV natifs, les animations DEF Heroes et une couche transparente de sprites OpenBW. Il ne calcule aucun dégât ni résultat. Les commandes de sélection/déplacement/attaque passent dans le flux de commandes C++ existant. Une iframe technique invisible héberge OpenBW ; seule la vue de combat Heroes est présentée au joueur.

Ce prototype accepte au plus 32 groupes et 128 unités par camp, avec un seul joueur humain attaquant un adversaire non humain. Les sièges, invocations et batailles incompatibles conservent le combat Heroes. La reprise d’une bataille RTS interrompue et son replay ne sont pas pris en charge : reprendre Heroes ou recharger une sauvegarde antérieure. Les Workers, WebRTC et une validation physique sur iPhone/iPad restent à réaliser.

La licence générale d’OpenBW reste non spécifiée. Le développement continue sur l’hypothèse demandée explicitement par le propriétaire ; aucune licence amont n’est déclarée acquise. Provenance, sources originales et attribution de la carte sont conservées.

Voir [AUDIT.md](./AUDIT.md) et [VALIDATION.md](./VALIDATION.md).

## Projet Netlify séparé

Le code reste dans ce dépôt sur `codex/heroes-starcraft-crossover`. Le projet Netlify `heroes-starcraft` est créé mais doit encore être connecté et déployé. Choisir ce dépôt GitHub et cette branche comme **production branch** du nouveau projet ; la configuration de branche de `netlify.toml` construit le crossover dans `dist-heroes-starcraft`. Le projet Heroes Goonk existant et la branche `main` ne sont pas modifiés. Ne pas créer un deuxième projet si `heroes-starcraft` est utilisé.

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
