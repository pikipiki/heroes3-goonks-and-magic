# Interface commune Heroes Goonk

L’interface utilise **React et les composants réels `@mui/material`**, avec un thème Heroes III centralisé dans `src/ui/theme.mjs`. MUI adopte Material Design 2 par défaut : les rôles typographiques, cibles de 48 px et compositions adaptatives M3 sont définis dans ce thème et dans les composants de structure. Installer MUI ne constitue pas, à lui seul, une certification M3.

## Composants à réutiliser

Pour les nouveaux écrans React, importer les composants proposés par `src/ui/components.mjs` et les placer sous `ThemeProvider` avec `heroesTheme` : `Button`, `IconButton`, `Select`, `Menu`, `MenuItem`, `RadioGroup`, `Radio`, `Checkbox`, `TextField`, `Slider`, `Tabs`, `Stack`, `Toolbar`, `Typography`, `Card`, `Dialog`, `Alert`.

Configurer les couleurs, polices, formes, espacements et états **une fois dans le thème** (`spacing:8`, `shape.borderRadius:0`, `components.*`). Utiliser `theme.spacing()` / les propriétés `spacing`, `gap`, `p`, `m` ; ne pas créer une copie de bouton ou de sélecteur. Ajouter une composition réutilisable si un motif manque. Les exceptions de mise en page concernent les contraintes du jeu et doivent rester localisées.

`npm ci && npm run build:ui` compile React, Emotion et MUI en un module local partagé, sans CDN. Le build génère également `web/ui/tokens.css` depuis le même thème : les scènes CSS/canvas consomment les mêmes valeurs. Ne pas modifier ce fichier généré à la main. Le build public et les tests régénèrent le module ; le workflow installe les dépendances verrouillées.

Pour les fabriques existantes qui conservent le protocole natif, l’entrée est `web/ui/material-components.mjs` :

Cette façade étend `components.mjs`, dont le contrat WoG reste inchangé. La feuille `material-components.css` compose le socle natif et les adaptations MUI ; les compositions de disposition sont regroupées dans `screen-layouts.css`. Les panneaux natifs à modalité explicite utilisent la frontière commune `modal-boundary.mjs` pour le focus et l’isolation du fond.

Utiliser `renderMarkup` pour rafraîchir une fabrique. Lorsqu’une galerie native doit remplacer manuellement un sous-arbre, appeler `restoreMovedActions(ancienSousArbre)` avant de le retirer : des commandes de l’en-tête peuvent avoir été déplacées dans son menu. Le menu ne devient jamais propriétaire de ces commandes.

| Besoin | Adaptateur partagé |
| --- | --- |
| Rendu d’une fabrique existante | `renderMarkup` : rend de vrais `Button`, `IconButton`, `Toolbar`, `Typography`, `Paper`, `Stack` MUI et les champs reconnus, avant la pose des commandes |
| Écran et actions | `screenHeaderMarkup`, `actionDockMarkup`, `useScreenComponents`, `useActionDock` |
| Menus | `createPopupMenu` : `Menu` MUI, mêmes boutons de commande |
| Sélecteurs | `createMaterialSelects` : `Select` / `MenuItem` MUI, champ natif conservé comme pont de commande |
| Gestionnaire impératif existant | `setClickHandler` / `bindPress` ; éviter `.onclick`, que React peut réaffecter |
| Choix natifs WoG dans un groupe nommé | `radioChoicesMarkup` dans un `fieldset` avec sa légende ; pont natif conservé |
| Coût et caractéristiques | `resourceCostMarkup`, `statGridMarkup` |

Les champs de formulaire natifs dont le protocole reste impératif, les zones tactiles superposées au canvas et l’amorçage avant le chargement de React sont des adaptations particulières. Ils utilisent les tokens générés et restent dans l’audit de tailles, contrastes, défilement et appuis. Ne jamais annoncer qu’un champ natif est un composant MUI.

## Structure et règles

- En portrait, titre et croix en haut ; actions globales en bas. « Retour » n’est jamais dans l’en-tête.
- En paysage mobile, titre et croix partagent la colonne de droite avec les actions. Le contenu utilise la hauteur disponible.
- Une action principale clairement distinguée, une sortie de navigation et au besoin « Plus » pour les actions secondaires. Les boutons de fermeture ne valident jamais implicitement un achat ou une action obligatoire.
- Les filtres, onglets, cartes à choisir, contrôles de quantité et actions propres à une ligne restent près du contenu concerné. Ils ne sont pas des actions globales à déporter au bas de l’écran.
- Typographie partagée : titres 22/28 px (16/24 px en paysage), actions 14/20 px, libellés compacts 12/16 px, texte 16/24 ou 14/20 px. Aucune transition de taille, position ou police.
- Zone tactile d’au moins 48 × 48 pixels CSS ; grille d’espacements 4/8 ; état désactivé natif ; focus visible ; libellés accessibles dans la langue configurée.
- Texte principal à contraste 4,5:1 au minimum ; grands textes et éléments graphiques fonctionnels 3:1 ; couleurs fonctionnelles sous forme de rôles.
- Aucun mot français ou anglais ne doit être coupé : `word-break:normal`, `overflow-wrap:normal`, `hyphens:none`. Organiser le contenu pour laisser une largeur suffisante aux mots.
- Aucun titre coupé par des points de suspension. Le texte peut revenir à la ligne ; le contenu long défile dans sa propre zone, pas derrière les commandes.
- L’ouverture des menus est immédiate. Réduction des mouvements respectée. Une seule activation par geste, même après reconfiguration du DOM ou rotation.
- Un dialogue exigeant une réponse sans annulation ne reçoit pas une croix qui déclencherait une confirmation. Cette exception doit être déclarée dans son contrat.

Les écrans existants passent par les adaptateurs explicites de `contracts.mjs`. Ils conservent leurs références de boutons et leurs délégations d’événements. Pour un nouvel écran, utiliser les fabriques partagées directement ; enrichir la bibliothèque si un motif manque, plutôt que copier un autre écran.

## Vérification et hook

`node scripts/install-ui-hook.mjs` installe `.githooks/pre-commit` dans le répertoire de hooks Git existant, sans écraser les hooks Graphify. Le hook vérifie les fichiers **indexés** : un module d’interface nouveau ou modifié doit importer la bibliothèque commune. Cette vérification statique ne remplace pas la revue des composants ou les tests visuels.

Comparer visuellement les mêmes écrans avant/après avec les mêmes données et dimensions ; conserver les captures de revue hors du code publié. Toute modification d’interface doit être vérifiée en français et anglais, en portrait et paysage, sur Chromium et WebKit, y compris les petites hauteurs, les états vides/chargement/erreur/désactivé et les longs libellés. Les contrats d’écran et les tests de composants servent d’inventaire commun.

Références : [Material 3](https://m3.material.io/), [dialogues](https://m3.material.io/components/dialogs/guidelines), [accessibilité Android et cibles tactiles](https://developer.android.com/guide/topics/ui/accessibility/apps), [mise en page Material](https://m2.material.io/design/layout/understanding-layout.html).
