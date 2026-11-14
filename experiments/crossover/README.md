# Heroes III × StarCraft — laboratoire navigateur

Branche : `codex/heroes-starcraft-crossover`. Checkout indépendant : `/Users/sevenone./.codex/worktrees/heroes-starcraft/heroes-goonk`. Les modifications du jeu Heroes existant restent séparées de ce laboratoire.

Le lanceur propose Heroes normal, OpenBW indépendant et deux moteurs affichés ensemble. OpenBW est le véritable moteur C++ du port Web épinglé dans [UPSTREAM.json](./UPSTREAM.json), compilé en WebAssembly/WASI ; aucune simulation StarCraft simplifiée n’est utilisée. Le port conserve ses entrées clavier/souris/tactiles et son rendu canvas. Les bots et le multijoueur ne sont pas activés : cette étape expose un bac à sable solo.

**Vérification actuelle :** une vraie partie OpenBW et le monde Heroes ont été exécutés ensemble dans Chromium avec les archives locales de `work/game-data/starcraft-classic/`. L’aller-retour déclenche des commandes natives dans les deux moteurs. La production d’un SCV (50 minerais, file entièrement terminée), un déplacement, une perte réelle après attaque et une sauvegarde Heroes sont vérifiés. Le report de cette perte dans l’armée VCMI reste non implémenté. Voir les preuves dans `evidence/real-game.json`.

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

Le signal de préparation agit sur l’interface native VCMI ; **il n’applique pas de pertes à une armée**. Le recensement C++ expose les identités, types, propriétaires, PV et drapeaux de complétion réels, ainsi que la vue native. La passerelle suit les identités de la cohorte initiale : un recrutement supplémentaire ne masque pas une unité disparue. Cette absence n’est pas à elle seule un résultat de bataille — une transformation peut aussi retirer une identité. Le transfert d’armées, les mappings de créatures, la résolution de combats délégués, l’IA, la sauvegarde/reprise d’une simulation StarCraft, les Workers et WebRTC restent à développer. Les archives persistées ne sont pas une sauvegarde de partie ; un replay n’est pas une reprise d’état.

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
