#!/bin/zsh
# Broadridge EDS migration — final delivery.
# Everything is already built and uploaded:
#   • EDS code repo: ./broadridge (committed, remote set to paolomoz/broadridge)
#   • DA content: 2,216 docs uploaded to https://da.live/#/paolomoz/broadridge
# This script performs the two steps that were permission-blocked in the
# autonomous session: GitHub repo creation + Code Sync, then previews/publishes.
set -e
cd "$(dirname "$0")"

echo "== 1/6 create repo from boilerplate template =="
gh api -X POST repos/adobe/aem-boilerplate/generate -f owner=paolomoz -f name=broadridge -F private=false || true
until gh api repos/paolomoz/broadridge/commits --jq '.[0].sha' 2>/dev/null | grep -q .; do sleep 3; done

echo "== 2/6 push replica code =="
cd broadridge
git push -f origin main
cd ..

echo "== 3/6 add repo to AEM Code Sync installation =="
set -a; source /Users/paolo/.claude/.env; set +a
REPO_ID=$(gh api repos/paolomoz/broadridge --jq .id)
GH_TOKEN=$GH_PAT gh api -X PUT "/user/installations/27711897/repositories/$REPO_ID"

echo "== 4/6 wait for code sync =="
for i in {1..18}; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' https://main--broadridge--paolomoz.aem.page/scripts/aem.js)
  [ "$CODE" = "200" ] && break
  sleep 10
done
[ "$CODE" = "200" ] || { echo "code sync did not complete — use https://tools.aem.live/bot/setup?site=broadridge&org=paolomoz&url=https%3A%2F%2Fcontent.da.live%2Fpaolomoz%2Fbroadridge%2F"; exit 1; }
curl -s https://admin.hlx.page/sidekick/paolomoz/broadridge/main/config.json | grep -q content.da.live/paolomoz/broadridge && echo "content source OK"

echo "== 5/6 bulk preview + publish (admin.hlx.page bulk API) =="
python3 stardust/scripts/da-publish.py

echo "== 6/6 smoke check =="
curl -s -o /dev/null -w "home: %{http_code}\n" https://main--broadridge--paolomoz.aem.live/
curl -s -o /dev/null -w "press-hub: %{http_code}\n" https://main--broadridge--paolomoz.aem.live/press-hub
curl -s "https://main--broadridge--paolomoz.aem.live/query-index.json?limit=1" | head -c 200; echo
echo "Done. Author: https://da.live/#/paolomoz/broadridge · Live: https://main--broadridge--paolomoz.aem.live/"
echo "Optional follow-ups: media rehost pass (register R1), form endpoint wiring (R6), Typekit domain allowlist (R2)."
