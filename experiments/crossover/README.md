# Heroes III × StarCraft — première étape

Branche de test : `codex/heroes-starcraft-crossover`. Tout le nouveau code est isolé ici ; l’entrée publique Heroes et ses sources moteur restent inchangées par ce lot. Le checkout indépendant est `/Users/sevenone./.codex/worktrees/heroes-starcraft/heroes-goonk`. La première tentative a échoué faute d’espace ; après libération externe du disque, le prototype a été déplacé dans ce checkout propre. Le checkout d’origine a retrouvé `main` avec les changements préexistants et leur index préservés.

Le lanceur propose Heroes, StarCraft indisponible et un observateur Crossover. L’observateur charge le véritable Heroes Goonk dans une iframe de même origine et écoute `goonk-state`, émis par `MobileBridge.cpp`. Il ne transmet ni ordre de bataille ni résultat à VCMI. Aucun moteur StarCraft, fichier MPQ ou code OpenBW n’est embarqué. **Ce lot n’est pas encore un crossover jouable.**

## Essayer

Depuis la racine de Heroes Goonk, après les prérequis habituels de son README :

```sh
npm start
```

Dans un second terminal, toujours à la racine :

```sh
node experiments/crossover/server.mjs
```

Ouvrir http://127.0.0.1:8774/crossover/. Le lien Heroes ouvre le jeu normal ; « Observer Heroes » ouvre le mode tactile existant, avec les événements natifs en lecture seule. « Arrêter » détruit cette instance ; enregistrer normalement sa partie dans Heroes avant de l’arrêter. Les erreurs de connexion Heroes donnent une réponse HTTP 503 explicite. `HEROES_ORIGIN` et `PORT` permettent de changer les ports du proxy et de l’aperçu.

## Compiler et tester

Node 22, npm et Chromium Playwright déjà utilisé par le dépôt :

```sh
npm ci --prefix experiments/crossover
npm run build --prefix experiments/crossover
npm test --prefix experiments/crossover
npm ci --prefix work/browser-tests
node experiments/crossover/tests/browser.mjs
```

Les fichiers JavaScript générés sont versionnés pour pouvoir servir le lanceur immédiatement sans compilateur. TypeScript 5.9.3 est épinglé dans le lockfile. Les tests de contrat utilisent des objets de test explicitement identifiés ; le test Chromium attend un vrai événement du moteur et ne l’injecte jamais. Les tests navigateur sont silencieux grâce au helper du dépôt. Le contrôle natif utilise le repli de stockage temporaire existant, comme les autres tests moteur ; il ne vérifie pas la persistance OPFS. Preuves locales : `/private/tmp/heroes-crossover-isolated-review/`.

## Construire le site statique expérimental

```sh
npm run prepare:web
npm run build:web
npm run verify:web
node experiments/crossover/package.mjs
```

Le dernier script ajoute `dist/crossover/index.html` et une politique CSP dédiée dans `_headers` pour autoriser ses modules ; le site principal garde ses entrées habituelles. Accéder à `/crossover/index.html` (ou `/heroes3-goonks-and-magic/crossover/index.html` sur Pages). Tous les chemins du lanceur sont relatifs. Le lanceur ne fait pas partie du cache hors ligne existant : son usage hors ligne n’est pas revendiqué. Le script de préparation normal peut redistribuer les données Heroes déjà présentes dans le dépôt ; ce lot ne certifie pas leurs droits de distribution.

## Contrat actuel et limites

`src/bridge.ts` définit des adaptateurs indépendants de VCMI/OpenBW et des enveloppes versionnées avec session, identifiant de requête, source, destination et réponse corrélée. Seul `engine.status` est accepté. Un résultat `unavailable` décrit honnêtement l’absence de StarCraft. Une session périmée, un destinataire inconnu ou une commande de bataille sont rejetés. Les instantanés sortants sont copiés ; la désinscription retire les listeners et oublie l’état précédent.

L’observation est volatile et ne remplace pas les sauvegardes du moteur. Une nouvelle iframe/recharge exige de nouveaux événements natifs. Le contrat bidirectionnel est testé en mémoire, pas entre deux simulations. Pas de pause native, transfert d’armée, mapping de créatures, application de pertes, Worker, sauvegarde de session crossover ou WebRTC dans ce lot. Le statut « observé » signale le dernier événement reçu ; il ne certifie pas que la simulation continue à progresser.

Voir [AUDIT.md](./AUDIT.md) pour la faisabilité, les licences et les étapes suivantes, et [VALIDATION.md](./VALIDATION.md) pour les résultats réellement exécutés.

Pour tester le bundle en local, construire avec `GOONK_TEST_ORIGIN=http://127.0.0.1:8778 npm run build:web`, puis refaire le packaging. Servir avec `PORT=8778 node work/browser-tests/static-server.mjs` et lancer `CROSSOVER_URL=http://127.0.0.1:8778/crossover/index.html node experiments/crossover/tests/browser.mjs`. Les origines de scripts des builds de production sont restreintes par le projet ; ne pas désactiver CSP pour ces tests. `CROSSOVER_LAUNCHER_ONLY=1` limite le test au lanceur statique.
