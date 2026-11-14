# Heroes III × StarCraft — laboratoire navigateur

Branche : `codex/heroes-starcraft-crossover`. Checkout indépendant : `/Users/sevenone./.codex/worktrees/heroes-starcraft/heroes-goonk`. Les modifications du jeu Heroes existant restent séparées de ce laboratoire.

Le lanceur propose Heroes normal, OpenBW indépendant et deux moteurs affichés ensemble. OpenBW est le véritable moteur C++ du port Web épinglé dans [UPSTREAM.json](./UPSTREAM.json), compilé en WebAssembly/WASI ; aucune simulation StarCraft simplifiée n’est utilisée. Le port conserve ses entrées clavier/souris/tactiles et son rendu canvas. Les bots et le multijoueur ne sont pas activés : cette étape expose un bac à sable solo.

**Vérification actuelle :** le module OpenBW compile, s’instancie et expose son ABI native. Chromium valide son interface et l’import local persistant. VCMI démarre et exécute une commande native avec les deux interfaces chargées. Aucune partie StarCraft n’a encore été exécutée ici : les trois MPQ sont absents du projet. Le scénario automatisé avec une vraie partie est prêt à être lancé avec ces archives.

## Essayer le bundle déjà construit

Depuis la racine du checkout indépendant :

```sh
PORT=8778 node work/browser-tests/static-server.mjs
```

Ouvrir http://127.0.0.1:8778/crossover/index.html. « Jouer à StarCraft » ouvre son moteur indépendant. « Lancer les deux moteurs » ouvre VCMI et OpenBW dans deux iframes de même origine. Dans StarCraft, importer `StarDat.mpq`, `BrooDat.mpq`, `Patch_rt.mpq`, puis lancer la partie. Les trois fichiers restent dans IndexedDB, sans upload et sans téléchargement de données propriétaires. Ils sont réutilisés après rechargement. La carte Weave, CC BY 4.0, est fournie ; une carte locale peut aussi être choisie.

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

Sur Linux, utiliser l’archive SDK pour son architecture et adapter le chemin. Le script vérifie la version exacte du compilateur et l’empreinte des sources, compile les deux unités C++ avec C++17, produit `public/starcraft/openbw.wasm` et enregistre l’ABI et le SHA-256 dans `engine-build.json`. C++17 correspond aux constructions déjà utilisées par le port. Ce module utilise WASI, pas Emscripten ; VCMI conserve son build Emscripten existant. Deux compilations locales ont produit le même WASM ; la reproduction entre systèmes n’est pas encore vérifiée.

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

Le premier test utilise VCMI réel et charge également l’interface StarCraft. Le second teste IndexedDB avec des en-têtes d’archives synthétiques explicitement limités aux tests d’import ; il ne lance jamais une simulation avec ces fixtures. Les tests sont silencieux grâce au helper du dépôt. Pour tester une vraie partie et les échanges :

```sh
STARCRAFT_DATA_DIR=/chemin/mes-archives node experiments/crossover/tests/real-game-browser.mjs
```

Ce dernier exige les vrais fichiers et ne les remplace jamais. Il vérifie les frames natives, l’événement réel VCMI vers le journal C++ OpenBW et le retour d’état, une transition native VCMI vers le lobby, la production d’un SCV via les commandes du jeu et la sérialisation native d’un replay. **Préparé, mais non exécuté faute de MPQ.** Ses lectures de contrôle restent dans le contexte de test, sans poignée de diagnostic dans le produit.

## Contrat et limites

`HeroesObserver` écoute `goonk-state`. `StarCraftObserver` écoute `openbw-state`, lit les frames/empreintes/résultats natifs et appelle une interface explicite qui écrit les transitions de mode Heroes dans le journal C++ OpenBW via `openbw_post_message`. OpenBW renvoie son état au bridge. Les répétitions de modes sont dédupliquées ; les sessions incohérentes et séquences périmées sont rejetées. Aucun objet interne C++ n’est partagé.

Ce retour d’état est consulté par la passerelle Web ; **il n’applique pas de résultat à VCMI**. Le transfert d’armées, les mappings de créatures, la résolution de combats délégués, l’IA, la sauvegarde/reprise d’une simulation StarCraft, les Workers et WebRTC restent à développer. Les archives persistées ne sont pas une sauvegarde de partie ; un replay n’est pas une reprise d’état.

La licence générale d’OpenBW reste non spécifiée. Le développement continue sur l’hypothèse demandée explicitement par le propriétaire ; aucune licence amont n’est déclarée acquise. Provenance, sources originales et attribution de la carte sont conservées.

Voir [AUDIT.md](./AUDIT.md) et [VALIDATION.md](./VALIDATION.md).
