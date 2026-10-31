# Heroes Goonk

Heroes III dans le navigateur, avec le château Goonk, ses sept familles de peluches et leurs évolutions. Version 0.3.2, moteur VCMI 1.7.3 / Emscripten 4.0.23. Sources et provenance : `UPSTREAM.json` et `WOG-UPSTREAM.json`.

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

Après un clonage : `npm ci --prefix work/browser-tests`, puis `npm run prepare:web`. Le moteur web précompilé est inclus dans `outputs/vcmi-wasm-goonk-0.3.2-engine.tar.gz`.
Les données originales Heroes III restent exclues de Git. Pour le serveur local, les installer dans `work/game-data/homm3eng/home/web_user/.local/share/vcmi/`.

`npm run build:web` prépare `dist/` pour Netlify ; `node scripts/verify-site.mjs` vérifie les liens du moteur et l’exclusion des données originales. La configuration `netlify.toml` lance la préparation automatiquement. `node work/browser-tests/static-server.mjs` permet d’essayer ce dossier public sur le port 8767. Aucun déploiement en ligne n’a été effectué.

Le site public distribue le moteur, les mods Goonk/WoG et la carte Goonk. Au premier lancement, chaque joueur importe ses fichiers Heroes III depuis son appareil, sans les envoyer au serveur. Le choix de fichiers fonctionne aussi sans sélection de dossier sur téléphone. Les fichiers sont conservés dans le stockage privé du navigateur (OPFS) ; vider ce stockage impose une nouvelle importation.

Les données téléchargées portent une empreinte de contenu et sont vérifiées par morceaux de 4 Mo. Un redémarrage réutilise les fichiers inchangés ; une mise à jour télécharge les fichiers modifiés seulement. Les sauvegardes sont préservées. Le moteur compilé constitue toutefois un fichier unique : sa modification entraîne son rechargement. Ce mécanisme ne garantit pas un démarrage entièrement hors connexion : la page et le catalogue restent nécessaires.

## Publier sur Netlify ou GitHub Pages

`npm run package:web` prépare le dossier `dist/` et l’archive `outputs/heroes-goonk-netlify-pages.zip`. Elle contient le moteur, les mods et la carte Goonk ; les données originales Heroes III sont toujours importées localement par chaque joueur.

**Netlify, dépôt manuel** : décompresser l’archive ZIP, puis déposer le dossier obtenu (ou `dist/`) sur https://app.netlify.com/drop. Déposer le site compilé, pas le dossier de sources. Le fichier `_headers` inclus active les fonctions nécessaires au moteur. Pour les mises à jour, déposer le nouveau dossier compilé dans les déploiements du même site. Le site représente environ 200 Mo : la connexion GitHub ci-dessous est préférable pour un envoi fiable ; Netlify recommande plutôt Git ou son outil en ligne de commande pour les gros sites. Aucun fichier individuel ne dépasse 10 Mo.

**Netlify, depuis GitHub** : importer le dépôt dans Netlify. `netlify.toml` définit déjà la commande de compilation et `dist/` comme dossier à publier. Les prochains commits envoyés à la branche connectée déclenchent un nouveau déploiement.

**GitHub Pages** : envoyer ce dépôt dans un dépôt GitHub, puis ouvrir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Dans **Actions**, sélectionner **Publish Heroes Goonk to GitHub Pages**, puis **Run workflow** sur `main`. Les prochains envois sur `main` déclenchent ensuite la publication automatiquement. Le workflow `.github/workflows/pages.yml` compile le site et publie uniquement `dist/` ; aucune clé secrète personnelle n’est nécessaire. GitHub peut demander une validation du déploiement selon les réglages de ton dépôt.

La même archive fonctionne à la racine d’un domaine et dans un chemin de projet, comme `https://ton-compte.github.io/heroes-goonk/`. Les liens sont relatifs. Sur GitHub Pages, le premier accès prépare un service worker limité au dossier du jeu, puis relance la page pour activer les threads WebAssembly. Sur Netlify, les en-têtes du serveur activent directement ces fonctions. Utiliser l’adresse HTTPS publiée. Si le navigateur bloque les service workers sur GitHub Pages, un message et un bouton Réessayer apparaissent.

L’archive ne transforme pas le jeu en application hors ligne. Le service worker ajoute les en-têtes nécessaires ; il ne met pas toutes les ressources en cache. Les données et sauvegardes importées restent liées au domaine utilisé : passer de Netlify à GitHub Pages nécessite une nouvelle importation sur ce nouveau domaine.

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

Il reste à valider sur des téléphones physiques, notamment Safari/iPhone : mémoire WebAssembly, stockage disponible, import de gros fichiers et gestes multitactiles réels. Une campagne entière n’a pas été terminée. Le décor de siège conserve encore celui du Château classique. Les anciennes sauvegardes gardent les bâtiments déjà construits ; commencer une nouvelle partie pour retrouver la progression de construction.

## Réduction des blocages intermittents (0.3.2)

Les notifications du moteur vers l’interface sont désormais asynchrones, avec une seule notification en attente et une détection des changements. La musique et les effets ne sont plus remis à zéro à répétition lorsque le son est coupé. Les sauvegardes locales sont synchronisées en file, avec regroupement des rafales ; le moteur ne recopie plus chaque sauvegarde entière pour un service cloud inutilisé et n’attend plus les traitements du navigateur sous son verrou d’interface.

Ces changements suppriment des sources de blocage identifiées dans le code. Le gel aléatoire de plusieurs secondes rapporté par le joueur n’a pas été reproduit à l’arrêt pendant les essais locaux ; cela ne prouve pas que toutes ses causes ont été éliminées. Les rapports de mesure sont dans `outputs/freeze-profile-*.json`.
