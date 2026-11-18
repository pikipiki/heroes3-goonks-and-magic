# Audit Material Design 3

L’inventaire distingue une source **inventoriée**, un écran **audité** (écarts identifiés) et un écran **vérifié** (contrôles et captures disponibles). Un changement de style commun ne constitue pas une preuve que tous les écrans sont validés.

La couverture inclut les entrées et chargements, les menus, la configuration des parties, les écrans du château, les héros et troupes, la carte et les commandes de combat, les dialogues et formulaires, le jeu en ligne et le stockage autonome. Les scènes natives et illustrations sont du contenu ; leurs commandes HTML et les zones tactiles font partie de l’audit.

Chaque variante doit être examinée en français et anglais, sur Chromium et WebKit, en portrait étroit et paysage de faible hauteur. Vérifier également les textes longs, les informations inconnues, les listes vides, les contrôles désactivés, les erreurs et la rotation.

## Références normatives

- [Typographie et thèmes Material Web](https://material-web.dev/theming/typography/) : rôles typographiques, tailles, interlignes et graisses.
- [Boutons Material Web](https://material-web.dev/components/button/) : hiérarchie des actions, états, accessibilité et personnalisation. Les exemples officiels permettent une forme de conteneur à 0 px : les boutons carrés Heroes III sont un choix de thème.
- [Espacements](https://m3.material.io/foundations/layout/grids-spacing) : grille et alignements.
- [Accessibilité Android](https://developer.android.com/develop/ui/compose/accessibility/api-defaults) : cibles tactiles et libellés.

## Contrôles

1. Rôles de texte cohérents ; aucune police réduite arbitrairement pour masquer un défaut de mise en page.
2. Marges, espacements et paddings de composition issus des tokens 4/8/12/16/24. Les bordures, dessins et compensations de zone sûre ne sont pas des espacements de composition.
3. Cibles tactiles d’au moins 48 × 48 pixels CSS, labels associés aux contrôles, focus visible et clavier utilisable.
4. Aucun mot coupé, aucune ellipse masquant une information utile, aucun chevauchement ou contrôle global inaccessible.
5. Titre et fermeture dans la zone commune ; actions de navigation et de validation en bas ou dans la colonne droite.
6. Contenu long dans une zone défilable identifiée si sa taille ne permet pas de le présenter entièrement. Ne pas réduire les cibles ni les textes pour forcer le contenu à tenir.
7. Comparaison avant/après, avec les mêmes données et dimensions. Les captures et instrumentation restent hors des fichiers publiés.

`inventory.json` est l’inventaire de couverture, pas une déclaration de conformité achevée. Les résultats doivent être rattachés aux scénarios effectivement exécutés.

## Comparaison 0.4.267

La référence avant composants est `7e7633ea31754d40959fa16eceb2ac69b747164f` (0.4.257). La matrice utilise les mêmes modèles de données, langues et dimensions. Les interfaces sont réelles ; le moteur est simulé et certains portraits natifs restent vides dans ces captures.

`verification.json` consigne les 912 cas de mise en page (38 écrans, six tailles, deux langues, deux moteurs), sans chevauchement détecté, et les suites d’interaction complémentaires. Les 228 paires de captures sont conservées comme artefact de revue local, hors publication du jeu.

Reproduire après `npm ci && npm run build:ui` :

```sh
node work/browser-tests/material-screen-matrix-e2e.mjs
UI_COMPARE_BASELINE=1 node work/browser-tests/material-screen-matrix-e2e.mjs
node work/browser-tests/material-audit-runner.mjs ui-screen-adapters mobile-settings-icons progression-layout recruitment-view town-buildings-readable guild-eight-players material-surfaces
```

Ces scénarios exigent les navigateurs Playwright installés. Ils lancent leurs propres navigateurs et des modèles isolés ; ils ne pilotent pas une partie ouverte sur téléphone.
