#!/usr/bin/env bash

function usage {
  cat <<EOF
  Usage: $(basename $0) [OPTIONS...]

  Generate or update a CHANGELOG.md file.

  Options:
    -u|--update VERSION   Update CHANGELOG.md with all changes
                          between the current HEAD (using VERSION)
                          and most recently change CHANGELOG.md.
EOF
}

GITHUB_COMPARE_URL="https://github.com/AxisCommunications/media-stream-library-js/compare"
GITHUB_COMMIT_URL="https://github.com/AxisCommunications/media-stream-library-js/commit"

MERGED_TAGS=$(git -c versionsort.suffix=-alpha tag --list --sort='-version:refname' --merged HEAD)

while (( "$#" )); do
  case "$1" in
    -u|--update)
      if [ -n "$2" ] && [ ${2:0:1} != "-" ]; then
        UPDATE_VERSION=$2
        shift 2
      else
        echo "Error: Argument for $1 is missing" >&2
        exit 1
      fi
      ;;
    *) # unsupported flags/params
      echo "Error: Unsupported flag $1" >&2
      exit 1
      ;;
  esac
done

# Go through the options and adjust the new
# arguments to be used later for looping through commits.
CHANGELOG="CHANGELOG.md"
if [[ -n "$UPDATE_VERSION" ]]; then
  echo "Generate changelog from HEAD as version $UPDATE_VERSION"
  set -- HEAD $MERGED_TAGS
else
  echo "Generate changelog from most recent tag"
  set -- $MERGED_TAGS
fi

cat <<EOF > ${CHANGELOG}
# Changelog

All notable changes to this project will be documented in this file.

EOF

declare -A GROUP_TITLE=( \
  ["fix"]="Bug fixes" \
  ["feat"]="Features" \
  ["chore"]="Maintenance" \
  ["docs"]="Documentation" \
  ["refactor"]="Documentation" \
)

while (( "$#" > 1 )); do
  date=$(git log -1 --format="%ci" $1)
  if [[ "$1" == "HEAD" ]]; then
    version=$UPDATE_VERSION
    range="$2..$1"
  else
    version=$1
    range="$2..$1^1"
  fi
  echo "## [$version]($GITHUB_COMPARE_URL/$2...$version) ($date)" >> ${CHANGELOG}
  CURRENT_GROUP=""
  git log --no-merges --date-order --format="%H%x09%s" ${range} | sort --key=2 -t $'\t' | while read -r sha_msg
  do
    sha=$(echo "$sha_msg" | cut -c 1-40)
    msg=$(echo "$sha_msg" | cut -c 42-)
    shortsha=$(git log -1 --format="%h" "$sha")
    if [[ "$msg" =~ ^(fix|feat|chore|docs|refactor)[^\(]*(\((.+)\))?!?:[[:space:]](.*)$ ]]; then
        GROUP=${BASH_REMATCH[1]}
        SUBGROUP=${BASH_REMATCH[3]}
        MESSAGE=${BASH_REMATCH[4]}
        if [[ $GROUP != $CURRENT_GROUP ]]; then
          CURRENT_GROUP=$GROUP
          echo >> ${CHANGELOG}
          echo "### ${GROUP_TITLE[${GROUP}]}" >> ${CHANGELOG}
          echo >> ${CHANGELOG}
        fi
        prefix="  - "
        if [[ ! -z "${SUBGROUP}" ]]; then
          prefix="  - **${SUBGROUP}**: "
        fi
        postfix=" ([$shortsha]($GITHUB_COMMIT_URL/$sha))"
        if [[ "$msg" =~ ^(fix|feat|chore|docs|refactor)(\(.*\))?!: ]]; then
          echo "${prefix}**BREAKING** ${MESSAGE}${postfix}" >> ${CHANGELOG}
        else
          echo "${prefix}${MESSAGE}${postfix}" >> ${CHANGELOG}
        fi
    fi
  done
  if [[ -z "$CURRENT_GROUP" ]]; then
    echo >> ${CHANGELOG}
  fi
  shift
done
