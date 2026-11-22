# Test manuel : clavier et lecteur d'écran

Ce que la sonde ne peut pas trancher. Une page, environ 10 minutes, sur le PC Windows de Florian.
À faire sur chaque site après un changement de mise en page, sinon une fois par trimestre.

## 1. Clavier seul (5 min, aucun outil)

Ouvrir la page dans Chrome ou Firefox, cliquer une fois dans la barre d'adresse, puis ne plus toucher la souris.

| Touche | Ce qu'on vérifie |
|---|---|
| `Tab` (répéter jusqu'en bas) | Chaque lien et bouton reçoit le **contour rouge**, dans l'ordre de lecture (haut → bas, gauche → droite). Aucun saut incohérent, aucun élément invisible qui prend le focus. |
| `Tab` sous la barre du haut | L'élément qui a le focus n'est jamais caché sous la barre ou le dock. |
| `Maj+Tab` | Remonte dans le même ordre. |
| `Entrée` sur un lien | Le lien s'ouvre. |
| `Entrée` ou `Espace` sur un bouton | FR/EN change la langue, le soleil/lune change le thème. |
| `Échap` | Ferme tout menu ou panneau ouvert (sommaire replié des docs). |
| Fin de page | Le focus revient à la barre d'adresse : pas de piège. |

Noter chaque écart : élément, ce qui se passe, ce qui était attendu.

## 2. Lecteur d'écran (5 min)

Windows : **Narrateur** est intégré (`Ctrl+Win+Entrée` pour l'allumer et l'éteindre). NVDA (nvaccess.org, gratuit) est plus fidèle si tu veux aller plus loin.
Téléphone : TalkBack (Android) ou VoiceOver (iPhone), réglages d'accessibilité.

Avec le Narrateur allumé, sur la page, en mode balayage (actif par défaut dans un navigateur ; sinon `Verr.Maj+Espace`) :

1. **Titres** : `H` saute de titre en titre. On doit entendre une structure qui a du sens (titre de page, puis sections), sans titre vide.
2. **Liens** : `K` passe de lien en lien. Chaque lien se comprend seul (« Ouvrir la page du serveur AC EVO », pas « Découvrir » quatre fois sans contexte).
3. **Images** : une image utile est décrite ; les décors (écrans du héros, illustrations) sont **silencieux**.
4. **Boutons** : FR/EN et le thème annoncent leur rôle et leur état (« bouton, FR, enfoncé »).
5. **Points d'état** : « En ligne » / « Éteint » est **dit**, pas seulement montré en couleur.
6. **Langue** : la page française est lue avec la voix française, la page anglaise avec la voix anglaise.

## 3. Rendre le résultat

Coller les écarts dans la conversation : Claude les classe avec le reste du rapport `qualite-sites` et propose les corrections.
