#!/usr/bin/env bash
# Pulls the analysis results into sonar-report.json and the job summary,
# then fails if open BLOCKER/HIGH issues exceed SAYG_MAX_BLOCKERS.
set -euo pipefail

url="${SONAR_HOST_URL:?}"
key="${SONAR_PROJECT_KEY:?}"
max="${SAYG_MAX_BLOCKERS:-0}"

api() { curl -fsS -u "$SONAR_TOKEN:" "$url/api/$1"; }

gate=$(api "qualitygates/project_status?projectKey=$key")
measures=$(api "measures/component?component=$key&metricKeys=ncloc,coverage,duplicated_lines_density,security_rating,reliability_rating,sqale_rating,security_hotspots")
severe=$(api "issues/search?components=$key&resolved=false&impactSeverities=BLOCKER,HIGH&ps=100")
security=$(api "issues/search?components=$key&resolved=false&impactSoftwareQualities=SECURITY&ps=100")
hotspots=$(api "hotspots/search?project=$key&status=TO_REVIEW&ps=100")

jq -n \
  --arg commit "${GITHUB_SHA:-unknown}" \
  --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson gate "$gate" --argjson measures "$measures" \
  --argjson severe "$severe" --argjson security "$security" --argjson hotspots "$hotspots" '{
    commit: $commit, date: $date,
    quality_gate: $gate.projectStatus.status,
    measures: ($measures.component.measures | map({(.metric): .value}) | add),
    severe_open: $severe.paging.total,
    security_open: $security.paging.total,
    hotspots_to_review: $hotspots.paging.total,
    severe: [$severe.issues[] | {rule, message, component, line}],
    security: [$security.issues[] | {rule, message, component, line}],
    hotspots: [$hotspots.hotspots[] | {securityCategory, vulnerabilityProbability, message, component, line}]
  }' > sonar-report.json

severe_open=$(jq .severe_open sonar-report.json)
{
  echo "## SonarQube: $key"
  echo
  echo "| Quality gate | BLOCKER/HIGH open | Security issues | Hotspots to review |"
  echo "|---|---|---|---|"
  jq -r '"| \(.quality_gate) | \(.severe_open) | \(.security_open) | \(.hotspots_to_review) |"' sonar-report.json
  echo
  echo "### Measures"
  jq -r '.measures | to_entries[] | "- \(.key): \(.value)"' sonar-report.json
} >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

if [ "$severe_open" -gt "$max" ]; then
  echo "Open BLOCKER/HIGH issues: $severe_open (allowed: $max)" >&2
  exit 1
fi
