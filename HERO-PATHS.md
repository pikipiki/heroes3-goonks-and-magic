# Retrait des voies expérimentales

Après le retrait du 5 novembre 2026, les nouvelles parties des deux cartes fournies ne proposent plus les voies Armée, Magie et Économie. Les sanctuaires, leur description, la dépendance des cartes et leur génération ont été retirés. Le jeu n’active plus automatiquement le mod.

Le code expérimental complet et ses preuves restent archivés sur les branches `prototype/hero-paths-poc` (5cccbe8) et `feature/hero-paths-integration` (88a11ad). Il n’y a pas de développement supplémentaire de l’arbre Wheel.

## Anciennes sauvegardes

Les deux fichiers du mod `mod/hero-paths` restent distribués uniquement pour la compatibilité des parties créées avec la version 0.4.46. Leurs identifiants, statistiques et bonus sont conservés. Une ancienne partie garde ses sanctuaires et ses choix ; aucun objet ou bonus n’est effacé rétroactivement. Le mod est désactivé par défaut pour une installation neuve. Les presets existants restent conservés pour éviter de désactiver un mod requis par une sauvegarde.

Les sauvegardes personnelles ne sont ni lues ni réécrites par le retrait. Une suppression ultérieure de ces définitions nécessiterait une stratégie de compatibilité distincte.

## Corrections conservées

La normalisation des noms internes d’objets et des références aux héros, ainsi que la correction du propriétaire neutre au build, sont indépendantes des voies et restent actives. Le renommage Roc-DioupDioup est conservé dans le générateur. Aucun changement du moteur, de l’expérience des troupes ou des évolutions avancées des villes.

Validation : tests de retrait et de normalisation, suite Node, build et vérification du bundle. Le test natif de compatibilité utilise uniquement une sauvegarde synthétique créée dans son propre contexte de navigateur ; voir `HERO-PATHS-HANDOFF.json` pour le résultat final.

Pour reproduire le test de compatibilité, préparer deux builds isolés : l’ancien commit `88a11ad` avec ses fixtures natives dans `maps`, puis le build de retrait sans ces fixtures. Servir les deux successivement à la même origine de test. Lancer `work/browser-tests/hero-paths-withdrawal-compatibility-e2e.mjs PROJECT SORTIE_NEUVE` avec `GAME_ORIGIN` et `CDP_URL`. Le test crée `old-save-ready` après une sauvegarde native ; basculer alors le serveur vers le build de retrait et créer `new-build-ready` dans SORTIE_NEUVE. Le test recharge et vérifie le bonus. Aucun octet de sauvegarde n’est exporté dans les preuves.

Le test `work/browser-tests/hero-paths-withdrawal-new-game-e2e.mjs PROJECT SORTIE_NEUVE` utilise un autre contexte neuf, vérifie que le mod n’est pas activé, puis fait marcher le héros sur l’ancien emplacement. Utiliser un navigateur CDP de test dédié ; les deux scripts ferment uniquement leur propre contexte.
