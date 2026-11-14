# Priorité4 — interactions de combat, version 0.4.168

Trois écarts vérifiés corrigés dans le moteur :

- Triton abyssal285 : bonus du lanceur puis réduction intrinsèque/4, avant les protections d’école. Vrai Éclair SP1 + ProtectionAir30 : ancien moteur6 dégâts, nouveau5, calcul d’origine5.
- Clones avec renaissance source : conserver uniquement le marqueur de durée65 existant lors du nettoyage de mort/renaissance. La durée originale est indépendante des81 emplacements de sorts dans le binaire ; elle n’est jamais renouvelée.
- Squelette rouge296 : le drain soigne aussi un clone revenu par renaissance, puis rétablit immédiatement sa fragilité. Les autres profils conservent leur branche de soin existante.

`build-and-tests.json` identifie l’archive, le moteur, les sources changées et les737 tests retenus (704 réussis,33 ignorés, aucun échec). `engine-source-sync.json` compare97 sources canoniques avec le conteneur. Compilation obligatoire : `ninja -j32 html5`.

`native-portrait.json` contient cinq combats causaux dans Chromium390×844, moteur final et politiques de production. Seuls les PV/vitesses de la carte de test sont contrôlés avant lancement ; sorts et actions sont réels. Les quatre pertes observées sont5/8/5/24. Le golem33 porte déjà les métadonnées source au rang0 ; le témoin hors source est Bobope. Le clone296 renaît à24PV, attaque au tour2, remonte à30PV par drain et conserve sa fragilité.

`native-landscape-clone-expiry.json` rejoue le clone en844×390 avec une vraie durée de deux tours : renaissance24PV au tour1, drain30PV au tour2, disparition au tour3. La correction ne renouvelle pas le sort.

`production-maps-save-reload.json` rejoue les cartes livrées003/004, leurs sauvegardes/rechargements, rôles humains/IA, noms et changements de tours solo/hotseat, puis un vrai début de combat. Aucun fichier de mod ou carte installé n’est modifié. Les sauvegardes elles-mêmes ne sont pas versionnées. Le nom du scénario conserve167 mais son argument et ses empreintes identifient le moteur168.

`before-after.json` distingue le témoin rouge de l’ancien moteur et les résultats corrigés. Les deux premières tentatives du scénario clone comportaient des erreurs de fixture (Défendre empêche la renaissance ; les clones n’exposent pas de rang d’expérience dans le DTO). Elles ne sont pas des preuves de régression. Le troisième échec, disparition au prochain tour après une renaissance valide, révèle le défaut de durée documenté dans `source-vampire-clone-review.md`.

Les audits des actions, immunités, soins et statuts distinguent code traduit, preuve statique et cas mesurés. Les adresses originales proviennent d’un désassemblage local du binaire identifié ; aucun exécutable Windows n’a été exécuté ou téléversé. Les limites causales restantes y sont conservées : elles ne prouvent ni absence de fonctionnalité ni équivalence intégrale de tout WoG/ERA.

Les tests locaux contournent la CSP du serveur de prévisualisation. Le contrôle public après publication doit vérifier séparément le vrai WASM, la CSP normale et l’isolation. Aucun code de diagnostic n’est ajouté au moteur ni au site. Aucun nouveau composant d’interface n’est introduit par ces corrections.
