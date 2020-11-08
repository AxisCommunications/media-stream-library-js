#!/usr/bin/env bash

if [[ ! -d .yarn/versions ]]; then
  # Update pach number if no versions to be applied
  yarn version patch --deferred
fi

# Apply all deferred version upgrades
yarn version apply --all

# Update changelog and commit new version
NEW_VERSION="v$(jq -r .version package.json)"
bash sbin/changelog.sh -u ${NEW_VERSION}
git add -u
git commit -m ${NEW_VERSION}
git tag -a -m ${NEW_VERSION} ${NEW_VERSION}
