# Propositions Material Design 3 — Heroes Goonk

Cette galerie propose une composition pour les **56 familles et 175 états** recensés dans `docs/ui-audit/inventory.json`. Chaque état est accessible dans les sélecteurs. Les deux directions partagent les mêmes composants de composition et les mêmes données illustratives.

Le jeu, les sauvegardes et les commandes du moteur ne sont pas modifiés. Les actions de la galerie sont locales. Les dessins de créatures sont des illustrations statiques existantes ; la carte et le champ de bataille sont schématiques. Les formulaires ERM variables sont représentés par leurs gabarits de choix, texte, nombre et illustration.

## Deux directions

| Direction | Portrait | Paysage |
| --- | --- | --- |
| **Héritage clair** | Galeries de créatures, choix d’évolution à côté de l’illustration, caractéristiques et lecture hiérarchisées. Deux familles visibles dans le hall. | Liste d’évolutions, illustration et description séparées. Les commandes restent dans le panneau droit. |
| **Focus tactique** | Listes de services, détail guidé et sélecteur d’évolution. Le hall conserve les deux familles visibles. | Deux panneaux de contenu et panneau de commandes droit ; les informations longues défilent dans le contenu. |

La galerie ne réduit pas toutes les pages à un formulaire générique : le combat conserve un espace tactique, le château une collection de bâtiments, le marché un échange source/destination, la guilde un classement, et les armées une grille de troupes.

## Système commun proposé

- `Scaffold` : titre, fermeture, ressources, zone de contenu et commandes. La navigation de la galerie reste extérieure au jeu représenté.
- `ActionDock` : action principale, action secondaire et menu des commandes moins fréquentes. En paysage, le titre et les commandes occupent le panneau droit ; les actions secondaires passent dans le menu si nécessaire.
- `ResourceBar` : une ligne en portrait, montants d’or entiers et groupés. Les ressources et l’or occupent des lignes adaptées au panneau droit en paysage.
- `CreatureArt`, `EvolutionChoices`, `StatGrid`, `QuantityControl`, `PurchaseSummary` : mêmes règles pour le château, les bâtiments de la carte et les fiches.
- `ListRow`, `ChoiceGrid`, `Field`, `Tabs`, `Alert`, `EmptyState`, `Progress` : mêmes rôles, alignements et états pour les autres familles.

Les marges principales sont de 16 px, les espaces de 8/12/16/24 px, les commandes d’au moins 48 × 48 px. Les rôles de texte proposés sont : titre 22/28, titre compact 16/24, corps 14/20, libellé 14/20 et information secondaire 12/16. Les textes ne sont pas découpés au milieu d’un mot. Les descriptions longues défilent dans leur panneau ; les actions restent accessibles.

Les coins carrés, la typographie de titre et le panneau droit sont des adaptations demandées pour Heroes III. Cette proposition applique les principes de composition M3 ; elle ne prétend pas que l’habillage du jeu est un composant Google standard. Les prototypes HTML sont des maquettes, pas une nouvelle implémentation MUI. Une intégration retenue devra utiliser la bibliothèque réelle du projet, `src/ui/components.mjs` et `web/ui/material-components.mjs`.

## Parcours et cas denses

- **Recrutement** : deux familles visibles, coût et quantité regroupés près de l’action. Les trois ou quatre évolutions restent sélectionnables ; une troisième carte ne laisse pas de case vide dans le motif en deux colonnes.
- **Fiche de créature** : illustration, caractéristiques, capacités et effets actifs restent des régions distinctes. Le texte ne pousse pas les commandes hors du viewport.
- **Héros** : onglets d’armée, objets, sac et compétences ; le héros à recruter ouvre une consultation des compétences et ne permet pas de déplacer ses objets.
- **Guilde des voleurs** : huit lignes de joueurs, un renseignement sélectionné à la fois, indication explicite des informations inconnues. Le sélecteur permet de conserver l’accès aux autres renseignements.
- **Châteaux** : positions et tailles des tuiles stables ; les sous-titres ont une zone réservée. Le réglage de prototypage permet de comparer les factions sans déplacer les services.
- **Combat** : zone tactique prioritaire, résumé de sélection, commandes accessibles ; inspection, magie, attente, défense, changement de vue et retraite restent identifiables.
- **États vides, verrouillés, erreur et confirmation** : cause et prochaine action à proximité, état désactivé visible, sans masquer le prix ou le contexte.

## Couverture et vérification

`coverage.json` associe chaque entrée de l’inventaire à ses variantes. Les contrôles automatiques portent sur chaque état dans les deux directions et les tailles 360 × 640, 320 × 568, 640 × 360 et 568 × 280. Ils contrôlent les commandes, les débordements horizontaux, le titre, la zone de contenu et les deux familles du hall. Une série complémentaire utilise des ressources à 9999, l’or à 9 999 999, trois évolutions et une description longue.

Ces contrôles de maquettes ne valident pas les animations natives, les performances du moteur ou un téléphone physique. Les preuves du jeu existant et ses comparaisons avant/après restent distinctes dans `docs/ui-audit/`.

Pour reconstruire le fragment affichable dans la conversation :

```sh
node docs/design-prototypes/material3/build.mjs
```

Pour le contrôler dans les navigateurs installés :

```sh
node work/browser-tests/material-prototypes-e2e.mjs
ENGINE=webkit node work/browser-tests/material-prototypes-e2e.mjs
```

Le carrousel des directions et les réglages de description longue / ressources maximales sont fournis par l’afficheur de prototypes. La source de la maquette est `gallery.template.html`, le fragment généré est `prototypes.html`. Aucun fichier de cette galerie n’est chargé par le jeu.

## Références

- [Disposition et navigation adaptatives — Android Developers](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns)
- [Cibles tactiles — Android Developers](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)
- [Grilles et espacements — Material Design 3](https://m3.material.io/foundations/layout/grids-spacing)
- [Rôles typographiques — Material Design 3](https://m3.material.io/styles/typography/type-scale-tokens)
