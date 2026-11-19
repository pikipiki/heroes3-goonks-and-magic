# Prévisions discrètes de pertes en combat

L’option **Estimation des pertes ennemies / Enemy casualty estimates** est
activée par défaut et conservée sur l’appareil. Elle masque/affiche les
annotations dans les vues Classic, rapprochée et Vertical sans changer le
cadrage, les animations, les compteurs d’effectif ou les zones tactiles.

Une annotation `−2–5` représente les unités de la cible qui pourraient mourir
si la troupe actuellement active lui porte une frappe. Les frappes supplémentaires ne sont pas cumulées. Elle utilise l’estimateur natif du
tooltip de combat, sans attaque simulée ni consommation de hasard. Les effets
aléatoires ne sont pas inclus. Avant choix d’une direction, l’intervalle de
mêlée englobe les positions d’attaque légales, y compris les deux cases d’une
créature large. Il ne représente pas les pertes de riposte de l’attaquant.

Le pont publie `attackLosses: {actor, min, max}` seulement pendant une décision
de combat manuelle pour une cible ennemie légalement attaquable. Le rendu
refuse les données d’une ancienne troupe active, les intervalles invalides,
les tours adverses, l’autocombat, les animations et la visée d’un sort. Une
prévision absente ne signifie pas zéro perte.

Les annotations canvas utilisent la typographie et les couleurs du thème
commun, une bordure fine et un trait vers la case cible. Le placement réserve
les silhouettes des deux camps et leurs compteurs, puis cherche un rectangle
libre à proximité. Il reste stable lorsque les données ne changent pas. Si
aucun rectangle lisible ne tient, l’annotation est omise plutôt que peinte sur
une créature ; la description accessible conserve la prévision. Les nombres
ne sont ni tronqués ni réduits pour tenir dans une case.

Défendre remplace Magie dans les commandes principales. Le menu MUI Plus
conserve le bouton Magie et son gestionnaire natif.

## État de validation

La compilation WebAssembly `ninja -j32 html5` réussit dans un conteneur isolé, à partir de `origin/main` et du seul changement natif d’estimation. Les optimisations raster/pathfinder en cours dans un autre travail sont exclues de cette archive.

Les vérifications couvrent six tests unitaires, 64 cas denses de placement Chromium/WebKit (seize troupes adjacentes mélangées), huit cas de réglages MUI et de persistance, les vingt variantes de commandes compactes et les seize variantes de HUD/commandant. Les traits de liaison sont découpés autour des silhouettes et des compteurs des deux camps.

Le moteur réel Chromium publie et affiche les intervalles calculés par son estimateur de combat, sans sélection préalable. Les effectifs et prévisions sont inchangés après 1,5 seconde d’attente ; les rotations et le réglage immédiat passent en Classic/Vertical. Les captures natives sont dans `/tmp/goonk-battle-losses-native`. Ces essais ne constituent pas une validation sur l’iPhone physique.
