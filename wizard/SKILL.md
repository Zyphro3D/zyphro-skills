---
name: wizard
description: Générer un assistant bash interactif qui guide Florian, étape par étape, dans ce que lui seul peut faire. Déclencher pour une saisie dans l'interface d'un service tiers (création de jeton, consentement, portail développeur), un secret à faire entrer dans Vaultwarden, une commande avec --ask-vault-pass ou sa propre session bw, une action physique, ou une bascule ponctuelle à plusieurs étapes manuelles.
---

<!-- Adapté de mattpocock/skills (skills/engineering/wizard), commit 5beb35b, licence MIT, (c) Matt Pocock. -->

# Wizard

Un **assistant** est un script bash qui guide Florian dans une procédure manuelle : il affiche le lien, dit exactement où cliquer et quoi copier, récupère les valeurs, range les secrets dans Vaultwarden, lance les commandes après confirmation et montre la progression. Il remplace un long message d'instructions dans le chat.

[template.sh](template.sh) porte déjà l'ergonomie : progression, écran effacé à chaque étape, saisie masquée, `save_secret` (fichier 600 dans `~/ops/.secrets`), `import_secrets` (`secret-import` puis contrôle `cmp` via `secret-run`), `run_cmd` (ligne complète affichée, confirmation, échec noté), récapitulatif final. **Mon travail : délimiter la procédure et écrire ses étapes.** La bibliothèque au-dessus du repère `ÉTAPES` reste identique dans chaque assistant.

Un assistant est jetable : écrit dans `~/ops/wizards/<sujet>.sh`, supprimé quand Florian dit « fini » et que j'ai vérifié le résultat.

## 1. Délimiter

Chaque étape que je peux faire moi-même sort de l'assistant et je la fais (création de guest, VLAN, Sophos, Caddy, DNS, Ansible sans vault, import de secrets via `secret-import`). Restent les étapes réservées à Florian :
- interface d'un service tiers où lui seul est connecté ;
- commande finale avec `--ask-vault-pass`, ou avec sa propre session `bw` (entrées root/florian de la collection Infra, que le bot ne voit pas) ;
- action physique, ou décision prise devant un écran.

Lire avant d'écrire : `~/ops/docs/runbooks.md`, Cortex pour les faits, la fiche mémoire du sujet. Présenter ensuite à Florian la liste ordonnée des étapes et les valeurs que chacune produit ; il peut en ajouter, retirer, réordonner.

**Fini quand** : chaque étape est nommée dans l'ordre, et pour chaque valeur je sais (a) où Florian la trouve, (b) où elle va (fichier `~/ops/.secrets/<nom>` + collection `Claude/<sous-collection>`, variable d'une commande, ou nulle part), (c) si elle est secrète.

## 2. Tracer le parcours

Pour chaque étape, écrire le chemin exact : lien, menus, bouton, où la valeur s'affiche, quelle variable elle remplit (« Dashboard → Developers → API keys → Reveal → copier »). Si je ne connais pas l'interface actuelle ou la commande exacte, vérifier dans la doc du service ou demander : chaque instruction correspond à un écran qui existe.

**Fini quand** : un inconnu pourrait suivre chaque étape sans aide.

## 3. Écrire l'assistant

Copier `template.sh` vers `~/ops/wizards/<sujet>.sh`, remplacer l'exemple par une `stage` par étape, dans l'ordre des dépendances, et fixer `TOTAL_STAGES`.

- Afficher le lien (`show_url`) avant de demander sa valeur.
- Tout secret passe par `ask_secret` → `save_secret` → `import_secrets`, puis `unset` de la variable. Nom de fichier = futur nom de l'élément ; sous-collection parmi Claude, Claude/Externes, Claude/Réseau, Claude/Supervision.
- Un secret qui existe déjà dans Vaultwarden se modifie dans Vaultwarden (secret-import ne met jamais à jour) : en faire une étape guidée, puis `secret-sync`.
- Commandes : `run_cmd` avec la ligne complète ; un secret entre dans une commande par `secret-run --env` ou `--stdin`, jamais en argument visible. Commande distante : `ssh -t <alias> "bash -lc 'cd ~/ansible && …'"`. Session `bw` de Florian : jamais `export BW_SESSION=$(bw unlock --raw)` (échec silencieux connu) ; reprendre la forme avec retentatives et contrôle de `runbooks.md` § 3, étape 4. Avant un onboarding : ca-pki-999 démarrée (§ 3, étape 5).
- Observation à me remonter (diagnostic avec humain dans la boucle) : `ask` puis `record VAR` ; les valeurs arrivent dans `~/ops/wizards/<sujet>.out`, que je lis après le « fini ». Jamais de secret dans `record`.
- `confirm` avant toute action irréversible. Une étape = une tâche, pour que rien d'utile ne disparaisse avec l'effacement d'écran.

## 4. Vérifier et remettre

- `bash -n` puis `shellcheck` sur le script ; `chmod 700`.
- Ne pas le lancer moi-même (il attend des saisies humaines) : le relire à froid. Chaque valeur de l'étape 1 est saisie et arrive où prévu ; chaque `secret-run --env X=<nom>` correspond à un fichier passé à `import_secrets` ou à un élément existant.
- Donner à Florian la commande complète à copier : `~/ops/wizards/<sujet>.sh`.
- Après son « fini » : vérifier le résultat réel (élément lisible par `secret-run`, service qui répond), noter dans `journal.md` si l'intervention le mérite, puis supprimer le script et son `.out`.
