# Options WoG par partie

Dans **Nouvelle partie → Options WoG**, chaque règle propose **Carte / Oui / Non**. « Carte » conserve le profil installé et les réglages de l’auteur. Un choix explicite concerne uniquement la partie qui va commencer ; il est enregistré avec la sauvegarde. Il ne modifie aucun fichier de mod et n’altère pas une partie déjà commencée. Les choix ne sont pas exposés dans les parties en réseau hébergées.

| Règle | Effet d’un choix explicite |
|---|---|
| Commandants | Création ou absence des commandants des héros compatibles. |
| Expérience des troupes | Gain, rangs et capacités d’expérience activés ou désactivés ; les capacités intrinsèques restent distinctes. |
| Transformations de la carte | Exécution ou omission des102 programmes de remplacement au premier jour. Les objets placés directement par l’auteur restent utilisables. |
| Deux constructions par jour | Limite d’une ou deux constructions par ville et par jour ; coûts et prérequis habituels conservés. |
| Quatrièmes évolutions | Disponibilité de la quatrième variante de niveau7 dans les neuf villes originales. |
| Huitièmes familles | Disponibilité du huitième rang dans les neuf villes originales. |

Les deux choix de roster correspondent aux options source300/301. Ils ne retirent pas les créatures des habitations sur la carte, des armées ou des autres factions. Les familles Goonk et la réserve indépendante du Portail d’invocation sont préservées. Les variantes appartenant à d’autres mods ne sont pas supprimées.

La référence est le pack TUM3.5 fourni. Les52 identifiants d’options référencés dans ses scripts ne représentent pas52 fonctions manquantes : dix sont désactivés explicitement par TUM pour éviter des cumuls, plusieurs dépendent de packs externes et904/905 sont des contrôles de diagnostic. Le catalogue garde ces distinctions dans `source-option-references.json`. Aucun comportement n’est inventé pour la constante302, non consommée dans cette référence.

Validation : deux parties réelles avec les six réglages OFF puis ON, création des commandants, gain d’expérience après un combat, recrutement4/8, construction d’un second bâtiment et sauvegardes/rechargements. Quarante Tours des archers produisent0 remplacement avec195OFF et23 avec195ON dans le témoin retenu, en conservant les probabilités d’origine. Une sauvegarde publique168 se recharge également. Les panneaux sont vérifiés en320×568,568×320,390×844,844×390,768×1024 et1024×768, avec gestes tactiles réels, cibles d’au moins44px et100 mises à jour sans reconstruction, perte de focus ou saut du défilement. Ces tests navigateur ne constituent pas un essai sur un iPad physique.

Preuves : [validation native](../outputs/wog-priorities-0.4.147/options169/native-validation.json), [interface](../outputs/wog-priorities-0.4.147/options169/mobile-ui-validation.json), [références source](../outputs/wog-priorities-0.4.147/options169/source-options-review.md).
