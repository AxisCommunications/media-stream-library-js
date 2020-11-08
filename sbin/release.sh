#!/usr/bin/env bash

# Generate new commit
if [[ ! -d .yarn/versions ]]; then
  yarn version patch
fi
yarn version apply --all
NEW_VERSION=$(jq -r .version package.json)

# Update changelog (requires tag)
bash sbin/changelog.sh -u $NEW_VERSION
git add -u
git commit -m "v$NEW_VERSION"
git tag -a -m "v$NEW_VERSION" "v$NEW_VERSION"
