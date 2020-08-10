#!/usr/bin/env bash

declare -A GROUP_TITLE=( ["fix"]="Bug fixes" ["chore"]="Maintenance" ["feat"]="Features" )

tags=$(git tag --list --sort='-version:refname' --merged HEAD)
set -- $tags

echo "# Changelog"
echo
echo "All notable changes to this project will be documented in this file."

while (( "$#" > 1 )); do
  date=$(git log -1 --format="%ci" $1)
  echo
  echo "## $1 ($date)"
  GROUP=""
  git log --no-merges --date-order --format="%s" $2..$1^1 | sort | while read -r line
  do
    if [[ "$line" =~ ^(fix|feat|chore)(\(.*\))?!?:(.*)$ ]]; then
        NEXT_GROUP=${BASH_REMATCH[1]}
        if [[ $GROUP != $NEXT_GROUP ]]; then
          GROUP=$NEXT_GROUP
          echo
          echo "### ${GROUP_TITLE[${GROUP}]}"
          echo
        fi
        echo "  - ${BASH_REMATCH[3]}"
    fi
  done
  shift
done