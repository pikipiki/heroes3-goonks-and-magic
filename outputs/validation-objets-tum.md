# Validation des objets TUM dans VCMI/WASM

22 objets ont passé une visite réelle dans le navigateur : 13 banques et 9 logements. Les tests ont vérifié les gardes, les ressources et créatures reçues, le recrutement et les coûts, puis une seconde visite des banques sans nouveau paiement. Les 9 logements ont été comparés aux identités et quantités de gardes originales ; 4 sont gardés et 5 ne le sont pas. Les cases occupées par les gardes ne se superposent pas.

Deux combats supplémentaires ont vérifié Dread Skipper : une résistance magique de 100 sur la cible principale bloque Sorrow pour les deux cibles ; avec une résistance de 0, les deux cibles perdent exactement deux points de moral.

Les tests de ce premier lot appliquaient avant le démarrage natif une correction candidate des récompenses Mithril 43/44, dans le système de fichiers isolé du navigateur. Les rapports indiquent explicitement cette intervention : ils ne prouvent pas à eux seuls que les anciens fichiers publiés contenaient déjà la correction. Le format publié doit maintenant être une liste native de ressources identifiées, sans ce correctif de test.

Les empreintes du fichier HTML, du manifeste et du moteur fournies dans tum-preview-after-run.json ont été relevées après les essais. Elles identifient les octets alors servis ; elles ne constituent pas une capture antérieure aux essais. Le nouveau harness portable capture ces empreintes avant le lancement et vérifie le nom du runtime réellement utilisé par chaque page.

Les tests utilisent le sélecteur de sauvegardes normal dans des contextes isolés. Ils ne suppriment aucune sauvegarde. Les créatures de test sont contrôlées ; les gardes et récompenses des objets restent ceux des configurations testées. Le code n’active pas les objets encore incomplets.

Les huit sons originaux de quatre banques ont également été retrouvés, extraits et comparés octet pour octet aux archives ERA. Leur lecture audio effective dans le navigateur reste à vérifier séparément ; les visites ci-dessus ne mesurent pas la sortie audio.

La banque 59 et cinq logements WoG supplémentaires sont préparés avec leurs acteurs réellement enregistrés et les graphismes originaux vérifiés. Ils forment un lot séparé et ne sont pas inclus dans les 22 résultats verts ci-dessus avant leur propre passage navigateur.

Limite du premier collecteur de diagnostics : ses listes vides ne prouvent pas un démarrage sans avertissement d’identifiant. Le filtre initial ne reconnaissait pas les deux formulations natives « Failed to resolve identifier » et « Identifier … does not exist ». Une passe stricte ultérieure a révélé un nom de terrain incorrect dans trois configurations et une erreur de casse de spellBook dans la fixture. Les résultats fonctionnels historiques restent décrits ci-dessus ; la validation d’un démarrage propre doit utiliser les rapports stricts après correction.
