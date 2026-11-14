# Port natif des campagnes originales : état réel

Le port complet de la priorité 6 n’est pas terminé. Les quatre campagnes, leurs onze scénarios et Cave of Gerfrex restent désactivés. La version 0.4.170 ajoute un premier raccordement natif à Cave, vérifié sur les parcours décrits ci-dessous. Elle ne constitue pas le port intégral des campagnes.

## Ce qui est implémenté

`scripts/era-bridge/campaigns/native-compiler.mjs` compile les 137 sources des campagnes en onze programmes de carte. Les sources sont ordonnées par première occurrence, puis par index d’événement. Chaque carte partage un seul environnement de variables et de fonctions. La visibilité des fonctions pendant les instructions initiales respecte leur position dans cet ordre. Les archives originales ne sont pas modifiées.

Le parseur strict conserve ses cinq rejets documentés. Un compilateur distinct applique quatre corrections syntaxiques à des sources liées à leurs empreintes, et laisse inactifs seize receivers placés après des titres de déclencheurs commentés. L’instruction initiale indépendante de cette source est conservée. Chaque exception figure dans [le relevé](../outputs/wog-priorities-0.4.147/campaign-runtime/source-exceptions.json). La condition mal formée de Shrubbery est remplacée par le test de son état `v1=1` ; c’est une correction documentée déduite des autres états de cette quête, pas une observation du binaire Windows. Le traitement des receivers détachés est également explicite : leur comportement d’origine n’est pas établi.

Le noyau C++ dans `lib/era/EraCampaignExecutor.h` exécute les variables numériques et textuelles utilisées par les sources, les alias, conditions, fonctions et boucles. Il conserve les paramètres de retour, les variables locales et la position d’exécution pendant une suspension. Les opérations non implémentées sont des erreurs explicites. `IF:R` utilise les dix chiffres de son masque pour remettre certains drapeaux à zéro ; `IF:W-1` sélectionne le héros fourni par l’événement.

`EraCampaignRuntime.cpp` fournit l’entrée native avec initialisation, événement et reprise. Le codec JSON conserve les variables, drapeaux, alias, cadres d’appels et continuations. Il refuse notamment un état lié à un autre programme, les entiers non définis et les dictionnaires à clés dupliquées.

## Raccordement natif de Cave en 0.4.170

`server/era/SourceCampaignProcessor.cpp` raccorde le programme original aux visites d’événements, aux événements globaux et aux événements de château. Ce premier adaptateur admet uniquement les six receivers de Cave : les commandes purement scriptées passent par la VM, et HE, OB, MO, LE, CE et les dialogues IF utilisent les objets et services réels du moteur. Les onze scénarios des campagnes n’utilisent pas encore cet adaptateur.

Le registre généré par `scripts/era-bridge/campaigns/build-native-registry.mjs` reste désactivé. Lorsqu’il est activé dans le test privé, le raccordement exige l’ensemble exact des 22 textes ZVSE de la carte. Une sauvegarde doit également conserver l’identité et l’empreinte du programme. Un titre de carte similaire ne suffit pas à activer un script.

`SourceCampaignChange`, paquet natif 270, réplique les variables, continuations et mutations. Le format de sauvegarde 903 ajoute l’état de campagne à CMap ; les anciens formats 901 et 902 l’initialisent à vide. Une question suspend le script et sa réponse reprend après la commande déjà exécutée. Les requêtes natives sont recréées au chargement : leur identifiant de session n’est pas utilisé comme état persistant.

Le client prend maintenant en charge le message bloquant à un seul bouton, en plus du oui/non. Il conserve l’identifiant natif de la question. La sauvegarde silencieuse est autorisée pendant une question de campagne appartenant au joueur ; les combats restent exclus. Le panneau tactile garde son texte et son défilement pendant le transit de la réponse, bloque les doubles confirmations et permet le défilement vertical des longs récits, en portrait et paysage.

Le chargement H3M est aussi corrigé : les limites d’expérience peuvent consulter les options avant que CGameState ait reçu sa carte. Dans cette phase uniquement, `getSettings()` consulte les options du moteur au lieu de déréférencer une carte absente.

Deux contrats anciens restent explicitement limités aux sources de Cave : `LE:Z4/Z5` active ou désactive les déclencheurs correspondants sans interrompre le corps en cours ; sa nature générique a été rapprochée du répartiteur Z du binaire fourni. `HE:X6` admet la forme historique à quatre arguments présente dans la carte pour les améliorations de créatures. Cette forme n’est pas présentée comme la couverture complète de HE:X des versions ERA modernes.

