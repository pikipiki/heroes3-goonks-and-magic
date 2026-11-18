# Interface commune Heroes Goonk

Le système applique les principes de Material Design 3 avec la palette, les cadres et les boutons à angles droits de Heroes III. La forme carrée des boutons est une exigence du propriétaire et prime sur les formes arrondies de Material. Il ne remplace ni les règles du jeu ni ses commandes natives.

## Composants à réutiliser

L’entrée publique est `web/ui/components.mjs` et le thème est `web/ui/components.css`.

| Besoin | Composant |
| --- | --- |
| Nouvel écran | `screenHeaderMarkup`, `actionDockMarkup`, `useScreenComponents` |
| Action principale / secondaire / destructive | `buttonMarkup` ou `decorateButton` ; variantes `filled`, `tonal`, `danger` |
| Fermer | `iconButtonMarkup` ; libellé accessible traduit |
| Actions d’un écran existant | `useActionDock` ; conserve les véritables boutons et leurs gestionnaires |
| Navigation compacte | `useActionDock` avec seuil et libellé contextuel ; mêmes onglets et commandes, sans copies |
| Actions secondaires nombreuses | Menu « Plus » fourni automatiquement par le dock |
| Menu ancré | `createPopupMenu` ; focus, clavier, annulation et protections tactiles partagés |
| Sélecteur | `createMaterialSelects` ; options accessibles, choix immédiat et langue courante |
| Choix de carte / onglets | `useChoiceTile`, `useTabs` ; sélection et navigation clavier |
| Quantité | `useQuantityStepper` ; contrôles et champ homogènes |
| Coût et caractéristiques | `resourceCostMarkup`, `statGridMarkup` |
| Message d’état / erreur | `noticeMarkup` ; `status` / `alert` |
| Espacements, couleurs, formes et états | `tokens.css` ; ne pas recopier des valeurs locales |

## Structure et règles

- En portrait, titre et croix en haut ; actions globales en bas. « Retour » n’est jamais dans l’en-tête.
- En paysage mobile, titre et croix partagent la colonne de droite avec les actions. Le contenu utilise la hauteur disponible.
- Une action principale clairement distinguée, une sortie de navigation et au besoin « Plus » pour les actions secondaires. Les boutons de fermeture ne valident jamais implicitement un achat ou une action obligatoire.
- Les filtres, onglets, cartes à choisir, contrôles de quantité et actions propres à une ligne restent près du contenu concerné. Ils ne sont pas des actions globales à déporter au bas de l’écran.
- Typographie partagée : titres 20 px (18 px en paysage), actions 14 px, onglets compacts 12 px. Aucune transition de taille, position ou police.
- Zone tactile d’au moins 48 × 48 pixels CSS ; grille d’espacements 4/8 ; état désactivé natif ; focus visible ; libellés accessibles dans la langue configurée.
- Texte principal à contraste 4,5:1 au minimum ; grands textes et éléments graphiques fonctionnels 3:1 ; couleurs fonctionnelles sous forme de rôles.
- Aucun titre coupé par des points de suspension. Le texte peut revenir à la ligne ; le contenu long défile dans sa propre zone, pas derrière les commandes.
- L’ouverture des menus est immédiate. Réduction des mouvements respectée. Une seule activation par geste, même après reconfiguration du DOM ou rotation.
- Un dialogue exigeant une réponse sans annulation ne reçoit pas une croix qui déclencherait une confirmation. Cette exception doit être déclarée dans son contrat.

Les écrans existants passent par les adaptateurs explicites de `contracts.mjs`. Ils conservent leurs références de boutons et leurs délégations d’événements. Pour un nouvel écran, utiliser les fabriques partagées directement ; enrichir la bibliothèque si un motif manque, plutôt que copier un autre écran.

## Vérification et hook

`node scripts/install-ui-hook.mjs` installe `.githooks/pre-commit` dans le répertoire de hooks Git existant, sans écraser les hooks Graphify. Le hook vérifie les fichiers **indexés** : un module d’interface nouveau ou modifié doit importer la bibliothèque commune. Cette vérification statique ne remplace pas la revue des composants ou les tests visuels.

Comparer visuellement les mêmes écrans avant/après avec les mêmes données et dimensions ; conserver les captures de revue hors du code publié. Toute modification d’interface doit être vérifiée en français et anglais, en portrait et paysage, sur Chromium et WebKit, y compris les petites hauteurs, les états vides/chargement/erreur/désactivé et les longs libellés. Les contrats d’écran et les tests de composants servent d’inventaire commun.

Références : [Material 3](https://m3.material.io/), [dialogues](https://m3.material.io/components/dialogs/guidelines), [accessibilité Android et cibles tactiles](https://developer.android.com/guide/topics/ui/accessibility/apps), [mise en page Material](https://m2.material.io/design/layout/understanding-layout.html).
