#!/bin/bash

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-vps1}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/game-typing}"
SITE_URL="${SITE_URL:-https://type.mineguai.com}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "Deploying Code Typing Lab"
echo "Branch: ${BRANCH}"
echo "Target: ${REMOTE_HOST}:${REMOTE_PATH}"

if [[ -n "$(git status --short)" ]]; then
    echo "Working tree has uncommitted changes. Commit or stash them before deploying."
    exit 1
fi

git push origin "${BRANCH}"

ssh "${REMOTE_HOST}" "set -euo pipefail
cd '${REMOTE_PATH}'
git fetch origin '${BRANCH}'
git checkout '${BRANCH}'
git pull --ff-only origin '${BRANCH}'
git log -1 --oneline
"

echo "Deployed: ${SITE_URL}"
