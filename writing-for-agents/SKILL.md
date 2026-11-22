---
name: writing-for-agents
description: Règles d'écriture des documents lus par un agent. Charger avant de créer ou modifier un skill (~/.claude/skills), un agent (~/.claude/agents), un CLAUDE.md, une fiche mémoire ou MEMORY.md, ou un runbook que Claude suit.
---

<!-- Adapté de mattpocock/skills (skills/productivity/writing-for-agents), commit 5beb35b, licence MIT, (c) Matt Pocock. -->

# Écrire pour un agent

Vaut pour tout document qu'un agent consomme : skill, agent, `CLAUDE.md`, fiche mémoire, runbook atteint par un pointeur. L'emballage change, l'écriture non. Le but est la **prévisibilité** : l'agent suit le même *chemin* à chaque exécution, même si le résultat varie.

Pour un skill ou un agent (frontmatter, invocation, skill routeur) : lire aussi [MECANIQUE-SKILLS.md](MECANIQUE-SKILLS.md).

## Pointeurs de contexte

Un **pointeur** est une référence présente dans le contexte qui nomme un contenu hors contexte et encode la condition pour l'atteindre : la `description` d'un skill ou d'un agent, une ligne de `MEMORY.md`, une ligne de `CLAUDE.md` qui renvoie vers `runbooks.md`. C'est la *formulation* du pointeur, pas sa cible, qui décide si et quand l'agent l'atteint. Une cible indispensable derrière un pointeur mou est un bug de variance : affûter la formulation d'abord, n'intégrer le contenu en ligne que si ça échoue.

Un pointeur fait deux choses : dire ce qu'est le contenu, et lister les **branches** qui doivent le déclencher (une branche = un cas distinct que le document traite). Un pointeur toujours chargé coûte à chaque tour, il mérite un élagage encore plus dur que le corps :
- **Mot directeur en tête** : c'est là qu'il déclenche.
- **Un déclencheur par branche** : des synonymes qui renomment la même branche sont une branche écrite deux fois ; fusionner.
- **Retirer l'identité que le corps porte déjà.**

## Les deux charges

- **Charge de contexte** : le coût de ce qui est toujours chargé (ligne de `CLAUDE.md`, description de skill, index `MEMORY.md`), payé à chaque tour en tokens et en attention, qu'il serve ou non. Précédent maison : à 328 Ko, `~/ops/CLAUDE.md` coûtait 186k tokens par tour et faisait échouer l'audit quotidien ; d'où la séparation règles / `journal.md`.
- **Charge cognitive** : le coût côté humain, savoir quels documents existent et quand les invoquer. L'humain est l'index. À dépenser là où son jugement compte, à supprimer ailleurs.

Un contenu atteint par pointeur n'échappe à la charge de contexte qu'au prix de la ligne du pointeur ; un contenu sans pointeur repose entièrement sur la mémoire de l'humain.

## Hiérarchie de l'information

Deux types de contenu : les **étapes** (actions ordonnées) et la **référence** (définitions, règles, faits consultés à la demande). Chaque morceau se place sur une échelle, selon l'immédiateté du besoin :

1. **Étape dans le fichier** : ce que l'agent fait, dans l'ordre.
2. **Référence dans le fichier** : consultée à la demande. Une liste plate de règles pairs est un agencement normal.
3. **Référence déportée** : dans un autre fichier, derrière un pointeur, chargée seulement quand il se déclenche (fichier voisin dans le dossier du skill, ou doc externe comme `~/ops/docs/runbooks.md`).

**Divulgation progressive** : descendre un contenu sur l'échelle pour garder le haut lisible. Test le plus net : mettre en ligne ce dont toutes les branches ont besoin, déporter ce que seules certaines atteignent. Une référence non déportée au milieu d'étapes noie les étapes et rend leur exécution aléatoire.

**Colocalisation** : une fois le niveau choisi, garder la définition, les règles et les pièges d'un concept sous un même titre. Le document doit se lire comme une doc écrite pour l'agent.

**Étalement** : un document simplement trop long, même si chaque ligne est vivante. L'attention s'y dilue. Remède : l'échelle (déporter) et le découpage par branche ou par séquence.

## Étapes et critère de fin

Chaque étape se termine sur un **critère de fin** qui dit à l'agent que c'est fait.
- **Clarté** : l'agent distingue-t-il fait / pas fait ? Une borne floue (« compréhension atteinte ») invite à la **clôture prématurée**, l'attention glissant vers les étapes suivantes visibles. Défense dans l'ordre : affûter la borne d'abord ; seulement si elle reste floue *et* qu'on observe la précipitation, masquer les étapes suivantes en découpant la séquence. Le masquage n'agit qu'à travers une vraie frontière de contexte (passage à un sous-agent), pas un appel en ligne.
- **Exigence** : « chaque guest de l'inventaire vérifié » force un travail exhaustif là où « produire une liste » ne le fait pas. L'exigence pilote le travail de fond, et s'applique aussi à une référence plate (« chaque règle appliquée »).

