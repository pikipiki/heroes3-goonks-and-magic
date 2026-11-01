# Bridge TUM ERA 3.5 → VCMI/WebAssembly

Le bridge convertit les données originales en contenu VCMI et exécute les mécanismes particuliers dans le serveur natif du jeu. Le navigateur n'exécute pas les DLL Windows. Les instructions qui accèdent à une adresse mémoire ERA nécessitent un adaptateur identifié ; elles ne sont jamais appliquées à la mémoire de VCMI.

## Contenu intégré

Le port existant Wrath of the Creators conserve les troisièmes évolutions des neuf villes. Le complément TUM ajoute actuellement les quatrièmes évolutions de Castle, Inferno, Necropolis, Conflux et Stronghold, leurs chaînes d'amélioration et leurs coûts ERA. Les autres quatrièmes évolutions restent à fermer avant activation. Les structures de ville réutilisent les graphismes des bâtiments avancés existants ; les icônes des cinq halls utilisent le cadre77 des archives originales, vérifié dans le moteur.

Le complément charge douze créatures issues de TUM, 56 artefacts, 28 objets de carte et 234 profils de progression d'expérience. Les portraits utilisent l'index original plus les deux cadres réservés des archives, avec vérification du nom du cadre.

Les services reliés au moteur comprennent :

- Régénération probabiliste, renaissance avec charges et état « déjà agi », rage d'Antichrist, enchantements persistants et pétrification différée.
- Red Bones Dragon : vol de vie source à100%, vieillissement intrinsèque et sélecteur de vieillissement lié au rang ; suppression du vieux déclenchement approximatif à50%.
- Inversion des dégâts magiques avec la division signée originale et conservation des unités supplémentaires après combat.
- Progression d'expérience, seuils de rang, transfert lors des déplacements de créatures, perte d'expérience des améliorations et règles des sorts d'expérience adaptés.
- Transformation des cadavres et du transformateur de squelettes avec une table commune ; les créatures propres aux autres mods conservent les règles natives quand elles n'ont pas d'identité ERA.
- Revenus quotidiens : maximum entre piles pour chaque ressource et taxe par créature ; conversions d'armée des artefacts dans l'ordre des emplacements.
- Prière et moral des armées angéliques, calculés depuis l'armée d'origine.
- Résistance aux sorts selon les probabilités originales, file commune des effets après attaque et emplacements de combat conservés lors du remplacement des invocations.
- Réduction de défense du Béhémoth ancestral avec l'arrondi original ; effets visuels de frappe importés du mod Hit Landing Effects.
- Banques : quatre états originaux, gardiens, dispositions, récompenses, graphismes par état et paramètres de génération de carte. Les récompenses non résolues bloquent l'import entier.
- Mithril : ressource native supplémentaire, coûts, revenus et affichage mobile avec l'icône du mod propriétaire.

Les services nécessaires aux prochaines créatures, dont le blocage physique et le calcul combiné Poison/Vieillissement, sont vérifiés séparément avant activation de leur contenu. Une fonction compilée sans créature déclarée ne constitue pas une capacité disponible dans une partie.

## Validation

`npm test` vérifie les importeurs stricts et les règles portables. Les tests C++ utilisent AddressSanitizer et UndefinedBehaviorSanitizer. Toute modification du moteur exige `ninja -j32 html5`, puis la préparation et la vérification du site.

Les scénarios navigateur utilisent le vrai moteur WebAssembly, une carte modifiée uniquement dans leur contexte de test et les commandes de jeu normales. Ils neutralisent le commandant optionnel dans leur propre préréglage. Ils ne suppriment aucune sauvegarde de l'utilisateur.

L'ABI native est la version 2. La construction du site décode la fonction exportée du fichier WASM pour vérifier sa valeur ; la présence d'un export ne suffit pas.

```sh
npm test
npm run prepare:web
npm run build:web
npm run verify:web
TUM_SOURCE=/chemin/Third-Upgrade-Mod-Full node --test tests/era-bridge-objects.test.mjs
node scripts/era-bridge/cli.mjs audit /chemin/Third-Upgrade-Mod-Full outputs/era-bridge-audit.json
```

Le test audio du moteur final couvre47démarrages de musique,22allers-retours ville/carte,32attaques sonorisées, une suspension/reprise audio et une mesure de signal réelle, sans erreur. Les mutations SDL_mixer sont sérialisées sur le thread navigateur ; les sons terminés sont libérés après le rappel audio.

## Couverture restante

**La compatibilité complète avec TUM ERA 3.5 reste inachevée.** L'inventaire source comprend 363 lignes de créatures, 240 configurations numériques de créatures, 87 configurations d'artefacts, 34 banques déclaratives et 109 scripts ERM. Ces totaux ne sont pas des nombres de fonctionnalités terminées.

Un inventaire révèle aussi74identités déjà enregistrées avec des écarts de statistiques de base. Ces écarts sont examinés avec les bonus intrinsèques avant toute correction.

Les créatures supplémentaires, artefacts spéciaux et objets qui dépendent d'un mécanisme non adapté restent exclus du contenu actif. Les scripts conditionnels, événements de carte, options ERA et écritures mémoire ne disposent pas d'un interpréteur ERM complet. Les capacités héritées du port WoG, notamment les comportements de peur, ne démontrent pas à elles seules une équivalence exacte avec ERA. Les modes d'expérience optionnels autres que le mode source adapté ne sont pas annoncés comme pris en charge.

L'audit retourne le code 2 tant que la compatibilité intégrale est incomplète. Il n'active aucun contenu et ne remplace pas cette condition par un avertissement silencieux.

## Provenance

- TUM Full : `https://github.com/VMaiko1634/Third-Upgrade-Mod-Full`, version 3.5.0, commit `120d8a6ff8cfed7453a09e7f9ce7c63bb3fed404`.
- Port VCMI : `https://github.com/vcmi-mods/third-upgrades`, version 1.1.12, commit `00c3e7e8d129b09a589e856854d8b0e4999411d4`.
- Sources Amethyst/Emerald : `https://gitlab.com/Knightmarevive/_h3era_plugins_`, commit `99e949d9d910556e57d19914b41976d5a07da577`.
- Référence ERA : `https://github.com/ERA-Projects/era-project-eng`, commit `3785413e4dceb07b17ff2b52b264e960b7ce51b3` ; SHA-256 de l'exécutable : `451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181`.
- Plugin livré Amethyst : SHA-256 `82bd8174c92aa18c13b865d0a179865aa667c0d40e075760dfccb2984fe19180`.

Les conclusions tirées de la DLL et de l'exécutable sont des observations statiques. Aucun essai Windows ERA avec ses plugins n'a été exécuté dans cet environnement. Les essais de jeu rapportés concernent VCMI/WebAssembly.
