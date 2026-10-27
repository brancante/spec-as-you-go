#!/usr/bin/env bash
# Read-only snapshot of a repository for sayg-discover. Prints Markdown.
# Usage: repo-snapshot.sh [repo-dir]
set -uo pipefail

dir="${1:-.}"
cd "$dir" || { echo "No such directory: $dir" >&2; exit 1; }

in_git=false
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && in_git=true
has_commits=false
$in_git && git rev-parse --verify -q HEAD >/dev/null && has_commits=true

if $in_git; then
  mapfile -d '' files < <(git ls-files -z --cached --others --exclude-standard)
else
  mapfile -d '' files < <(find . -type f -not -path './.git/*' -not -path '*/node_modules/*' -printf '%P\0')
fi

list() { printf '%s\n' "${files[@]}"; }
has() { list | grep -Eq "$1" && echo "yes |" || echo "no |"; }

source_re='\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|scala|rb|php|cs|swift|c|h|cpp|hpp|vue|svelte|sql|sh)$'
test_re='(^|/)(tests?|__tests__|spec)/|[._-](test|spec)\.[A-Za-z]+$'

echo "# Repo snapshot: $(basename "$(pwd)")"
echo
echo "_Generated $(date -u +%Y-%m-%d) by repo-snapshot.sh (read-only)_"
echo
echo "## Size"
src_count=$(list | grep -Ec "$source_re")
src_lines=0
if [ "$src_count" -gt 0 ]; then
  src_lines=$(list | grep -E "$source_re" | tr '\n' '\0' | xargs -0 cat 2>/dev/null | wc -l)
fi
echo "- Files: ${#files[@]}"
echo "- Source files: $src_count ($src_lines lines)"
echo "- Test files (source): $(list | grep -E "$source_re" | grep -Ec "$test_re")"
echo
echo "## Languages (top 10 by file count)"
list | sed -n 's/.*\.\([A-Za-z0-9]\{1,8\}\)$/\1/p' | sort | uniq -c | sort -rn | head -10 \
  | awk '{printf "- %s: %s\n", $2, $1}'
echo
echo "## Signals"
echo "| Signal | Present |"
echo "|---|---|"
echo "| README | $(has '^README')"
echo "| LICENSE | $(has '^(LICENSE|COPYING)')"
echo "| CLAUDE.md / AGENTS.md | $(has '(^|/)(CLAUDE|AGENTS)\.md$')"
echo "| CI workflows | $(has '^\.github/workflows/|^\.gitlab-ci\.yml$|^\.circleci/|^azure-pipelines')"
echo "| Container | $(has '(^|/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$')"
echo "| Lockfile | $(has '(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|uv\.lock|Pipfile\.lock|go\.sum|Cargo\.lock|Gemfile\.lock|composer\.lock)$')"
echo "| Lint / format config | $(has '(^|/)(\.eslintrc[^/]*|eslint\.config\.[a-z]+|biome\.jsonc?|\.prettierrc[^/]*|ruff\.toml|\.golangci\.[a-z]+|\.rubocop\.yml)$')"
echo "| Type checking | $(has '(^|/)(tsconfig\.json|mypy\.ini|pyrightconfig\.json)$')"
echo "| Docs folder | $(has '^docs/')"
echo "| Sonar config | $(has '(^|/)sonar-project\.properties$')"
echo "| .sayg/ | $(has '^\.sayg/')"
env_files=$(list | grep -E '(^|/)\.env($|\.)' | grep -Ev '\.(example|sample|template|dist)$' || true)
if [ -n "$env_files" ]; then
  echo "| **Committed .env files** | **yes**: $(echo "$env_files" | tr '\n' ' ')|"
else
  echo "| Committed .env files | no |"
fi
echo
echo "## Largest source files (lines)"
if [ "$src_count" -gt 0 ]; then
  list | grep -E "$source_re" | tr '\n' '\0' | xargs -0 wc -l 2>/dev/null | grep -v ' total$' \
    | sort -rn | head -5 | awk '{printf "- %s: %s\n", $2, $1}'
else
  echo "- none"
fi
echo
echo "## History"
if $has_commits; then
  echo "- Commits: $(git rev-list --count HEAD)"
  echo "- First commit: $(git log --reverse --format=%as | head -1)"
  echo "- Last commit: $(git log -1 --format=%as)"
  echo
  echo "### Contributors (top 5 by commits)"
  git shortlog -sn --no-merges HEAD | head -5 | awk '{c=$1; $1=""; printf "-%s: %s\n", $0, c}'
  total=$(git rev-list --count --no-merges HEAD)
  top=$(git shortlog -sn --no-merges HEAD | head -1 | awk '{print $1}')
  if [ "${total:-0}" -gt 0 ]; then
    echo
    echo "- Top contributor share: $((100 * ${top:-0} / total))%"
  fi
  echo
  echo "### Churn hotspots (files changed most in the last 12 months)"
  git log --since=12.months --no-merges --name-only --format= \
    | grep -E "$source_re" | sort | uniq -c | sort -rn | head -10 \
    | awk '{printf "- %s: %s changes\n", $2, $1}'
else
  echo "- No commit history available"
fi
