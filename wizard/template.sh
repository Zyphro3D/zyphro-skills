#!/usr/bin/env bash
#
# Assistant pas à pas : guide Florian dans une procédure que lui seul peut faire.
# Généré par le skill /wizard (adapté de mattpocock/skills, licence MIT).
#
# Tout ce qui précède le repère « ÉTAPES » est la bibliothèque : ne pas la modifier.
# Écrire les étapes sous le repère.

set -euo pipefail
umask 077

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  BLUE=$(tput setaf 4); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; BLUE=""; GREEN=""; YELLOW=""; RED=""
fi

TOTAL_STAGES=0            # fixé en tête de la section ÉTAPES
_STAGE_INDEX=0
SECRETS_DIR="$HOME/ops/.secrets"
SECRET_RUN="$HOME/ops/bin/secret-run"
SECRET_IMPORT="$HOME/ops/bin/secret-import"
SAVED_SECRETS=()          # fichiers écrits dans SECRETS_DIR pendant cette exécution
IMPORTED=()               # éléments importés et vérifiés dans Vaultwarden
DONE_CMDS=()              # commandes lancées avec succès
SKIPPED=()                # ce qui reste à faire à la main

_clear() {
  [[ -t 1 ]] || return 0
  if command -v tput >/dev/null 2>&1 && tput clear 2>/dev/null; then return 0; fi
  printf '\033[2J\033[3J\033[H'
}

# banner "Titre" : écran d'ouverture.
banner() {
  _clear
  printf '\n%s%s  %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"
  printf '%s  %s étapes%s\n\n' "$DIM" "$TOTAL_STAGES" "$RESET"
  printf '%s  Tu fais les manipulations, l'"'"'assistant dit exactement quoi faire,\n' "$DIM"
  printf '  range les valeurs et lance les commandes après confirmation.\n'
  printf '  Ctrl-C à tout moment ; une étape déjà faite peut être relancée sans risque.%s\n' "$RESET"
  pause "Prêt ? [Entrée]"
}

# stage "Nom" : efface l'écran, annonce l'étape et la progression.
stage() {
  _clear
  _STAGE_INDEX=$((_STAGE_INDEX + 1))
  printf '\n%s%s▸ Étape %s/%s · %s%s\n' "$BOLD" "$BLUE" "$_STAGE_INDEX" "$TOTAL_STAGES" "$1" "$RESET"
}

