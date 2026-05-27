#!/usr/bin/env bash
set -euo pipefail

repo="ImpulsiveLabs/Illustry-monorepo"
run_publish="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      repo="$2"
      shift 2
      ;;
    --run-publish)
      run_publish="true"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required. Install gh and authenticate with gh auth login." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run gh auth login first." >&2
  exit 1
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  printf "Paste an npm automation token with publish access to the @illustry scope: " >&2
  stty -echo
  read -r NPM_TOKEN
  stty echo
  printf "\n" >&2
fi

if [ -z "${NPM_TOKEN}" ]; then
  echo "No npm token provided." >&2
  exit 1
fi

npmrc="$(mktemp)"
trap 'rm -f "${npmrc}"' EXIT
printf "//registry.npmjs.org/:_authToken=%s\n" "${NPM_TOKEN}" > "${npmrc}"

echo "Validating npm token..."
npm_user="$(NPM_CONFIG_USERCONFIG="${npmrc}" npm whoami)"
echo "npm token belongs to: ${npm_user}"

owners="$(NPM_CONFIG_USERCONFIG="${npmrc}" npm owner ls @illustry/types 2>/dev/null || true)"
if ! printf "%s\n" "${owners}" | grep -qi "^${npm_user}[[:space:]]"; then
  echo "Warning: ${npm_user} is not listed as an owner of @illustry/types." >&2
  echo "This token may still fail to publish new @illustry packages." >&2
fi

echo "Writing NPM_TOKEN secret to ${repo}..."
gh secret set NPM_TOKEN --repo "${repo}" --body "${NPM_TOKEN}"

echo "Secret installed."

if [ "${run_publish}" = "true" ]; then
  echo "Starting first publish workflow..."
  gh workflow run publish-packages.yml \
    --repo "${repo}" \
    --ref main \
    -f registry=npm \
    -f package=all \
    -f version_bump=none \
    -f dry_run=false
fi
