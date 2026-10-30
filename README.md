# Heroes Goonk

Château Goonk pour VCMI 1.7.3 : sept créatures, leurs évolutions, bâtiments progressifs et moteur WebAssembly corrigé. Version 0.2.0.

## Jouer sur ce Mac

Depuis ce dossier, lancer `npm start`, puis ouvrir http://127.0.0.1:8765/.
Si le port est déjà occupé : `PORT=8766 npm start`, puis ouvrir http://127.0.0.1:8766/.
Le dossier local contient déjà le moteur compilé, les dépendances et les données du jeu nécessaires. Le serveur d'origine peut continuer à tourner indépendamment.

## Contenu versionné

- `mod/goonk/` : mod prêt à installer, avec ses configurations et sprites.
- `maps/000-Goonk.vmap` : carte de démonstration.
- `work/browser-tests/` : scripts de création du mod, serveur et vérifications.
- `work/vcmi-wasm/` : sources du moteur avec les corrections locales ; provenance dans `UPSTREAM.json`.
- `outputs/` : archives, images sources, aperçus, correctifs et rapports de vérification.

## Recréer le mod

`npm run build:mod` recrée le mod et la carte dans `work/game-data/...`, utilisés par le serveur. Les références graphiques pointent vers les images incluses dans ce dépôt.
Après un nouveau clonage, installer les outils avec `npm ci --prefix work/browser-tests`.
Extraire `outputs/vcmi-wasm-goonk-0.2.0-engine.tar.gz` dans `work/vcmi-wasm/emscripten/` pour retrouver le moteur web précompilé.
Les données originales Heroes III ne sont pas versionnées : elles doivent être réinstallées localement dans `work/game-data/homm3eng/home/web_user/.local/share/vcmi/`.

## État et limites

Voir `outputs/goonk-v2-validation.json`. La construction, le recrutement, le combat et un déplacement après victoire ont été vérifiés sur la carte de démonstration. La sauvegarde exacte du joueur reste à retester. Les sauvegardes anciennes conservent les bâtiments déjà construits ; une nouvelle partie est nécessaire pour repartir avec une ville peu construite. Le décor de siège reste celui du Château classique.

## Données locales exclues de Git

Les données originales du jeu, les dépendances installées et les fichiers de compilation restent disponibles sur ce Mac mais sont ignorés par Git. Le moteur VCMI conserve sa licence GPL ; consulter `work/vcmi-wasm/license.txt`.