say()  { printf '  %s\n' "$1"; }
step() { printf '  %s•%s %s\n' "$BLUE" "$RESET" "$1"; }
note() { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠ %s%s\n' "$YELLOW" "$1" "$RESET"; }

# show_url URL : affiche le lien (cliquable dans le terminal VS Code) ; l'ouvre si un bureau est disponible.
show_url() {
  printf '  %s↗%s %s\n' "$GREEN" "$RESET" "$1"
  if [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] && command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$1" >/dev/null 2>&1 || true
  fi
}

pause() {
  printf '  %s%s%s ' "$DIM" "${1:-Entrée pour continuer}" "$RESET"
  read -r _ || true
}

# confirm "question" : barrière o/N ; succès sur oui.
confirm() {
  local reply=""
  printf '  %s? %s [o/N] %s' "$YELLOW" "$1" "$RESET"
  read -r reply || true
  [[ "$reply" =~ ^[OoYy] ]]
}

# ask VAR "Question" : saisie visible (valeur non secrète) dans $VAR.
ask() {
  local key="$1" input
  read -e -r -p "  $2 " input || return 1
  printf -v "$key" '%s' "$input"
}

# ask_secret VAR "Question" : saisie masquée dans $VAR, redemandée si vide.
ask_secret() {
  local key="$1" input=""
  while [[ -z "$input" ]]; do
    printf '  %s%s%s ' "$BOLD" "$2" "$RESET"
    read -rs input || return 1
    printf '\n'
  done
  printf -v "$key" '%s' "$input"
}

# save_secret FICHIER VALEUR : écrit la valeur (sans fin de ligne) dans ~/ops/.secrets/FICHIER, mode 600.
# Si le fichier existe déjà, demande confirmation : l'élément Vaultwarden du même nom ne sera PAS
# mis à jour par secret-import (il faudra le modifier dans Vaultwarden).
save_secret() {
  local name="$1" value="$2" path="$SECRETS_DIR/$1"
  if [[ -e "$path" ]]; then
    warn "$path existe déjà."
    confirm "L'écraser ?" || { SKIPPED+=("secret $name non écrit (fichier existant conservé)"); return 0; }
    SKIPPED+=("secret $name : si l'élément existe dans Vaultwarden, le modifier là-bas (secret-import ne met pas à jour)")
  fi
  printf '%s' "$value" > "$path"
  SAVED_SECRETS+=("$name")
  printf '  %s✓ écrit%s %s (600)\n' "$GREEN" "$RESET" "$path"
}

# import_secrets "Claude/<sous-collection>" FICHIER… : importe dans Vaultwarden puis vérifie
# chaque élément sans l'afficher. Jamais pour les comptes root/florian (collection Infra).
import_secrets() {
  local coll="$1"; shift
  say "Import dans Vaultwarden, collection « $coll » : $*"
  if ! "$SECRET_IMPORT" "$coll" "$@"; then
    SKIPPED+=("secret-import \"$coll\" $* (échec, à relancer)"); warn "secret-import a échoué"; return 0
  fi
  local f
  for f in "$@"; do   # un secret-run à la fois : jamais en parallèle
    if "$SECRET_RUN" --stdin "$f" -- bash -c 'cmp -s - "$1"' _ "$SECRETS_DIR/$f"; then
      IMPORTED+=("$f"); printf '  %s✓ vérifié%s %s dans Vaultwarden\n' "$GREEN" "$RESET" "$f"
    else
      SKIPPED+=("vérifier $f dans Vaultwarden (contenu différent ou introuvable)"); warn "$f : vérification échouée"
    fi
  done
}

# record VAR : ajoute VAR=<valeur> (observation non secrète) au fichier de résultats lu par Claude.
WIZARD_OUT="${WIZARD_OUT:-${BASH_SOURCE[0]%.sh}.out}"
record() {
  printf '%s=%q\n' "$1" "${!1}" >> "$WIZARD_OUT"
  RECORDED=1
}

# run_cmd "Ce que ça fait" commande arg… : affiche la ligne complète, demande confirmation, lance.
run_cmd() {
  local what="$1"; shift
  say "$what"
  printf '  %s$ %s%s\n' "$DIM" "$*" "$RESET"
  if ! confirm "Lancer ?"; then SKIPPED+=("$what : $*"); return 0; fi
  if "$@"; then
    DONE_CMDS+=("$what"); printf '  %s✓ ok%s\n' "$GREEN" "$RESET"
  else
    SKIPPED+=("$what (échec code $?) : $*"); printf '  %s✗ échec%s\n' "$RED" "$RESET"
    pause "Noté pour la fin. Entrée pour continuer"
  fi
}

# finish : récapitulatif final.
finish() {
  _clear
  printf '\n%s%s  ✓ Terminé%s\n' "$BOLD" "$GREEN" "$RESET"
  (( ${#SAVED_SECRETS[@]} )) && note "secrets écrits dans $SECRETS_DIR : ${SAVED_SECRETS[*]}"
  (( ${#IMPORTED[@]} ))      && note "importés et vérifiés dans Vaultwarden : ${IMPORTED[*]}"
  (( ${#DONE_CMDS[@]} ))     && note "commandes réussies : ${#DONE_CMDS[@]}"
  [[ -n "${RECORDED:-}" ]]   && note "observations enregistrées dans $WIZARD_OUT"
  if (( ${#SKIPPED[@]} )); then
    printf '\n'; warn "reste à faire à la main :"
    local s; for s in "${SKIPPED[@]}"; do note "  - $s"; done
  fi
  printf '\n%s  Dis « fini » à Claude pour qu'"'"'il vérifie et supprime l'"'"'assistant.%s\n\n' "$DIM" "$RESET"
}

# ──────────────────────────────────────────────────────────────────────────
# ÉTAPES : une stage() par étape. Fixer TOTAL_STAGES. Tout reste dans run_wizard
# et la dernière ligne ne bouge pas : bash lit tout le fichier avant la première
# question, une modification en cours d'exécution ne peut pas le casser.
# ──────────────────────────────────────────────────────────────────────────

run_wizard() {

TOTAL_STAGES=2

banner "Exemple : jeton API d'un service externe"

# ── Exemple : à remplacer ─────────────────────────────────────────────────
stage "Créer le jeton dans le tableau de bord"
show_url "https://exemple.com/settings/tokens"
step "Settings → API tokens → Create token, droits « lecture seule »."
step "Copier le jeton affiché (il ne sera plus montré)."
ask_secret EXEMPLE_TOKEN "Colle le jeton :"
save_secret exemple-api.token "$EXEMPLE_TOKEN"
unset EXEMPLE_TOKEN
import_secrets "Claude/Externes" exemple-api.token

stage "Tester le jeton"
run_cmd "Appel de test avec le jeton depuis le coffre" \
  "$SECRET_RUN" --env T=exemple-api.token -- bash -c 'curl -fsS -o /dev/null -H "Authorization: Bearer $T" https://exemple.com/api/me && echo OK'
# ──────────────────────────────────────────────────────────────────────────

finish
}

run_wizard "$@"; exit