## Vérifications effectuées

- Compilation des 137 sources des onze scénarios, sans modifier les archives ; vérification des exceptions et de l’ordre des fonctions.
- Tests C++ avec AddressSanitizer et UndefinedBehaviorSanitizer : appels avec paramètres de sortie, boucles, sortie d’itération, calculs Win32 et reprise d’une commande sans réévaluer sa condition.
- Exécution de la fonction originale `FU844` du quatrième scénario de zc4 pour 152 entrées, et du préfixe original de l’événement de la sorcière dans Cave. Ce sont des tests d’instructions, pas des parcours de quête.
- Aller-retour du vrai `JsonNode` du moteur et reprise via l’entrée native après sérialisation, sur Linux avec les en-têtes Boost du moteur ; rejet des états invalides.
- Compilation WebAssembly avec `ninja -j32 html5`. Le moteur 0.4.170 vérifié a l’empreinte `30eaa0a434421010022b7a256bf9be4c0875af9e77ae493bde999c1671b3bb89` et ne contient pas l’observation temporaire utilisée pendant la recherche du blocage H3M.
- 749 tests Node suivis : 715 réussis, 34 ignorés, aucun échec. Le vrai codec JSON passe séparément sous Linux avec ASan/UBSan.
- Cave, dans le moteur natif : objectif du labyrinthe, récupération de la couronne, gardien de quête, choix du levier et poursuite de son récit. Une vraie sauvegarde prise pendant la question est rechargée dans deux sessions séparées : refus et acceptation. Après acceptation, le repaire apparaît au jour 2 et le stock de béhémoths passe de 1 à 13 au jour 3.
- Trois choix de la sorcière avec mutations réelles : paiement de 1000 pièces et pendentif, transformation de deux groupes, transformation de l’armée. La tombe retire réellement le mana et déclenche un combat natif contre 48 zélotes et un archange ; seul son premier tour positif est validé, pas son issue.
- Non-régressions sur les deux cartes Goonk publiées : sauvegarde/rechargement, noms et rôles des joueurs, tours solo/hotseat et premier tour réel de combat. Quatre anciennes sauvegardes 901/902 conservent exactement leur état et poursuivent leurs tours ; elles se réenregistrent en 903 sans acquérir d’état de campagne. Les six options du bridge sont vérifiées activées puis désactivées, y compris les effets en combat et leur sauvegarde.
- Dialogues contrôlés sur sept tailles, de 320×568 à 1180×820, dans Chromium et WebKit ; véritables gestes tactiles Chromium, conservation des éléments DOM et du défilement, une réponse par question.

Ces parcours Cave utilisent un registre activé uniquement dans le navigateur de test, une position de départ du héros déplacée vers la quête examinée et les commandes natives de révélation/déplacement. Ils ne forcent aucun drapeau de quête ni récompense. Ce sont des validations de branches réelles, pas une partie complète de la carte originale. Les archives source ne sont pas réécrites. Les contrôles et limites sont détaillés dans [le relevé 170](../outputs/wog-priorities-0.4.147/campaign-runtime/native-host-170.json). Aucune sauvegarde, préférence locale ou instrumentation temporaire n’est livrée.

## Ce qui empêche encore l’activation

1. Les autres branches de Cave et son parcours complet jusqu’à une victoire native.
2. Les adaptations natives des commandes d’aventure, de combat et de minuterie des onze scénarios des campagnes, et leur raccordement aux événements du jeu.
3. Les dialogues complets de ces scénarios, dont saisie de texte et choix multiples, avec persistance et réplication des réponses et mutations réelles.
4. La correction vérifiée du graphe d’accès de zc1, les transferts entre scénarios, puis les parcours de quêtes, combats, sauvegardes et victoires sur les cartes originales.

Les fichiers incomplets des adaptations précédentes restent conservés dans le répertoire de travail indiqué par le [relevé précédent](../outputs/wog-priorities-0.4.147/campaigns169/README.md). Ils ne sont pas utilisés par ce raccordement. La compilation d’un script et la sérialisation de la VM ne constituent pas une preuve que sa quête ou sa campagne fonctionne dans le jeu.

Les contrats des commandes sont rapprochés de la documentation primaire [IF](https://h3era.github.io/ERM-Help/Rec/IF.htm), [VR](https://h3era.github.io/ERM-Help/Rec/VR.htm), [FU](https://h3era.github.io/ERM-Help/Rec/FU.htm) et [DO](https://h3era.github.io/ERM-Help/Rec/DO.htm), et des sources embarquées dont les empreintes sont conservées par l’importeur.
