# Vérification du 14 novembre 2026

Conclusion : aucun indicateur de malware identifié dans les contrôles décrits ci-dessous. Il ne s’agit pas d’une garantie d’absence de virus, de spyware ou de vulnérabilité, ni d’un audit formel de chaque ligne du moteur.

## Clone OpenBW

Le clone local provient de `https://github.com/heiner/openbw.git`, au commit `469d2037e2fd03085dac4729912f4188bc2a778b`. Son arbre de travail est propre. Les 407 fichiers présents dans notre snapshot intégré correspondent octet pour octet aux fichiers du clone. Son répertoire de hooks ne contient que les exemples Git désactivés ; aucun `core.hooksPath` local ni lien symbolique suivi n’a été trouvé.

ClamAV 1.5.4, signatures quotidiennes 28183 du 14 novembre 2026 : **942 fichiers analysés, zéro fichier infecté** pour le clone complet et l’intégration, sans les dépendances npm locales. Le journal est conservé dans `evidence/security/openbw-source-antivirus.txt`.

La revue ciblée a couvert les scripts shell/Python de construction et de téléchargement, le workflow amont, les points d’accès réseau et les interfaces du WASM utilisé. Aucun mécanisme de persistance système, collecte d’identifiants ou exfiltration n’a été identifié dans ces contrôles. Le code amont contient des fonctions réseau explicites : téléchargement de MPQ/cartes, WebRTC avec STUN Google, relais WebSocket et pont natif WS/UDP pour le multijoueur. Leur présence n’est pas à elle seule un signe de spyware.

Le build publié supprime les téléchargements externes, les transports WebRTC/STUN/WebSocket et les bots de son hôte JavaScript généré. Les sources amont restent inchangées pour conserver leur provenance. Les scripts de bots téléchargent des dépendances supplémentaires, dont certaines non épinglées ; ils n’ont pas été exécutés et ces dépendances ne sont pas intégrées. Le workflow amont n’est pas utilisé pour notre build.

Le module WASM utilisé a été compilé localement avec le SDK WASI officiel épinglé, et non récupéré comme binaire opaque du fork. Il n’importe aucune fonction de socket ou d’exécution de processus. L’hôte refuse l’ouverture et la lecture du système de fichiers WASI ; les lectures du jeu passent par les tableaux MPQ fournis par le navigateur. Ces restrictions ne remplacent pas une recherche de vulnérabilités dans les parseurs.

## Données StarCraft retenues

Les anciens fichiers provenant de scmJS ont été supprimés. Après examen des CD Internet Archive, le propriétaire a fourni et autorisé l’adresse directe de Blizzard : `http://download.blizzard.com/pub/starcraft/StarEdit/StarEdit.zip`. Ce lien figure dans l’[annonce officielle StarEdit](https://us.forums.blizzard.com/en/starcraft/t/public-staredit-download/457).

Le téléchargement HTTPS a été refusé par curl : le certificat ne correspondait pas au nom du domaine. La validation TLS n’a pas été contournée. Le téléchargement a utilisé l’URL HTTP fournie ; ce transport ne garantit pas cryptographiquement l’authenticité du contenu. Aucune empreinte signée par Blizzard n’a été trouvée. Les empreintes calculées assurent ensuite l’intégrité des données publiées, pas leur innocuité initiale.

Seuls `StarDat.mpq`, `BrooDat.mpq` et `patch_rt.mpq` sont intégrés, par morceaux de 4 Mio dans `game-data/starcraft/`. Aucun EXE, DLL ou installateur du téléchargement n’a été exécuté ou publié. Le manifeste et `game-data/starcraft/AUDIT.json` enregistrent les tailles, SHA-256, source et limites des contrôles.

ClamAV a analysé le ZIP complet et les trois MPQ extraits : **4 fichiers, zéro détection**. Une analyse complémentaire de **803 membres décompressés, zéro détection**, couvre les noms disponibles et décodables. L’extraction interne reste partielle : liste de noms incomplète et 208 échecs de décompression dans BrooDat, principalement les sons aux codecs non pris en charge. Les contrôles ne prouvent donc pas une absence absolue de contenu malveillant. Les journaux sont dans `evidence/security/`.

## Protection de l’application et essais

Le navigateur télécharge uniquement les morceaux de même origine, vérifie chaque taille/SHA-256 puis l’archive complète avant stockage. Les données conservées sont revérifiées au chargement. L’ancien IndexedDB StarCraft est supprimé ; les sauvegardes Heroes restent séparées. Un morceau altéré bloque le lancement. Aucun fichier de jeu n’est téléversé.

Le bundle Netlify séparé restreint les connexions à sa propre origine et interdit caméra, microphone et géolocalisation. Le manifeste est revalidé à chaque chargement ; les morceaux sont adressés par empreinte. Les éléments de diagnostic restent dans les tests et ne sont pas ajoutés au produit.

Les tests Chromium vérifient le téléchargement automatique sur téléphone, le cache après rechargement, la suppression effective de l’ancienne base et le refus d’un morceau modifié. Une vraie partie a aussi été exécutée avec ces MPQ Blizzard : les deux moteurs démarrent, les événements traversent la passerelle, un SCV est produit, déplacé puis une perte réelle est observée. Le transfert de cette perte vers une armée VCMI reste non implémenté.

Cette conclusion vaut pour ce snapshot et ces fichiers précis. Elle ne couvre pas les mises à jour futures, tous les chemins de code ni l’état global du système de l’utilisateur.
