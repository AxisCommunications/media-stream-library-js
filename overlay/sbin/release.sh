#!/usr/bin/env bash

VERSION=$(jq -r .version package.json)
bash sbin/changelog.sh > CHANGELOG.md && git add CHANGELOG.md
git add -u
git commit -m "v$VERSION"
git tag -a -m "v$VERSION" "v$VERSION"
