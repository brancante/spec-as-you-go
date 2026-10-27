#!/usr/bin/env bash
# Starts a throwaway SonarQube Community Build on the runner and exports
# SONAR_HOST_URL and SONAR_TOKEN to later steps. Nothing survives the job:
# use a persistent server for history and new-code quality gates.
set -euo pipefail

image="${SONAR_IMAGE:-sonarqube:community}"
key="${SONAR_PROJECT_KEY:?SONAR_PROJECT_KEY is required}"
url="http://localhost:9000"

docker run -d --name sonarqube -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true "$image" >/dev/null

status=""
for _ in $(seq 1 120); do
  status=$(curl -fs "$url/api/system/status" | jq -r .status 2>/dev/null || true)
  [ "$status" = "UP" ] && break
  sleep 5
done
if [ "$status" != "UP" ]; then
  docker logs sonarqube 2>&1 | tail -50
  echo "SonarQube did not start (last status: ${status:-none})" >&2
  exit 1
fi

pass="Sayg-$(openssl rand -hex 12)-1!"
echo "::add-mask::$pass"
curl -fsS -u admin:admin -X POST "$url/api/users/change_password" \
  --data-urlencode login=admin --data-urlencode previousPassword=admin \
  --data-urlencode "password=$pass"

curl -fsS -u "admin:$pass" -X POST "$url/api/projects/create" \
  --data-urlencode "project=$key" --data-urlencode "name=$key" >/dev/null

token=$(curl -fsS -u "admin:$pass" -X POST "$url/api/user_tokens/generate" \
  --data-urlencode "name=ci-${GITHUB_RUN_ID:-local}" --data-urlencode type=USER_TOKEN | jq -r .token)
echo "::add-mask::$token"

{
  echo "SONAR_HOST_URL=$url"
  echo "SONAR_TOKEN=$token"
} >> "$GITHUB_ENV"
echo "Ephemeral SonarQube ready at $url for project $key"