Les meilleurs critères sont vérifiables *et* exhaustifs.

## Quand découper

Découper dépense une des deux charges, donc seulement quand c'est rentable :
- **Par séquence** : quand les étapes suivantes poussent l'agent à bâcler l'étape en cours. À l'inverse, fusionner des séquences expose chaque étape à ce qui suit.
- **Par invocation** (propre aux skills) : voir [MECANIQUE-SKILLS.md](MECANIQUE-SKILLS.md).

## Mots directeurs

Un **mot directeur** est un concept compact déjà présent dans l'entraînement du modèle, avec lequel l'agent pense en exécutant le document (*leçon*, *brouillard de guerre*, *balle traçante*, *frontière*). Répété comme un mot, jamais comme une phrase, il ancre toute une zone de comportement en peu de tokens. Un mot inventé n'apporte aucun acquis : il faut le payer en définition ; chercher d'abord un mot existant.

Il ancre deux fois : dans le corps (l'agent retrouve le même comportement à chaque occurrence) et dans le pointeur (si le même mot vit dans tes demandes, ta doc et ton code, l'agent relie ce vocabulaire au contenu). Chasser les triades répétées et les phrases qui tournent autour d'une idée : « rapide, déterministe, léger » → *serré* ; « une boucle en laquelle on croit » → *rouge* (la boucle passe au rouge sur le bug, ou non).

**Négation** : interdire attire l'attention sur l'interdit et le rend plus disponible. Formuler la cible en positif (« commentaires d'une ligne ») pour que l'interdit ne soit jamais nommé. Une interdiction ne se justifie que comme garde-fou dur impossible à formuler en positif (ex. : jamais de rotation des clés API internes) ; même alors, l'accompagner de la cible positive.

## Forme selon l'échec

Avant d'écrire ou de corriger une consigne, nommer l'échec observé ; la forme qui le corrige dépend de son type :

| Échec observé | Forme qui le corrige |
|---|---|
| Règle connue mais sautée sous pression | Garde-fou dur avec la cible positive, et les excuses typiques nommées comme signaux d'alerte |
| Sortie à la mauvaise forme (verdict noyé, contexte recopié) | Recette : ce que la sortie *est*, ses parties dans l'ordre |
| Élément oublié dans un livrable déjà produit | Champ obligatoire dans le gabarit |
| Comportement qui dépend d'un cas | Conditionnel sur un fait observable (« si le guest a Docker… ») |

Une exception s'écrit comme son propre conditionnel. Une clause « sauf si… » ajoutée à une règle rouvre la négociation, et une exemption (« ne s'applique pas aux blocs de code ») réduit quand même ce qu'elle exempte : restructurer pour que la règle ne l'atteigne pas.

<!-- Section adaptée de obra/superpowers (skills/writing-skills, « Match the Form to the Failure »), commit 2ce8aa1, licence MIT. -->

## Élagage

- **Source unique de vérité** : chaque sens à un seul endroit, pour qu'un changement de comportement soit une seule modification. La **duplication** coûte en maintenance et en tokens, et gonfle l'importance du sens.
- L'**environnement** est aussi une source de vérité (inventaire Ansible, configs, arborescence, `--help`, Cortex). Un document qui le recopie est un **cache** : il ne se justifie que si la recherche est coûteuse. Mettre en cache ce que l'agent ne trouve pas en regardant : la convention non écrite, la raison d'un choix, le piège qu'aucune config n'avoue.
- **Pertinence** : chaque ligne porte-t-elle encore sur ce que fait le document ? Sans discipline d'élagage, le destin par défaut est la **sédimentation** : des couches périmées qui s'accumulent parce qu'ajouter paraît sûr et retirer risqué. Les comptes rendus datés vont dans `journal.md`, pas dans les documents toujours chargés.
- **No-op** : une consigne que le modèle suit déjà par défaut paie de la charge pour ne rien dire. Test : change-t-elle le comportement par rapport au défaut ? Si non, supprimer la phrase entière. Un mot trop faible pour battre le défaut (*sois minutieux*) est un no-op ; le remède est un mot plus fort (*sans relâche*).

## Critère de fin de ce skill

Le document est terminé quand : chaque pointeur (description, ligne d'index) liste ses branches sans synonymes ; chaque étape a un critère de fin vérifiable ; aucune référence propre à une seule branche ne reste en ligne ; aucune phrase n'est un no-op ou une copie de l'environnement.
