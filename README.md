# Heroes Goonk

Heroes III dans le navigateur, avec le château Goonk, ses sept familles de peluches et leurs évolutions. Version 0.3.0, moteur VCMI 1.7.3 / Emscripten 4.0.23. Sources et provenance : `UPSTREAM.json` et `WOG-UPSTREAM.json`.

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

## Installation et Netlify

Après un clonage : `npm ci --prefix work/browser-tests`, puis `npm run prepare:web`. Le moteur web précompilé est inclus dans `outputs/vcmi-wasm-goonk-0.3.0-engine.tar.gz`.
Les données originales Heroes III restent exclues de Git. Pour le serveur local, les installer dans `work/game-data/homm3eng/home/web_user/.local/share/vcmi/`.

`npm run build:web` prépare `dist/` pour Netlify ; `node scripts/verify-site.mjs` vérifie les liens du moteur et l’exclusion des données originales. La configuration `netlify.toml` lance la préparation automatiquement. `node work/browser-tests/static-server.mjs` permet d’essayer ce dossier public sur le port 8767. Aucun déploiement en ligne n’a été effectué.

Le site public distribue le moteur, les mods Goonk/WoG et la carte Goonk. Au premier lancement, chaque joueur importe ses fichiers Heroes III depuis son appareil, sans les envoyer au serveur. Le choix de fichiers fonctionne aussi sans sélection de dossier sur téléphone. Les fichiers sont conservés dans le stockage privé du navigateur (OPFS) ; vider ce stockage impose une nouvelle importation.

Les données téléchargées portent une empreinte de contenu et sont vérifiées par morceaux de 4 Mo. Un redémarrage réutilise les fichiers inchangés ; une mise à jour télécharge les fichiers modifiés seulement. Les sauvegardes sont préservées. Le moteur compilé constitue toutefois un fichier unique : sa modification entraîne son rechargement. Ce mécanisme ne garantit pas un démarrage entièrement hors connexion : la page et le catalogue restent nécessaires.

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
