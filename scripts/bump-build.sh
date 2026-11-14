#!/usr/bin/env bash
# Sets the build number in index.html to <today>.<serial>, e.g. 20261114.1
# The serial counts up for each run on the same day and restarts at 1 on a new day.
# Usage: ./scripts/bump-build.sh
set -euo pipefail

file="$(dirname "$0")/../index.html"
today="$(date +%Y%m%d)"

current="$(grep -o 'Build: [0-9]\{8\}\.[0-9]\+' "$file" | head -n1 | sed 's/Build: //')"
if [[ "${current%%.*}" == "$today" ]]; then
    serial=$(( ${current##*.} + 1 ))
else
    serial=1
fi

new="${today}.${serial}"
sed -i "s/Build: [0-9]\{8\}\.[0-9]\+/Build: ${new}/" "$file"
echo "Build: ${new}"
