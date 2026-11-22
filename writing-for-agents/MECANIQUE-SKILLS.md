# Mécanique des skills et des agents

La branche « skill / agent » de [writing-for-agents](SKILL.md) : frontmatter, choix d'invocation, skill routeur. Tout le reste de l'écriture relève de `SKILL.md`.

## Invocation

Deux choix, qui échangent les deux charges :

- **Invoqué par le modèle** : le skill garde une `description`, l'agent peut le déclencher seul et d'autres skills peuvent l'atteindre. L'utilisateur peut toujours taper `/nom`. La description est le pointeur de plus haut niveau, chargé en permanence : charge de contexte permanente contre découvrabilité. Un skill de pure référence invoqué par le modèle peut servir de foyer à une référence partagée par plusieurs skills. Mécanique : pas de `disable-model-invocation`, description tournée vers le modèle, avec les branches déclencheuses (règles des pointeurs de `SKILL.md`).
- **Invoqué par l'utilisateur** : `disable-model-invocation: true`. Seul l'humain qui tape le nom l'invoque, aucun autre skill. Zéro charge de contexte, mais charge cognitive : c'est toi l'index. La `description` devient une ligne de résumé pour l'humain, sans liste de déclencheurs.

Choisir l'invocation par le modèle seulement si l'agent doit l'atteindre de lui-même, ou si un autre skill le doit. S'il ne part qu'à la main, le passer en invocation utilisateur.

Une référence partagée par deux skills invoqués par l'utilisateur ne peut vivre dans aucun des deux : la mettre dans un fichier ordinaire hors du système de skills (par ex. sous `~/ops/docs/`), que chaque skill pointe.

**Agents (`~/.claude/agents/*.md`)** : la `description` est aussi un pointeur toujours chargé ; c'est elle qui décide quand le modèle principal délègue. Mêmes règles : mot directeur en tête, une branche par cas de délégation, et préciser ce que l'agent *rend* (ex. « avec fichier:ligne »), puisque son rapport est tout ce que le modèle principal verra.

## Découper par invocation

Détacher un skill invoqué par le modèle quand il existe un mot directeur distinct qui doit le déclencher seul (un mot réellement utilisé dans tes demandes) ou qu'un autre skill doit l'atteindre. On paie une nouvelle description toujours chargée : cette portée indépendante doit valoir ce prix.

## Skill routeur

Quand les skills invoqués par l'utilisateur deviennent trop nombreux pour être retenus, un **skill routeur** (lui-même invoqué par l'utilisateur) les nomme et dit quand prendre chacun : un seul nom à retenir. Il ne peut que suggérer, jamais les déclencher.
