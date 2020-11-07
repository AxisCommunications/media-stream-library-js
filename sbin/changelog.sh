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

# Default "from" revision is the last commit that changed the CHANGELOG.md
FROM_REV=$(git log -1 --format="%H" -- CHANGELOG.md)
MERGED_TAGS=$(git tag --list --sort='-version:refname' --merged HEAD)

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

declare -A GROUP_TITLE=( ["fix"]="Bug fixes" ["feat"]="Features" )

while (( "$#" > 1 )); do
  date=$(git log -1 --format="%ci" $1)
  if [[ "$1" == "HEAD" ]]; then
    version=$UPDATE_VERSION
  else
    version=$1
  fi
  echo "## $version ($date)" >> ${CHANGELOG}
  GROUP=""
  git log --no-merges --date-order --format="%s" $2..$1^1 | sort | while read -r line
  do
    if [[ "$line" =~ ^(fix|feat)(\(.*\))?!?:[[:space:]](.*)$ ]]; then
        NEXT_GROUP=${BASH_REMATCH[1]}
        MESSAGE=${BASH_REMATCH[3]}
        if [[ $GROUP != $NEXT_GROUP ]]; then
          GROUP=$NEXT_GROUP
          echo >> ${CHANGELOG}
          echo "### ${GROUP_TITLE[${GROUP}]}" >> ${CHANGELOG}
          echo >> ${CHANGELOG}
        fi
        if [[ "$line" =~ ^(fix|feat)(\(.*\))?!: ]]; then
          echo "  - *BREAKING* ${MESSAGE}" >> ${CHANGELOG}
        else
          echo "  - ${MESSAGE}" >> ${CHANGELOG}
        fi
    fi
  done
  if [[ -z "$GROUP" ]]; then
    echo >> ${CHANGELOG}
  fi
  shift
done
