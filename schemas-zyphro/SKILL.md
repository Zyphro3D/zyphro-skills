---
name: schemas-zyphro
description: Règles pour dessiner un schéma de l'infra ou d'une appli Zyphro (VLAN et flux Sophos, Proxmox et guests, chaîne Cloudflare→Caddy→service, déploiement, séquence d'un échange) en SVG d'Artifact ou en Mermaid. Déclencher avant de dessiner ou de corriger un schéma, sur « fais un schéma », « dessine l'archi », ou pour une figure de doc, d'infographie ou de site.
---

<!-- Règles reprises de cathrynlavery/diagram-design 0cf73c3 (MIT) et tt-a1i/archify e392089 (Apache-2.0, règles de placement seulement), reformulées ; aucun script ni police web repris. -->

# Schémas Zyphro

Pour la mécanique d'un SVG d'Artifact (thèmes clair/sombre, inline), charger aussi `artifact-diagramming`. Ce skill décide **quoi** dessiner et **comment le tracer**.

## Étapes

1. **Faut-il un schéma ?** Si un tableau de trois colonnes ou un paragraphe dit la même chose, l'écrire à la place. Une liste ou une forme unique n'est pas un schéma. Fin : une phrase dit ce que le lecteur apprend du schéma et qu'il n'apprendrait pas d'un tableau.
2. **Type**, selon la question posée. En cas d'hésitation entre deux, prendre l'axe dominant.

   | Question | Type |
   |---|---|
   | Quels composants, reliés comment (vue instantanée) | Architecture |
   | Où tourne quoi : VLAN, hôte, guest, port, version | Déploiement |
   | Qui a le droit de passer où (règles Sophos, Cloudflare Access, mTLS) | Architecture avec frontières de confiance |
   | Messages ordonnés dans le temps entre acteurs (ACME DNS-01, réveil d'un serveur) | Séquence |
   | Phases avec attentes et reprises (cycle de vie d'un guest, d'une publication) | Machine à états |
   | Ce qui dépend de quoi | Graphe de dépendances |
   | Logique de décision | Logigramme |

   Un déploiement n'a de sens que s'il montre un **choix de placement** (quelle machine, quel VLAN, quelle version). Sinon c'est une architecture : redessiner l'architecture en y collant des noms d'hôtes est l'erreur la plus courante.
3. **Annoncer** en un message : le type, le budget, et ce que le budget fait sortir du schéma. Fin : Florian sait ce qui n'y sera pas.
4. **Dessiner** selon les règles ci-dessous (Mermaid pour un croquis de doc interne ; SVG à la main pour tout ce qui est publié ou montré : Artifact, infographie, site).
5. **Contrôler** : passer la liste « Contrôle final ». Fin : chaque point coché ou corrigé.

## Budgets

- Général : **9 nœuds et 12 flèches** au plus. Au-delà : une vue d'ensemble plus un schéma de détail.
- Déploiement : 3 zones, 6 nœuds, 9 puces, 8 chemins, 2 accents. Au-delà : un schéma par zone ou par VLAN.
- Frontières de confiance : 3 zones, 8 composants, 10 chemins, dont 2 chemins interdits au plus.
- Largeur ≤ 1240 px (1790 px si le schéma est au moins 1,55 fois plus large que haut) : au-delà, les étiquettes de 8 px deviennent illisibles.

## Déploiement

Trois niveaux : **zone** ⊃ **nœud** ⊃ **puce**.
- **Zone** : une vraie frontière réseau ou d'environnement (VLAN, WAN, Cloudflare, LAN), jamais un simple regroupement visuel. Rectangle en tirets `4,4`, fond très léger, étiquette en capitales en haut à gauche.
- **Nœud** : hôte, VM, LXC, conteneur, service géré. Étiquette de type rectangulaire (`VM`, `LXC`, `CT`, `CDN`).
- **Puce** : un service ou une image, avec **sa version** à droite (`caddy 2.8`). Une puce sans version est une boîte inutile.
- Plusieurs exemplaires : un seul nœud avec un badge `x3`, jamais un nœud par exemplaire.
- **Chemin réseau** : toujours étiqueté `PROTOCOLE:PORT` (`HTTPS:443`, `NFS:2049`). Un chemin qui franchit une frontière de zone se distingue d'un chemin interne ; asynchrone ou réplication en tirets `5,4`.
- Un environnement par schéma. Des noms, pas des logos de fournisseur.

## Frontières de confiance

- Flux autorisé avec un libellé positif ; flux interdit qui **s'arrête sur la frontière** avec un symbole d'arrêt ; contournement bloqué dessiné comme tel.
- La différence autorisé/interdit passe par le style de trait **et** un symbole, jamais par la couleur seule.
- Une frontière encadre tous ses membres de près, sans « baie » vide où un non-membre semblerait entrer ; les acteurs externes restent dehors.

## Connecteurs (chaque point est obligatoire)

1. **Orthogonaux** : coudes arrondis (`r=8`, `r=6` au plus serré) ; ligne droite seulement si les deux bouts partagent x ou y. Aucune diagonale.
2. **Étiquette** : 14 caractères au plus, capitales, centrée, sur un masque opaque, à 6-10 px du trait ; à côté d'un segment vertical, jamais dessus. Jamais de texte vertical.
3. **Aucun trait superposé** : routes parallèles écartées d'au moins 12 px ; un pont à un croisement unique.
4. **Points d'attache répartis** sur un même bord : position `L × k / (N + 1)`, au moins 12 px d'écart.
5. **Aucun passage derrière une boîte** qui n'est pas une extrémité : rerouter.
6. **Ordre de dessin** : fond, zones, flèches, étiquettes, nœuds (les flèches passent sous les boîtes).

Placement avant les coordonnées :
- le parcours principal se lit dans l'ordre, voisins adjacents ; s'il est long, il descend par rangées ;
- un stockage ou une branche se place juste au-dessus ou au-dessous de son propriétaire, pour un lien d'un seul segment ;
- un retour vers un nœud antérieur part du côté libre ; une seconde entrée arrive par un autre côté ;
- un côté qui reçoit k liens doit mesurer au moins `32 + 14 × (k − 1)` px : sinon répartir sur plusieurs côtés ou agrandir la boîte ;
- coordonnées sur une grille de 4 px.

## Style

- **Retirer** est le meilleur geste : deux nœuds toujours ensemble n'en font qu'un ; un trait qui n'apporte rien disparaît.
- Couleurs : celles de la charte (`~/dev/zyphro-brand/CHARTE.md` §2) quand le schéma est public ; sinon encre, gris atténué, et **un accent** (le rouge Zyphro) sur 1 à 2 éléments au plus : le point unique de défaillance ou la pièce nouvelle. Pas d'arc-en-ciel, pas de lueur, pas d'ombre.
- Formes porteuses de sens : stockage, externe, entrée, optionnel (tirets `4,3`), sécurité (tirets `4,4`) ont chacun leur traitement ; des boîtes toutes identiques effacent la hiérarchie.
- Traits : 1 par défaut, 0,8 pour les feuilles, 1,2 pour l'emphase. Rayons : 4 (étiquettes), 6 (nœuds), 8 (conteneurs).
- Texte : noms en sans 600 à 12 px ; ports, URL et commandes en mono 9 px ; étiquettes de flèche en mono 8 px. Polices système uniquement (`system-ui`, `ui-monospace`), aucune police web : garder une marge de 8 px dans les boîtes.
- Légende en bande horizontale sous le schéma, jamais flottante.
- Contraste : texte 4,5:1, traits porteurs de sens 3:1, dans les deux thèmes.

## Accessibilité et confidentialité

- Chaque `<svg>` : `role="img"`, `aria-labelledby` vers un `<title>` (premier enfant) et une `<desc>` d'une phrase.
- Un état (en ligne, bloqué) se lit aussi en texte, jamais par la couleur seule.
- Schéma **public** (site, infographie pour des tiers) : aucune IP, aucun nom de machine, aucun sous-domaine interne (charte §9). Garder des rôles (« pare-feu », « hôte de virtualisation », « serveur de jeu »).

## Contrôle final

- [ ] Le schéma apprend quelque chose qu'un tableau n'apprendrait pas.
- [ ] Budget respecté, ou découpage en vue d'ensemble + détail.
- [ ] Chaque zone est une vraie frontière ; chaque puce a sa version ; chaque chemin a son `PROTOCOLE:PORT`.
- [ ] Les six règles de connecteurs tiennent, flèche par flèche.
- [ ] Un seul accent, sur 1 ou 2 éléments.
- [ ] Lisible en clair et en sombre ; `title`/`desc` présents.
- [ ] Public : aucune donnée d'infrastructure personnelle.
