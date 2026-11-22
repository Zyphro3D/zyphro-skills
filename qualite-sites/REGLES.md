# Règles de qualité des pages publiques Zyphro

Référence du skill [qualite-sites](SKILL.md). La charte (`~/dev/zyphro-brand/CHARTE.md`) prime sur tout ce qui suit.
Sources, clones lus le 31/10/2026 dans `~/tools/work/skills-revue-2/` (licences MIT) :
- **JK** = jakubkrehel/skills, commit 592aedc ;
- **HM** = nutlope/hallmark, commit 4f6a46c (`skills/hallmark/references/`) ;
- **TS** = Leonxlnx/taste-skill, commit 12af471.

Colonne « Sonde » : clé de `resultats.json` qui mesure la règle au rendu. « Code » : vérification dans les sources (étape 3 du skill).

## Accessibilité

| Règle | Seuil | Sonde / Code | Source |
|---|---|---|---|
| Contraste du texte contre le fond **réellement rendu**, dans chaque thème | 4,5:1 ; 3:1 si ≥ 24 px ou ≥ 18,66 px gras ; contrôles inactifs exemptés | `contraste`, `contraste_approx` (sur verre : à confirmer sur capture) | JK better-colors/contrast.md:3-17,67-69 |
| Contraste des contours de champ, icônes, anneau de focus | 3:1 | Code + capture | JK better-accessibility/SKILL.md:74-78 |
| Focus visible : styler `:focus-visible` ; `outline: none` toujours remplacé | anneau ≥ 3:1, contour rouge (charte §10) | `css.focus_visible`, `css.outline_sans_remplacement` | JK focus-and-keyboard.md:9-21 |
| Focus jamais caché sous la barre fixe | `scroll-padding-block-start` = hauteur de `.bar` | Code | JK focus-and-keyboard.md:37-39 |
| Cibles cliquables | 24 × 24 px minimum (WCAG 2.5.8 ; liens dans une phrase exemptés, espacement de 24 px accepté) ; 44 px sur téléphone (charte §5) | `cible_petite`, `cible_tactile` | JK hit-areas.md:5-18 |
| Calques décoratifs (grain, halos, écrans du héros) hors du chemin des clics | `pointer-events: none` | Code | JK hit-areas.md:73-85 |
| Mouvement réduit : tout statique (charte §6) ; pause si quelque chose bouge seul plus de 5 s | `@media (prefers-reduced-motion)` présent | `css.reduced_motion` | JK motion-and-zoom.md:7-41 |
| Statut jamais par la couleur seule (points d'état, serveurs allumés/éteints) | icône ou texte en plus | Capture | JK better-accessibility/SKILL.md:68-70 |
| Zoom jamais bloqué ; reflow à 320 px | pas de `user-scalable=no` ni `maximum-scale=1` | `doc.zoom_bloque`, `deborde` à 320 | JK motion-and-zoom.md:43-48 |
| Images : `alt` selon le but (`alt=""` si décorative), `width`/`height` | — | `image_sans_alt`, `image_sans_dimensions`, `image_cassee` | JK screen-readers.md:67-79 ; charte §8 |
| SVG décoratif masqué | `aria-hidden="true"` | `svg_sans_aria_hidden` | HM gates.md (33) |
| Document : `lang`, `<title>`, meta description | — | `doc` | HM gates.md (F23) ; charte §12 |

## Mise en page et CSS

| Règle | Seuil | Sonde / Code | Source |
|---|---|---|---|
| Aucun débordement horizontal, de 320 à 1920 px | `overflow-x: hidden` sur `body` ne compte pas comme correction : il masque le défaut | `debordement`, `deborde` | HM gates.md (34) ; charte §5 |
| Premier écran : titre, phrase et action principale visibles sans défiler | à 1280 × 800 | `premier_ecran` | HM gates.md (44b) |
| Bouton ou lien de navigation sur une seule ligne | — | `bouton_a_la_ligne` | HM gates.md (49a) |
| Aucun texte recouvert par un autre (barre et dock fixes exclus) | — | `texte_recouvert` | HM gates.md (73) |
| Taille du texte | ≥ 12 px ; libellés Martian Mono 9-11 px admis (charte §3) ; < 9 px hors charte | `texte_petit` (`decor` = écran du héros en `aria-hidden`) | HM gates.md (75) |
| Hauteurs d'écran en `dvh`, colonnes en `minmax(0, 1fr)`, `100%` plutôt que `100vw`, `env(safe-area-inset-*)` | — | Code | JK better-layout/SKILL.md:72-78 |
| Transitions nommées, jamais `transition: all` ; survol sous `@media (hover: hover)` | — | `css.transition_all` + Code | JK better-ui/SKILL.md:76-90 |
| Chiffres alignés (versions, compteurs, tableaux) | `font-variant-numeric: tabular-nums` | Code | JK better-typography/SKILL.md:69-71 |
| Interlignage sans unité, mesure de 60 à 75 caractères pour la prose, `text-wrap: balance` sur les titres | — | Code + capture | JK better-typography/SKILL.md:44-67,100-104 |
| Champs de formulaire à 16 px sur mobile (sinon zoom iOS) | — | Code | JK better-typography/SKILL.md:91-98 |
| Aucune couleur ni police écrite en dur hors des jetons de `zyphro.css` (écrans de `screens.css` et exceptions §11 compris dans les jetons ou notés) | — | Code | HM gates.md:168 (48) |
| Thème : `::selection`, `caret-color`, `scrollbar-color` suivent la charte | — | Code | HM gates.md:179 (F16) |
| Formulaire : jamais « envoyé » sans requête réelle | — | Code | HM gates.md:134 (70) |

## Thème sombre

À vérifier sur les captures `dark-*.png` et dans le CSS (HM dark-mode.md:18-49) :
- les cartes sont plus claires que le fond, jamais plus sombres ;
- le relief vient de la luminosité ou d'un filet, l'ombre portée reste discrète ;
- le contraste est mesuré dans le thème sombre lui-même (la sonde le fait, passe `dark`).

## Regard sur les captures

Questions à se poser devant `dark-1440.png`, `light-1440.png` et `*-390.png` (TS critique.md:21-60, sans les critères de goût contraires à la charte) :
1. **Une seconde** : qu'a-t-on vu ? Une seule réponse attendue. **Cinq secondes** : sait-on ce que c'est, pour qui, et quoi faire ensuite ?
2. **Plisser les yeux** : deux ou trois masses nettes, pas une suite de blocs moyens.
3. **Bords** : combien de positions de départ distinctes pour les blocs de texte ? Deux ou trois voulues.
4. **Espace** : écart entre sections nettement plus grand que dans une section ; aucun trou accidentel ; marges gauche et droite égales.
5. **Typo** : titre au moins trois fois le corps ; au plus cinq tailles ; aucun mot seul sur la dernière ligne d'un titre.
6. **Téléphone** : le premier écran à 390 px reste une seule chose claire.

Signes d'une page générée qui restent valables chez nous (TS tells.md:20-80) : texte en dégradé, emoji en guise d'icônes, formules creuses (« seamless », « unlock », « Learn more » répété), fausses métriques ou témoignages.

## Icônes et favicons

Une icône passe trois contrôles, jugés à l'œil sur le rendu. Elle est refusée si le motif devient une tache grise dans l'un d'eux :
1. **Petite taille** : `for t in 16 32 48; do rsvg-convert -w $t icone.svg -o t$t.png; done`, à regarder à taille réelle. Le motif reste reconnaissable à 16 px.
2. **Une couleur** : le motif seul, en noir sur blanc.
3. **Inversé** : le motif seul, en blanc sur noir.

`rsvg-convert` (paquet `librsvg2-bin`) s'installe à part ; le lancer dans un bac à sable si besoin. Un score d'audit SVG ne remplace pas ces rendus : au test du 07/11, `svg_audit.py` donne 98/100 à un témoin qui devient un disque gris à 16 px.

## Ce qui n'est jamais un défaut ici

Choix de la charte, à ne pas signaler : libellés Martian Mono en capitales espacées, verre dépoli, dock en pastille, points d'état, écrans reconstruits du héros (`screens.css`), apparition `.rv` au défilement, un mot du titre en rouge. Exceptions §11 (ZDash, Digest, télémétrie, couleurs de données du panneau AC EVO).
