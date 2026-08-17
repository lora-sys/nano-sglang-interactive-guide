#!/usr/bin/env bash
set -euo pipefail

OWNER=${1:?usage: publish-github.sh OWNER [REPO]}
REPO=${2:-nano-sglang-interactive-guide}

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required: https://cli.github.com/" >&2
  exit 1
fi

git init
git branch -M main
git add .
git commit -m "feat: initial nano-sglang interactive guide"
gh repo create "$OWNER/$REPO" --public --source=. --remote=origin --push

echo "Next: Settings → Pages → Build and deployment → Source → GitHub Actions"
echo "Expected URL: https://$OWNER.github.io/$REPO/"
