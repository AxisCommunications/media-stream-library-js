#!/usr/bin/env bash

# Generate new commit
if [[ ! -d .yarn/version ]]; then
  yarn version patch
fi
yarn version apply --all
VERSION=$(jq -r .version package.json)
git add -u
git commit -m "v$VERSION"
git tag "v$VERSION"

# Update changelog (requires tag)
bash sbin/changelog.sh > CHANGELOG.md && git add CHANGELOG.md
git tag -d "v$VERSION"
git commit --amend --no-edit
git tag -a -m "v$VERSION" "v$VERSION"
