# Aventures WoG dans Heroes Goonk

Ce lot porte les trois priorités d’exploration de la référence TUM 3.5.0 fournie : remplacements d’objets au premier jour, six banques manquantes et Grotte mystérieuse. Les fichiers source sont épinglés par leurs empreintes ; il ne s’agit pas d’un interpréteur général des scripts ERM ou des plugins Windows.

Les deux cartes « Goonks — Trésors de WoG » conservent leurs objectifs et leurs armées de départ. Chaque royaume possède 29 repaires, une Grotte, un fort et une cache d’Ailes d’ange défendue par 20 Griffons royaux. Les châteaux des dragons de feu et de glace gardent leur véritable entrée entourée d’obstacles ; le vol permet de les atteindre.

Chaque royaume reçoit aussi 33 lieux de recrutement. Leurs créatures et les améliorations d’origine rendent les 44 nouvelles identités de ce périmètre accessibles. HolyPeaks 17/166 et le lien Mummy 141→360 sont repris des déclarations source, sans modifier les caractéristiques de la Momie. Cinq habitations supplémentaires par royaume conservent les probabilités originales de transformation au premier jour. Un tirage raté laisse l’habitation de départ ; aucun taux n’est forcé à 100 %.

Les 102 programmes de remplacement suivent l’ordre des scripts, leurs offsets et le cas partagé 143/144. Ils ne se rejouent pas lors d’un chargement ou au deuxième jour. Le moteur utilise le générateur aléatoire VCMI : un même seed natif est reproductible, mais n’est pas présenté comme identique au seed du programme Windows.

Les six nouvelles banques sont Outpost of Souls 48, Legendary Dragon Utopia 51, Halls of Temptation 64, Royal Treasury 65, Fire Dragon Castle 66 et Ice Dragon Castle 67. Leurs gardiens, états de récompense, équipements combinés et entrées utilisent les données d’origine. Les neuf repaires WoG classiques nécessaires aux cartes ont également des définitions explicites et leurs dispositions de combat.

La Grotte couvre les 45 résultats source et leurs états persistants : cadeaux, transformations, visites à distance, bonus temporaires, revenus quotidiens, protection et Bâtisseur. Celui-ci peut évacuer ou combattre les occupants, démolir, récupérer le Graal et reconstruire dans les neuf factions d’origine ou chez les Goonks. Le panneau indique les coûts, les matériaux et les extensions perdues lors d’une mise en ruine. Les extensions Goonk sans tarif WoG ne produisent pas de récupération inventée.

Les dialogues et la présentation utilisent VCMI/Goonk et une interface tactile. Ils ne reproduisent pas les changements temporaires de texte et d’icônes Windows. Les règles source dormantes restent dormantes : la Dryade 279 ne reçoit pas une charge de démonologie inventée, et les lignes d’expérience masquées par le dernier emplacement actif ne deviennent pas des effets supplémentaires.

Les 6 nouvelles lignes d’expérience des banques et les 17 lignes des habitations ont des admissions distinctes. Les 43 lignes déjà publiées gardent leur identité et leur propriétaire d’exécution. Les capacités nouvelles réutilisent les services existants quand ils conviennent ; les adaptations spécifiques sont limitées aux identités vérifiées. Les bonus étrangers qui partagent un numéro de sort restent distincts.

Le panneau du Bâtisseur est contrôlé en 320×568,568×320,390×844,844×390,768×1024 et 1024×768. Les commandes gardent une hauteur tactile d’au moins 44 px. Des états identiques conservent les éléments DOM et le défilement ; une confirmation n’émet qu’une commande. Les fiches de combat distinguent les troupes ayant la même créature et affichent leurs propres effets.

Les preuves natives et leurs moteurs réellement testés sont conservés dans [adventure167](../outputs/wog-priorities-0.4.147/adventure167/). Les rapports historiques ne sont pas renommés comme des exécutions du dernier moteur. L’[index de la Grotte](../outputs/wog-priorities-0.4.147/adventure167/cave/index.json) et sa revue détaillent les contrôles de sauvegarde et les limites de couverture. Les sauvegardes de test, préférences locales et outils de diagnostic ne font pas partie des données publiées.
