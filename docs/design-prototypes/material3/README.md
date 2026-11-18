# Refonte Heroes III — vrais écrans du jeu

La première galerie de modèles HTML illustratifs a été remplacée. Cette version utilise **le moteur WebAssembly réel et les composants de production** (`web/mobile.mjs`, `web/game-menu.mjs`, la bibliothèque MUI et les fabriques des écrans).

## Aperçu jouable

```sh
node docs/design-prototypes/material3/serve-real.mjs
```

Ouvrir `http://127.0.0.1:8941/real-preview.html`. Le jeu local doit déjà être préparé dans cet environnement. Le lanceur utilise une copie temporaire de l’archive moteur vérifiée ; il ne modifie pas le moteur en développement.

L’aperçu crée une nouvelle partie locale sur la vraie carte Goonk. Les commandes de triche natives du jeu rendent les bâtiments et les sorts consultables dans cette démonstration. Les créatures, leurs statistiques, les prix, les bâtiments, leurs images, les sorts, les fenêtres et les actions viennent ensuite du moteur. Les sauvegardes des autres origines et des téléphones ne sont pas utilisées.

Le sélecteur de format change réellement la taille du viewport de l’iframe. Les quatre tailles sont 360 × 640, 320 × 568, 640 × 360 et 568 × 280. Le sélecteur d’écran utilise les commandes normales du jeu ; il ne fabrique aucun état JSON. Le reste des écrans reste accessible en jouant normalement.

## Habillage proposé

`real-prototype.css` habille les éléments existants avec les textures et boutons de `web/h3-theme/`, les couleurs et reliefs Heroes III. Les portraits, décors et bâtiments sont ceux que le jeu rend réellement. Les boutons transparents servant à cliquer sur les bâtiments restent transparents afin de laisser voir leurs véritables graphismes.

Les dispositions et commandes reposent sur les composants communs existants. Dans la fenêtre d’achat d’une machine de guerre, la sortie en double est retirée et le prix reste visible. Le menu conserve sa véritable fermeture. Aucun contenu, calcul de coût, nom ou comportement du moteur n’est remplacé pour embellir les captures.

Les styles sont limités à `html[data-real-prototype=heroes]` et chargés seulement par l’aperçu isolé. Aucun fichier de cette proposition n’est importé par la version publiée du jeu.

## Galerie de captures réelles

La galerie compare le jeu actuel et l’habillage proposé sur la même partie native : **12 écrans, quatre formats, deux habillages, soit 96 captures**. Elle ne prétend pas montrer 175 états natifs qui n’auraient pas été exécutés.

Les douze écrans capturés sont le château, le hall de recrutement, l’armée, l’équipement et les compétences du héros, le marché, la guilde des mages, la taverne, les machines de guerre, le grimoire, la carte et les paramètres.

`real-captures.json` contient la provenance du moteur et du CSS, le mode natif, les dimensions intérieures vérifiées et l’empreinte de chaque image. Il ne contient aucune sauvegarde ou donnée de compte. Les images proviennent directement de captures du navigateur ; aucun dessin de remplacement n’est ajouté.

Pour régénérer les captures dans un dossier temporaire :

```sh
node work/browser-tests/material-real-prototypes-e2e.mjs
```

Après revue et ajout des captures vérifiées au dépôt, reconstruire la galerie :

```sh
node docs/design-prototypes/material3/build.mjs
```

Les deux premières images des machines de guerre sont intégrées au fragment pour être visibles immédiatement. Les autres captures sont chargées depuis leur commit immuable. L’aperçu jouable est nécessaire pour interagir avec les véritables contrôles ; les images de la galerie servent à comparer les dispositions.
