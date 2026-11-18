# Interface commune Heroes Goonk

## Bibliothèque de référence Heroes III

Le catalogue interactif se lance avec `node scripts/serve-design-system.mjs`, puis s’ouvre sur `http://127.0.0.1:8942/design-system.html`. L’onglet **Recrutement** compose les mêmes éléments dans un écran portrait/paysage. Le bundle de revue est généré dans `/tmp/heroes-design-system`, jamais chargé par le jeu publié.

Pour cette refonte, importer les compositions de `src/ui/heroes-kit.mjs`, leur feuille `src/ui/heroes-kit.css` et les primitives de `src/ui/components.mjs`. Placer le nouvel écran sous `ThemeProvider` avec `heroesReferenceTheme`. Ne pas copier le CSS du catalogue dans un écran : enrichir la composition commune. Les gestionnaires, données, traductions et URL des assets sont fournis par l’appelant ; la bibliothèque ne commande pas le moteur et ne possède aucune sauvegarde.

| Composition | Réutilisation |
| --- | --- |
| `HeroesPanel`, `HeroesButton`, `HeroesClose` | Cadres, actions principales rouges, secondaires brunes, fermeture |
| `ScreenShell`, `ActionDock` | Contenu et commandes ; titre/actions à droite en paysage, commandes fixées en bas en portrait |
| `CreatureArt`, `EvolutionCard`, `ChoiceTile` | Recadrage d’atlas réel, évolutions, cartes de sorts/bâtiments/choix |
| `StatGrid`, `ResourceCost`, `ResourceStrip` | Caractéristiques et icônes des ressources ; or affiché en entier |
| `QuantityControl`, `PurchaseSummary` | Champ numérique et curseur synchronisés, stock, prix unitaire, total |
| `ArmySlot`, `HeroesDataTable` | Emplacements, troupes, tableaux avec en-têtes accessibles |
| `ConfirmDialog` | Titre, contenu et actions de confirmation localisées |

Les sélecteurs, cases, radios circulaires, onglets, messages, infobulles, indicateurs de progression et badges sont les composants MUI réels exportés par la façade. Leur apparence est configurée dans `heroesReferenceTheme`. Les espacements utilisent une base de 8 px avec demi-pas de 4 px ; les cibles de bouton restent au moins 48 px. Le choix explicite du propriétaire conserve les boutons et cadres carrés, avec les textures et le relief Heroes III. Cela constitue une adaptation de Material, pas une certification de conformité intégrale.

Le catalogue utilise les trois évolutions Picpique réellement présentes dans `mod/goonk/Content/config/creatures.json`, leur traduction française et leurs illustrations HD. Stock/ressources sont des valeurs de démonstration identifiées ; les confirmations ne modifient aucune partie. L’illustration du catalogue est fixe : la lecture animée reste celle du moteur. Ni quatrième évolution inventée ni texte de remplissage de la référence ne sont ajoutés.

L’habillage a été confronté aux archives de l’installation originale fournie par le propriétaire (`vcmi-data/Data/H3bitmap.lod` et `H3sprite.lod`) : fonds `DIBOX128.PCX`/`DiBoxBck.pcx`, cadres `RECQ320.PCX` et bouton `IOKAY.DEF`. Le bouton original et celui de la copie de données du projet ont le même SHA-256 décompressé : `b5b00d52fbd25916c2eaaa51be22d8b8e6fd67166d6ed482974c91b450d3ceba`. La bibliothèque réutilise les textures, bordures de bouton et coins décorés déjà extraits dans `web/h3-theme/`, sans ajouter une seconde collection d’images. Les cadres ornés sont une variante de panneau ; les panneaux internes restent plus sobres pour garder la hiérarchie.

Validation : `node work/browser-tests/heroes-design-system-e2e.mjs`, serveur ouvert. Chromium et WebKit, français/anglais, 320×568, 360×640, 568×280, 640×360 et 1280×720 ; captures dans `/tmp/heroes-kit-review`. Ces contrôles ne remplacent pas les tests d’un écran connecté au moteur. Le déploiement de la bibliothèque à tous les écrans existants reste une migration distincte, à vérifier écran par écran.

Références vérifiées : [cibles tactiles Material](https://developer.android.com/develop/ui/compose/accessibility/api-defaults), [navigation et dispositions adaptatives](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns).

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
