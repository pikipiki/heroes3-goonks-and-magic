# Refonte des adaptateurs UI MUI

La référence visuelle est `7e7633ea31754d40959fa16eceb2ac69b747164f`, avant la première bibliothèque de composants. Les captures intermédiaires du HEAD ne remplacent pas cette référence.

## Intégration

Les fabriques du jeu utilisent la bibliothèque MUI à travers `renderMarkup`, `createUIElement` et `createUIField`. L’adaptateur rend les surfaces avec `Box`, les textes avec `Typography`, les actions avec `Button`/`IconButton`, les champs avec `InputBase`, `Checkbox`, `Radio`, `Select`, les curseurs avec `Slider` et la progression avec `LinearProgress`. Les protocoles natifs de valeurs, commandes, sélection et annulation restent aux contrôleurs du jeu. Les canvas d’animation, scènes, positions de bâtiments et ressources d’illustration sont conservés.

Les contrôles créés impérativement gardent leur délégation d’événements MUI et leur ripple quand ils sont insérés dans le DOM natif. Leur classe de composant ne disparaît pas quand un ancien contrôleur assigne `className`. Le pont des boutons conserve les changements de disponibilité : une action initialement désactivée peut être réactivée sans garder un état MUI obsolète. Les sources natives des sélecteurs restent cachées et ne sont pas présentées comme un second contrôle visible.

Le catalogue et le jeu partagent les finitions dorées et le curseur en relief dans `control-finish.mjs`. Les tailles de police fixes des propriétés `font-size` des feuilles d’écran ont été regroupées dans les rôles du thème. Les adaptations de positionnement restent dans `reference-layout.css` ; les commandes sont en bas en portrait et à droite en paysage. Les informations longues peuvent défiler dans leur panneau sans recouvrir les actions.

Les 27 compositions React métier restent disponibles pour les nouveaux écrans. La migration des anciens contrôleurs passe par l’adaptateur commun, afin de préserver leurs événements et la géométrie des personnages ; elle ne substitue pas les données de démonstration du catalogue aux données du moteur. Les shells natifs, le protocole `<dialog>`, les sources de sélecteurs et les rendus graphiques sont des frontières d’adaptation.

## Vérifications

- `material-screen-matrix-e2e.mjs` : 38 états × 6 formats × 2 langues × Chromium/WebKit, captures et contrôle des actions, textes, cibles tactiles et chevauchements.
- `material-real-prototypes-e2e.mjs` : douze écrans natifs × quatre formats avant/après, sans sauvegarde utilisateur, avec mesures des surfaces de personnages. Ce relevé natif ne constitue pas une capture des 185 variantes de l’inventaire.
- `ui-native-controls-e2e.mjs` : champs, quantités, cases, changements de disponibilité, événement unique, ripple réel et progression du téléchargement.
- `ui-screen-adapters-e2e.mjs`, `army-upgrades-ui-e2e.mjs`, `material-menu-lifecycle-e2e.mjs` : commandes, annulation, focus, contrôles d’amélioration et cycles de vie.
- `heroes-design-system-e2e.mjs`, `game-components-e2e.mjs` et `game-components-boundaries-e2e.mjs` : bibliothèque, cas limites et interactions des compositions.
- `node --test tests/*.test.mjs` et hook de composants partagés. Les fichiers natifs non validés présents dans le workspace ne sont pas inclus dans ce changement UI.

Les rapports et captures se trouvent hors du dépôt. `build-ui-review.mjs` vérifie la présence de 48 paires natives, le même nombre de surfaces de personnages et l’absence de diminution supérieure à deux pixels ; il construit une revue MUI locale avec les images réelles.
