# Données du jeu pour le déploiement de test

Fichiers provenant de l’installation locale indiquée par le propriétaire, intégrés à sa demande explicite. Le manifeste conserve leurs chemins, tailles et empreintes SHA-256. Les contenus sont découpés en morceaux de 4 Mio pour rester sous les limites de fichiers de GitHub et des hébergeurs.

`npm run pack:game-data` régénère ce dossier depuis l’installation locale. `npm run prepare:web` reconstruit les fichiers locaux nécessaires. Le site public télécharge automatiquement les morceaux et reconstitue les fichiers dans le stockage privé du navigateur ; aucune installation ni sélection de fichiers n’est demandée.

Aucune sauvegarde ni configuration personnelle n’est incluse. La carte Goonk est publiée séparément depuis sa version courante.
