# Port natif des campagnes originales : état réel

Le port complet de la priorité 6 n’est pas terminé. Les quatre campagnes, leurs onze scénarios et Cave of Gerfrex restent désactivés. Le moteur de jeu publié reste en version 0.4.169.

## Ce qui est implémenté

`scripts/era-bridge/campaigns/native-compiler.mjs` compile les 137 sources des campagnes en onze programmes de carte. Les sources sont ordonnées par première occurrence, puis par index d’événement. Chaque carte partage un seul environnement de variables et de fonctions. La visibilité des fonctions pendant les instructions initiales respecte leur position dans cet ordre. Les archives originales ne sont pas modifiées.

Le parseur strict conserve ses cinq rejets documentés. Un compilateur distinct applique quatre corrections syntaxiques à des sources liées à leurs empreintes, et laisse inactifs seize receivers placés après des titres de déclencheurs commentés. L’instruction initiale indépendante de cette source est conservée. Chaque exception figure dans [le relevé](../outputs/wog-priorities-0.4.147/campaign-runtime/source-exceptions.json). La condition mal formée de Shrubbery est remplacée par le test de son état `v1=1` ; c’est une correction documentée déduite des autres états de cette quête, pas une observation du binaire Windows. Le traitement des receivers détachés est également explicite : leur comportement d’origine n’est pas établi.

Le noyau C++ dans `lib/era/EraCampaignExecutor.h` exécute les variables numériques et textuelles utilisées par les sources, les alias, conditions, fonctions et boucles. Il conserve les paramètres de retour, les variables locales et la position d’exécution pendant une suspension. Les opérations non implémentées sont des erreurs explicites. `IF:R` utilise les dix chiffres de son masque pour remettre certains drapeaux à zéro ; `IF:W-1` sélectionne le héros fourni par l’événement.

`EraCampaignRuntime.cpp` fournit l’entrée native avec initialisation, événement et reprise. Le codec JSON conserve les variables, drapeaux, alias, cadres d’appels et continuations. Il refuse notamment un état lié à un autre programme, les entiers non définis et les dictionnaires à clés dupliquées.

## Vérifications effectuées

- Compilation des 137 sources des onze scénarios, sans modifier les archives ; vérification des exceptions et de l’ordre des fonctions.
- Tests C++ avec AddressSanitizer et UndefinedBehaviorSanitizer : appels avec paramètres de sortie, boucles, sortie d’itération, calculs Win32 et reprise d’une commande sans réévaluer sa condition.
- Exécution de la fonction originale `FU844` du quatrième scénario de zc4 pour 152 entrées, et du préfixe original de l’événement de la sorcière dans Cave. Ce sont des tests d’instructions, pas des parcours de quête.
- Aller-retour du vrai `JsonNode` du moteur et reprise via l’entrée native après sérialisation, sur Linux avec les en-têtes Boost du moteur ; rejet des états invalides.
- Compilation WebAssembly avec `ninja -j32 html5`. Le noyau n’étant pas encore raccordé aux événements du jeu, l’élimination du code inutilisé laisse le WASM public identique à celui de 0.4.169 (`a787c46e666f999a1a0c6e6bca766d91142ba7bed506f7741d54a13158518248`). Aucun changement d’interface n’est publié par ce lot.

## Ce qui empêche encore l’activation

1. Les adaptations natives des commandes d’aventure, de combat et de minuterie, et leur raccordement aux événements du jeu.
2. Les dialogues complets de ces scénarios, dont saisie de texte et choix multiples, avec persistance et réplication des réponses et mutations réelles.
3. La correction vérifiée du graphe d’accès de zc1, les transferts entre scénarios, puis les parcours de quêtes, combats, sauvegardes et victoires sur les cartes originales.

Les fichiers incomplets des adaptations précédentes restent conservés dans le répertoire de travail indiqué par le [relevé précédent](../outputs/wog-priorities-0.4.147/campaigns169/README.md). Ils ne font pas partie du noyau vérifié. La compilation d’un script et la sérialisation de la VM ne constituent pas une preuve que sa quête ou sa campagne fonctionne dans le jeu.

Les contrats des commandes sont rapprochés de la documentation primaire [IF](https://h3era.github.io/ERM-Help/Rec/IF.htm), [VR](https://h3era.github.io/ERM-Help/Rec/VR.htm), [FU](https://h3era.github.io/ERM-Help/Rec/FU.htm) et [DO](https://h3era.github.io/ERM-Help/Rec/DO.htm), et des sources embarquées dont les empreintes sont conservées par l’importeur.
