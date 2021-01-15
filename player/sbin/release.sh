#!/usr/bin/env bash

LEVEL=$1
if [[ -z "$LEVEL" ]]; then
  LEVEL="prerelease"
fi

CURRENT_VERSION=$(jq -r .version package.json)
NEXT_VERSION=$(yarn semver ${CURRENT_VERSION} --increment ${LEVEL} --preid alpha)

# Generate new commit
yarn version --deferred "${NEXT_VERSION}"
yarn version apply --all

echo "<<< Update changelog >>>"
sbin/changelog.sh -u "v${NEXT_VERSION}"

echo "<<< Commit all changes and tag the new version >>>"
git add -u
git commit -m "v$NEXT_VERSION"
git tag -a "v$NEXT_VERSION" -m "v$NEXT_VERSION"
