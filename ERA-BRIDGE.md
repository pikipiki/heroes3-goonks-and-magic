# Bridge ERA → VCMI

Ce bridge réutilise les données et instructions originales de TUM, puis fait exécuter leurs équivalents par VCMI. Les DLL x86 ne sont pas chargées dans le navigateur. Les références mémoire ERA sont des entrées à adapter, jamais des adresses autorisées dans VCMI.

## Ce qui fonctionne

- Lecture contrôlée des archives LOD/PAC, décompression et identité SHA-256.
- Lecture de `Crtraits.txt` sans décaler les identifiants lorsqu’une description contient des lignes ou des guillemets incorrects. Les lignes de statistiques invalides restent identifiées et bloquent leur émission.
- Compilation stricte des propriétés Amethyst prises en charge : niveau, faction explicitement résolue, haine ciblée, retour après attaque et régénération inconditionnelle. Chaque clé consommée conserve sa provenance. Les adaptateurs supplémentaires doivent déclarer leurs clés et leurs preuves.
- Compilation des affectations ERM **inconditionnelles** `MA:U` et `UN:T` vers les gestionnaires natifs de créatures et de villes. Les tableaux complets existants sont nécessaires ; les tableaux creux, références manquantes et cycles d’amélioration sont refusés.
- Conversion des états déclaratifs de banques TUM vers les gardiens et récompenses VCMI. Les poids doivent être représentables exactement ; les modèles graphiques, identifiants et dispositions doivent être fournis explicitement. Les scripts de remplacement d’objets au premier jour ne sont pas inclus dans cette conversion.
- Service natif de régénération probabiliste dans `BattleFlowProcessor.cpp`, avec le RNG autoritaire du serveur et les paquets de soin VCMI. Il ne ressuscite pas une unité morte. Une politique absente conserve le traitement VCMI existant. Le service actif traite une politique de créature statique ; les changements Amethyst spécifiques à une pile restent à adapter. Les clés de politique inconnues sont rejetées.

`mod/tum-era/content/config/era-bridge-runtime.json` relie la régénération du Red Bones Dragon à ce service. Il est produit depuis les deux propriétés originales de `224.cfg`. Cette portée est déclarée comme **service de régénération**, sans prétendre traduire le reste de cette créature ou du plugin.

## Commandes

Depuis la racine du projet :

```sh
npm test
node scripts/era-bridge/cli.mjs audit /chemin/Third-Upgrade-Mod-Full outputs/era-bridge-audit.json
node scripts/era-bridge/cli.mjs regeneration /chemin/Third-Upgrade-Mod-Full/Data/Creatures/224.cfg tum-era:redBonesDragon mod/tum-era/content/config/era-bridge-runtime.json
```

L’audit retourne **2** lorsque la compatibilité intégrale reste incomplète. Il n’active aucun mod. Le générateur de service affiche également les autres propriétés du fichier source, qu’il ne consomme pas.

Le module `compileAmethystCreature` échoue s’il reste une propriété sans adaptateur vérifié. Le service natif probabiliste est une capacité distincte : il ne faut pas substituer 25 PV certains à une régénération de 50 PV à 50 %.

## État de la compatibilité complète

**Ce bridge ne prend pas encore en charge tout TUM ERA 3.5.** L’inventaire vérifié contient 363 lignes de créatures, 240 fichiers de configuration de créatures, 87 configurations d’artefacts, 34 banques déclaratives et 109 scripts ERM. Aucun fichier de créature complet ne passe encore le compilateur strict par défaut : les flags, les effets numériques et les hooks propres à ERA demandent des adaptateurs supplémentaires.

La bibliothèque C++ contient aussi des fonctions testées pour la formule de PV de renaissance et le transfert attaque/défense d’Antichrist. **Ces deux fonctions ne sont pas encore reliées aux callbacks du moteur.** Elles ne sont pas annoncées comme capacités actives. Les charges, l’état « déjà utilisé », les effets visuels et le calendrier des tirages devront être vérifiés à leur intégration.

L’adaptation publiée précédemment du Red Bones Dragon utilise toujours les capacités du port WoG pour le vieillissement, la peur et le vol de vie. Leur équivalence exacte avec les hooks ERA n’est pas encore démontrée ; ce bridge ne transforme pas cette adaptation en port complet par déclaration.

## Sources et vérification

- TUM Full : commit `120d8a6ff8cfed7453a09e7f9ce7c63bb3fed404`, version déclarée 3.5.0.
- Sources Amethyst/Emerald : `https://gitlab.com/Knightmarevive/_h3era_plugins_`, commit `99e949d9d910556e57d19914b41976d5a07da577`, notamment `Amethyst2/amethyst/tables.cpp`.
- Référence ERA officielle : `https://github.com/ERA-Projects/era-project-eng`. L’exécutable inspecté porte l’empreinte SHA-256 `451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181`.
- REA : identification du plugin Amethyst x86 (`ev_e6d09e01efb56f82b4550d14acbf0358c23d9088b68bd07170e659dfcd37adec`) et analyse statique de la branche ERA `0x75de21` (`ev_fe169f11b4f3dd92e63e1e5a5bf999aa3153354190de36d1f9d43d183d7fdfee`). L’analyse statique n’est pas une observation du jeu Windows exécuté avec ses plugins.

Les tests couvrent les identités de ressources, les erreurs de configuration, les probabilités exactes, les références manquantes, les cycles, les récompenses et les limites numériques. Les helpers C++ sont compilés avec AddressSanitizer et UndefinedBehaviorSanitizer. La compilation WebAssembly doit être vérifiée avec `ninja -j32 html5` avant publication d’un moteur modifié.

Validation native observée : `outputs/era-regeneration-native-e2e.json`. Dans deux combats isolés contre des squelettes, une politique à 0 % laisse le dragon à 359/400 PV au tour 4 ; une politique à 100 % le rétablit à 400/400 PV. Le test neutralise le commandant optionnel dans son propre préréglage. L’API de combat expose les PV courants et maximaux en lecture seule. La version native du bridge est vérifiée au chargement et lors de la construction du site, y compris avec les exports minifiés Emscripten.

La validation finale comprend 121 tests unitaires et une nouvelle compilation du moteur avec les commandes de combat 0.4.20 conservées.
