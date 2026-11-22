---
name: grill-me
description: Interroger l'utilisateur sans relâche sur un plan, une conception ou une idée, par tours de questions numérotées avec une réponse recommandée, jusqu'à ce que toutes les décisions soient tranchées. Déclencher sur "grill-me", "cuisine-moi", "challenge mon plan", "passe mon idée au crible", "pose-moi toutes les questions", ou avant un chantier dont le périmètre est flou. Distinct de llm-council (qui arbitre une décision déjà formulée) : grill-me fait émerger les décisions cachées d'un plan.
---

<!-- Adapté de mattpocock/skills (skills/productivity/grilling), commit 5beb35b, licence MIT, (c) Matt Pocock. -->

# Grill-me

Interroger l'utilisateur jusqu'à une compréhension partagée du plan. Le représenter comme un **arbre de décisions** : chaque décision ouvre les décisions qui en dépendent.

## Balayage avant le premier tour

Passer le plan au crible de ces familles et noter chacune clair / partiel / absent : périmètre (dont le hors-périmètre dit explicitement) ; données et états (cycle de vie, volumes) ; parcours et états d'erreur, vide, attente ; exigences mesurables (performance, disponibilité, observabilité, sécurité) ; dépendances externes et leurs pannes ; cas négatifs et conflits ; contraintes et alternatives écartées ; vocabulaire ; critère « terminé » testable ; adjectifs non chiffrés (« robuste », « rapide »).

Une famille partielle ou absente devient une question seulement si sa réponse change l'architecture, les données, les tests ou l'exploitation ; un choix de mise en œuvre se tranche pendant l'implémentation. Pour un plan risqué (infra partagée, données, publication), ajouter une question **pre-mortem** : « dans trois semaines c'est un échec, quelle en est la cause la plus probable ? ».

<!-- Balayage adapté de github/spec-kit (templates/commands/clarify.md), commit 2a23a84, licence MIT ; pre-mortem d'après bmad-code-org/BMAD-METHOD (bmad-advanced-elicitation), 61e01f8, MIT. -->

## Déroulé par tours

La **frontière** est l'ensemble des décisions dont les prérequis sont déjà tranchés : les questions qu'on peut poser *maintenant* sans présumer de réponses pas encore entendues. Poser toute la frontière en un seul tour, numéroter chaque question et donner la réponse recommandée. Puis attendre les réponses avant le tour suivant.

Format d'un tour :

```
❓ **Q1** - **<titre de la question>** : <corps, éventuellement plusieurs paragraphes et plusieurs choix>

➡️ <réponse recommandée>

---

❓ **Q2** - **<titre>** : <corps>

➡️ <réponse recommandée>
```

Formuler chaque question pour que « oui » accepte la recommandation. L'utilisateur peut répondre en bloc (« oui sauf Q3 : … »).

Chaque tour de réponses remodèle l'arbre : les décisions tranchées repoussent la frontière et débloquent les questions qui en dépendaient. Recalculer la frontière et poser le tour suivant. Une question dont la réponse dépend d'une autre question encore ouverte dans ce tour appartient à un tour *ultérieur*.

## Faits vs décisions

Trouver les **faits** est mon travail, jamais celui de l'utilisateur. Ne pas lui demander ce que je peux vérifier moi-même :
- fait sur l'infra (IP, VLAN, machine, procédure, décision passée) : `cortex_search` / `cortex_ask` d'abord, en relisant la ligne citée ;
- recherche transversale dans la doc, la mémoire ou le code : agent `chercheur` ;
- état d'une machine : agent `diagnostic-flotte`.

Ne pas bloquer le tour sur une recherche en cours : seules les questions qui en dépendent attendent, le reste de la frontière est posé tout de suite. Les **décisions** appartiennent à l'utilisateur : les lui soumettre et attendre.

## Impact structurel

Si une branche de l'arbre implique un changement structurel (base de données, proxy, authentification, nouvelle exposition réseau, flux Sophos, service externe, nouveau guest), le dire explicitement dans la question et proposer des options concrètes, plutôt que de l'absorber en silence.

## Fin

La session est terminée quand la frontière est vide : chaque branche visitée, rien de supposé en silence. Présenter alors un récapitulatif court des décisions prises, puis proposer de l'enregistrer (étapes dans `todo add`, décisions durables dans le journal ou la mémoire du projet). Ne rien exécuter avant que l'utilisateur confirme que la compréhension est partagée.
