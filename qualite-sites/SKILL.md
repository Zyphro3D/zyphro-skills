---
name: qualite-sites
description: Contrôle qualité d'une page publique Zyphro (zyphro.fr, sites des applis evopanel./beammp-web./zcoach., docs, digest) — contraste, focus, cibles, débordements, premier écran, mesurés au rendu dans un vrai navigateur à 6 largeurs et 2 thèmes. Déclencher avant de publier ou déployer une page publique, sur « vérifie le site / la page », ou après une modification de design de ces sites.
---

<!-- Règles reprises de jakubkrehel/skills 592aedc, nutlope/hallmark 4f6a46c, Leonxlnx/taste-skill 12af471 (MIT) ; détail et crédits dans REGLES.md. Aucun code tiers : sonde.js et rendu.py sont écrits pour Zyphro. -->

# Qualité des pages publiques Zyphro

La charte `~/dev/zyphro-brand/CHARTE.md` décide du style ; ce skill **vérifie** une page contre elle et contre les règles mesurables de [REGLES.md](REGLES.md). Il rend un rapport et ne modifie rien sans demande.

## Étapes

1. **Charte.** Lire `CHARTE.md` en entier (exceptions §11 comprises). Fin : tu sais quelles couleurs, tailles et composants sont voulus.

2. **Rendu.** Lancer :
   ```
   python3 -I ~/.claude/skills/qualite-sites/rendu.py <URL> <dossier du scratchpad>
   ```
   L'URL doit être joignable par le serveur Playwright : page en ligne, ou instance de test qu'il peut atteindre. Fin : `resultats.json` avec 12 passes (6 largeurs × sombre/clair) et 4 captures (`dark|light-390|1440.png`).
   Si le serveur Playwright ne répond pas, le rapport dit « contrôle au rendu non fait » et ne rend aucun verdict.
   Si `doc.lang` ne correspond pas à la langue voulue (le navigateur est en anglais), relancer sur l'URL de l'autre langue.

3. **Code.** Pour chaque règle marquée « Code » dans REGLES.md, chercher dans les sources de la page (HTML, CSS, JS). Fin : chaque règle « Code » a une réponse (conforme, constat avec fichier:ligne, ou sans objet).

4. **Regard.** Ouvrir les 4 captures avec Read et passer les six questions de « Regard sur les captures ». Fin : une réponse par question.

5. **Rapport**, dans cet ordre :
   - une ligne de verdict : publiable / à corriger avant publication ;
   - les constats classés **bloquant** (contraste, débordement, focus absent, zoom bloqué, image cassée, mot interdit de la charte §9), **à corriger**, **à voir**. Chacun avec la règle, l'endroit (sélecteur et fichier:ligne), la mesure et la correction proposée ;
   - **non vérifié** : ce que ni la sonde ni les captures ne tranchent (navigation au clavier réelle, lecteur d'écran, autre langue si non relancée). Pour le clavier et le lecteur d'écran, renvoyer Florian à [MANUEL.md](MANUEL.md).

## Lire `resultats.json`

Chaque clé de liste correspond à une ligne de REGLES.md (colonne « Sonde »). Les listes sont plafonnées à 15 ; `<clé>_plus` compte le reste.
- `contraste_approx` : texte sur verre translucide, composé en supposant un fond uni derrière. À confirmer sur la capture.
- `texte_petit` avec `decor: true` : écran reconstruit du héros, en `aria-hidden`. À voir, pas bloquant.
- `cible_petite` sur des liens de pied de page : vérifier l'exception d'espacement de 24 px avant de signaler.
- Un constat présent à toutes les largeurs est **un seul** constat.

## Pièges

- Après toute modification de `sonde.js` : `python3 -I ~/.claude/skills/qualite-sites/test_sonde.py` (défauts injectés, code de sortie 0 = tous détectés).
- La CSP stricte des sites (`default-src 'self'`) bloque les attributs `style` d'un HTML injecté. Pour tester la sonde sur un défaut volontaire, poser le style par `el.style` en JS.
- Le changement de thème passe par une transition : mesurer après un délai (rendu.py défile la page avant de sonder, ce qui suffit).
- `overflow-x: hidden` sur `body` masque un débordement sans le corriger : la sonde cherche aussi les éléments hors de l'écran.
- Capture pleine page : la barre et le dock fixes y sont dessinés là où finissait l'écran, par-dessus le contenu. Ce n'est pas un recouvrement réel.
- `rv_jamais_apparus` > 0 : des sections ne s'affichent jamais, même après défilement complet. C'est bloquant ; une section vide sur capture avec `rv_jamais_apparus` = 0 est un artefact.

## Critère de fin

Les 12 passes ont tourné, chaque règle de REGLES.md a une réponse (sonde, code ou capture), et le rapport classe chaque constat ou le range dans « non vérifié ».
