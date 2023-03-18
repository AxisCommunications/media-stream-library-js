set shell := ["bash", "-uc"]

export PATH := "./node_modules/.bin:" + env_var('PATH')

# just setup -- default when running just with no command
default:
    just install

# build all packages
build: _build-streams _build-player _build-overlay

# list changed files since branched off from origin/main
@changed:
    git diff --diff-filter=d --name-only $(git merge-base --fork-point origin/main)

# create a changelog or changeset
changelog:
    scripts/changelog.mjs --write=CHANGELOG.md > changeset.md

# format or check files with dprint (default formats all matching files)
dprint +args="fmt":
    cd {{ invocation_directory() }} && dprint {{ args }}

# run esbuild, WORKSPACE=(overlay|player|streams)
esbuild workspace *args:
    cd {{ workspace }} && node esbuild.mjs {{ args }}
    
# run eslint
eslint *args:
    # FIXME: add --no-warning-on-ignored-files when https://github.com/eslint/rfcs/pull/90 is released
    # to avoid warnings when running as part of the lint/format command against changed files.
    cd {{ invocation_directory() }} && eslint --ext "cjs,js,json,jsx,mjs,ts,tsx" --no-error-on-unmatched-pattern --no-cache {{ args }}

# autofix and format changed files
format +FILES="`just changed`":
    just eslint --fix {{ FILES }}
    just dprint fmt {{ FILES }}

# install dependencies
install:
    CYPRESS_INSTALL_BINARY=0 && yarn install --immutable --immutable-cache

# check lint rules and formatting for changed files
lint workspace:
    just eslint {{ workspace }}
    cd {{ workspace }} && just dprint check

# create a prerelease commit, KIND=(new|nightly)
release $level='patch':
    just version $level
    just changelog
    git add -u
    git commit -m "release: $(jq -r .version package.json)"

# start an example RTSP over WebSocket server
rtsp-ws:
    #!/usr/bin/env bash
    set -euo pipefail
    trap "kill 0" EXIT SIGINT
    scripts/rtsp-server.sh &
    scripts/tcp-ws-proxy.cjs >& tcp-ws-proxy.log &
    wait

# statically serve a directory
serve path *args='--bind 0.0.0.0':
    http-server {{ path }} {{ args }}

# update the package version of all workspaces
version $level='prerelease':
    #!/usr/bin/env bash
    current=$(jq -r '.version' package.json)
    next=$(semver -i $level --preid alpha $current)
    echo "update $workspace: $current => $next"
    yarn workspaces foreach version --deferred $next
    yarn version apply --all

# run vite development server, WORKSPACE=(player)
vite WORKSPACE *ARGS:
    cd {{ WORKSPACE }} && node vite.mjs {{ ARGS }}
    
# run the default app for a particular workspace
run workspace:
    just _run-{{ workspace }}

# tag a commit with annotated tag (e.g. just tag v1.2.3 main)
tag tagname commit:
    git tag -a -m {{ tagname }} {{ tagname }} {{ commit }}

# run all unit tests
test:
    just uvu streams

# run tsc in workspace(s) (default current, or all if in project root)
tsc workspace:
    cd {{ workspace }} && tsc

# run uvu to test files matching pattern (path = path to tsconfig.json + tests, e.g. "admx/web", or "iam")
uvu path pattern='.*\.test\.tsx?':
    c8 -r none --clean=false --src={{ path }} -- tsx --tsconfig {{ path }}/tsconfig.json $(just workspace {{ path }})/node_modules/uvu/bin.js {{ path }}/tests/ {{ pattern }}

# get workspace from pathname
@workspace pathname=invocation_directory():
    node scripts/top-level-dir.mjs {{ justfile_directory() }} {{ pathname }}

#
# hidden commands (these can be run but they are not shown with just --list)
#

_build-streams: (tsc "streams")
    just esbuild streams

_build-player: _build-streams (tsc "player")
    just esbuild player

_build-overlay: (tsc "overlay")
    just esbuild overlay

_run-example-overlay-react: _build-overlay
    cd example-overlay-react && node vite.mjs

_run-example-player-react: _build-player
    cd example-player-react && node vite.mjs

_run-example-player-webcomponent: _build-player
    just serve example-player-webcomponent

_run-example-streams-node: _build-streams
    cd example-streams-node && node player.cjs

_run-example-streams-web: _build-streams
    #!/usr/bin/env bash
    set -euo pipefail
    trap "kill 0" EXIT SIGINT
    just rtsp-ws &
    just serve example-streams-web &&
    wait

_run-overlay: _build-overlay
    echo "no direct playground for overlay yet, running example-overlay-react instead"
    just _run-example-overlay-react

_run-player: (esbuild 'streams')
    just vite player

_run-streams: _build-streams
    echo "no direct playground for streams yet, running example-streams-web instead"
    just _run-example-streams-web

