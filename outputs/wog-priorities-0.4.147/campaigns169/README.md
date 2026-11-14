# Priorité6 : cartes et campagnes originales — non terminée

Suite du travail : [noyau natif, compilation des137 sources et limites d’activation](../../../docs/wog-original-campaign-runtime.md). Le présent relevé conserve l’état du parseur strict initial ; les corrections de sources sont appliquées par un compilateur distinct et consignées individuellement.

Périmètre disponible : quatre campagnesVCMP, onze scénariosVMAP et la carte originale **Cave of Gerfrex**. Les empreintes sont conservées dans `inventory.json` et dans l’importeur strict. Les campagnes contiennent137 sources embarquées ; Cave en contient22. Le relevé général trouve808 déclencheurs et6690 commandes, sur35 noms de receivers (casse source conservée dans le relevé).

Le port des quêtes n’est **pas terminé** et aucun de ces scénarios n’est activé par ce lot. Le sous-mod original conserve `keepDisabled:true`. Les noms des fichiers et leurs conditions de victoire natives ne suffisent pas à établir que leurs histoires sont jouables.

L’importeur et le parseur vérifiés sont dans `scripts/era-bridge/campaigns/`. Ils respectent l’ordre des événements par première occurrence puis index, et les textes entre accents circonflexes. Le lecteur ZIP reste dans le processus JavaScript et vérifie les tailles, méthodes de compression et CRC de chaque membre ; il ne lance aucun exécutable. La compilation syntaxique n’exécute pas les scripts.132 des137 sources de campagnes sont actuellement parsées ; cinq restent explicitement non prises en charge. Ce sont des limites du parseur courant, pas une preuve que le moteur original rejette ces sources. Le rapport `parser-review.json` conserve les erreurs et empreintes exactes, sans correction silencieuse. Les22 sources de Cave sont parsées en48 blocs et une instruction initiale.

Des problèmes de graphe sont également relevés danszc1 : le troisième scénario dépend de l’indice3 hors bornes, le deuxième de son propre indice2. Ils doivent être rapprochés de la référence originale avant une modification des conditions d’accès.

À terminer pour publier la priorité6 :

1. Hôte natif complet pour les formes de commandes requises, incluant événements d’aventure et de bataille, fonctions, boucles et minuteries.
2. Dialogues avec reprises fiables ; les réponses textuelles du Sphinx ne peuvent pas être remplacées par une simple réponse numérique.
3. État persistant et réplication des mutations, sauvegardes/rechargements et continuités entre scénarios.
4. Résolution documentée des syntaxes non encore prises en charge et des conditions d’accès.
5. Parcours de référence jusqu’aux victoires réelles, puis activation des scénarios validés.

Les agents chargés du port natif ont été interrompus par leur limite d’usage. Leurs13 fichiers de travail incomplets ont été conservés sous `work/downloads/wog-port169/campaigns-in-progress/`, avec un manifeste d’empreintes. Ils ne sont pas liés au moteur publié et ne sont pas présentés comme exécutables. Aucune sauvegarde ni aucun identifiant n’a été ajouté au dépôt.
