# Suivi des captures iPhone — 19 novembre 2026

Les corrections utilisent les composants MUI communs et les commandes natives existantes. Les captures de validation restent dans `/tmp`, hors publication.

| Captures | Correction | Vérification |
| --- | --- | --- |
| 8629, 8630 | Aperçu de combat contenu, quatre statistiques en grille 2 × 2, commandes au bord inférieur, champ de bataille préservé. | `battle-commander-layout-e2e`, `compact-battle-controls-e2e` |
| 8631 | Construire devient l’action principale du château ; Recrutement passe dans Plus. Hauteur commune de 48 px. | Composition commune des commandes |
| 8632 | Sélecteur MUI du niveau de magie ; liste défilante sans pagination ; description plus large. | `phone-shared-chrome-e2e` |
| 8633, 8634 | Onglets MUI habillés Heroes, verticaux en paysage ; portraits agrandis ; renseignements partiels lisibles. Le radar utilise uniquement des rangs connus. | `guild-radar-e2e`, `guild-eight-players-e2e`, snapshot du moteur réel |
| 8635, 8642 | Bandeau de recrutement compact ; nom, prix, statistiques abrégées accessibles, quantité et actions sans chevauchement. | `recruitment-screens-regression-e2e`, captures natives |
| 8636 | Recrues et date visibles à côté de la minicarte ; débordement autorisé hors du bandeau pour préserver les appuis. | `hero-map-composition-e2e` |
| 8637, 8638 | Commandant visible en paysage ; caractéristiques contenues ; spécialisation pleine largeur ; arbre sans rangée vide. | `battle-commander-layout-e2e`, `commander-tree-layout-e2e` |
| 8639 | Vrais boutons radio MUI avec illustrations de difficulté prédécodées. | `setup-choice-fields-e2e` |
| 8640, 8641 | Attente bloquante de sélection corrigée lors du changement du nombre de joueurs humains. Générateur après WoG ; action explicite Générer et commencer. | `random-map-native-e2e` Chromium, `newgame-loading-layout-e2e` Chromium/WebKit |
| 8643 | Soumission unique, reçus légers et délais de confirmation annulés correctement. | 30 achats natifs sur dix factions ; 96 transactions simulées. L’écran blanc iPhone n’a pas été reproduit. |
| 8644 | Icône immédiatement à côté du nom de la ressource ; quantité alignée sous le nom. | `phone-shared-chrome-e2e` |
| 8645, 8646 | Confirmation et résultat de recrutement indépendants ; actions communes en bas/à droite ; sortie unique par croix sur le résultat. | `recruitment-screens-regression-e2e`, fermeture après achats natifs |
| 8648 | Noms de cartes complets, retour à la ligne entre mots. | `newgame-loading-layout-e2e` |
| 8649 | Chargement avec progression MUI ; commandes de carte, validation et zoom masquées pendant cette phase. | `newgame-loading-layout-e2e` |
| 8650, 8652 | Sélecteur MUI unique pour les rubriques du héros ; informations et commandes espacées ; fermeture à côté des ressources. | `hero-map-composition-e2e` |
| 8651 | Description de déplacement et de type d’attaque issue des propriétés natives si le texte est vide ; capacités natives conservées ; effectif compact. | `recruitment-screens-regression-e2e`, captures natives |
| 8653, 8654 | Étapes de construction encadrées et clairement cliquables ; onglets MUI verticaux en paysage, sans changement de géométrie lors des filtres. | `construction-flow-e2e` sur dix factions et chaîne de 26 étapes |
| 8655 | Confirmation Nouvelle partie composée avec MUI Stack et espacements communs ; Retour redondant retiré, croix conservée. | Parcours nouvelle partie et composants communs |

## Limites de validation

Les parcours de contrôleurs sont testés sur Chromium et WebKit, en français et anglais, en petites tailles portrait et paysage. Le moteur réel Chromium a démarré et effectué les achats ainsi que la génération aléatoire. Le moteur WebAssembly sous WebKit de bureau est resté au chargement avant l’initialisation de l’interface ; cela ne constitue pas une validation native sur iPhone physique. Aucune disparition de l’écran blanc iPhone n’est affirmée sans reproduction.

## Complément : prévisions de pertes en combat

L’option **Estimation des pertes ennemies**, activée par défaut et mémorisée, contrôle les annotations discrètes en Classic et Vertical. Elles correspondent à l’estimateur natif de première frappe : ni effets aléatoires ni total hypothétique de coups successifs. Défendre est directement accessible ; Magie reste dans Plus.

Le moteur 0.4.295 a été compilé avec `ninja -j32 html5` dans une copie isolée de main ne contenant pas les optimisations raster en cours. Validation : partie réelle Chromium avec prévisions de deux ennemis, changement d’acteur après Défendre, ouverture du livre par Plus, option OFF/ON ; 64 cas visuels denses sur Chromium/WebKit, tous les ennemis éligibles visibles sans recouvrir les silhouettes ni les compteurs ; huit cas de persistance des réglages.
