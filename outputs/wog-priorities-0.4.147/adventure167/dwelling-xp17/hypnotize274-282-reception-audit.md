# Audit statique XP274/282 — réception Hypnose60

Ce document conserve une lecture indépendante du routage C++ courant. Aucun moteur, donnée de combat, rapport natif ou navigateur n’a été modifié pour cet audit. Ce n’est pas une nouvelle exécution native.

Dans la fixture décrite — héros avec SP1, Wisdom expert mais aucune maîtrise de l’école d’Hypnose ni correction spécifique du seuil, cible1×40PV maximum — l’absence du proc est attendue. Le filtre de réception calcule `SP ×25 + {10,10,20,50}[maîtrise réelle]`, soit35PV. Il compare ce seuil aux **PV maximum complets** (`count ×maxHealth`), pas aux PV restants après l’attaque. Une cible40PV reste donc inadmissible après plusieurs coups à1dégât.

La maîtrise3 portée par le code XP `a` est celle de l’application. Elle ne remplace pas la maîtrise réelle du héros utilisée par le query d’éligibilité. Le pouvoir manuel avancé des Hypnotists est un autre chemin ; son acceptation ne démontre pas que ce proc devrait accepter la même cible. Wisdom expert ne donne aucune maîtrise d’école via `getSpellSchoolLevel`.

| Fixture | Seuil sans correction spécifique | Résultat du seul filtre PV |
| --- | ---: | --- |
| SP1, école0, cible1×40PV max |35 |Refus |
| SP1, école0, cible1×30PV max |35 |Acceptation |
| SP1, école0, cible1×35PV max |35 |Acceptation inclusive |
| SP2, école0, cible1×40PV max |60 |Acceptation |

Les autres conditions de réception, immunités et jets de proc gardent leurs règles normales. À vrai rang10,274 a60% et282 a95% avant le query ; ces chances ne peuvent pas contourner un seuil de réception nul.

La chaîne statique ne révèle pas de perte de la ligne : le policy dwelling reconnaît exactement la provenance ;274/282 participent à l’enrôlement indépendant au début du combat ; le hook After est appelé ; le rang vient de `actor->base->getExpRank()` ; le routeur traite `a` après l’attaque et appelle `queryXpTimed60` avant d’appliquer le sort. Aucun changement moteur n’était justifié par cette fixture40PV. La validation native distincte réalisée par Six a ensuite observé274 au premier seed avec30PV maximum ; son rapport de gameplay reste la preuve native, distincte du présent audit.

Empreintes SHA256 et lignes examinées (lecture finale de cet audit) :

| Fichier | Lignes | Lecture | SHA256 |
| --- | --- | --- | --- |
| `work/vcmi-wasm/lib/era/EraSourceDwellingXpRows.h` |6,9|274/282: a#60, rang10=60/95%, pas de propriétaire historique|`6bd8c57d8d247ed610f5aebba86faa65e92a3a38753bdeb880000dad8bac5622`|
| `work/vcmi-wasm/lib/era/EraSourceXpAdmission.h` |47–49|sourceXpAnyOwns inclut le cohort dwelling et son marqueur indépendant|`b756df02afe6c7043ba3d59fe59156316265671781f85be1e6a66b21152a0e5e`|
| `work/vcmi-wasm/lib/era/EraSourceDwellingXpAdmission.h` |51–57|Owns exact et participants274/282|`852d9816627cef93581ae34cf288381511b50b992df4b567970e0a5db0a4357f`|
| `work/vcmi-wasm/server/era/EraSourceXpAdmissionRuntime.h` |8–22|Enrôlement des acteurs et cibles au début du combat|`4c00d0b114164012cd88a0e1898869332293af401597fa5a61b5ea4d90c6dec4`|
| `work/vcmi-wasm/server/battles/BattleFlowProcessor.cpp` |172|Appel initial du service admission|`b9f37463cf1eb56b88d0a66abf1cacc8a5a84ca83c4e09ea7a5ae8eabf82a9cf`|
| `work/vcmi-wasm/server/battles/BattleActionProcessor.cpp` |1437–1448|Hook XP After après attaque physique|`acd7b9ed7d7c0ea5e2fa3d0746ddb1877d2e8dbde6e5ba850f89bbbc32a8803d`|
| `work/vcmi-wasm/server/era/EraSourceExperienceRuntime.h` |54–61,120–150|Query timed, rang réel du stack de base et dispatch dwelling|`9125523114bf33bbc330a41598a596a4122bdf47be40a6c9964975884ea0d9b3`|
| `work/vcmi-wasm/lib/era/EraOrderedExperienceRule.h` |49–52,75–95|a=After, maîtrise3 à l’application ; chance puis réception|`4f9e7bb6e4996e0a9eaeb04d228f120dc86c30ba753271bda3d7b59a1b9ea528`|
| `work/vcmi-wasm/server/era/EraXpTimed184Runtime.h` |79–92|Seuil Hypnose fondé sur SP/maîtrise réels du héros query-side|`c8b3a9cdabe83381a395e45c8b3eff9e33a3cd351c04217acb5f8f918e45ff42`|
| `work/vcmi-wasm/lib/era/EraHypnotizeHealth.h` |8–15|Produit count×maxHealth signé32|`ae9c9e2d2de9f1fbf379e0d226d1342c540d1d19f73b34631d8229a9948639fd`|
| `work/vcmi-wasm/lib/mapObjects/CGHeroInstance.cpp` |798–817|Maîtrise réelle des écoles du sort ; Wisdom ne fixe pas ce niveau|`69579380cb87252332a2af8e67780e495aea75868c463d2ee45e05dacea157a0`|
| `work/vcmi-wasm/lib/era/EraExperienceAttackSpells.h` |108–140|Correction spécifique du seuil ; ne confond pas query et application|`037feaba0c7089c25a9315d321402f90bd8dcd66c4202f10192036d20ea1a69e`|
