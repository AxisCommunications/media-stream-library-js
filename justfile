set shell := ["bash", "-uc"]

export PATH := "./node_modules/.bin" + ":" + join(justfile_directory(), "node_modules/.bin") + ":" + env_var('PATH')

# just setup -- default when running just with no command
default:
    just install

# run biome
biome *args:
    cd {{ invocation_directory() }} && biome {{ args }}

# build all packages
build:
    tsc -p tsconfig.types.json
    node esbuild.mjs

# list changed files since branched off from origin/main
@changed:
    git diff --diff-filter=d --name-only $(git merge-base --fork-point origin/main)

# check if there are uncommitted changes
@check-dirty:
    git diff --quiet || (echo "worktree dirty!"; git diff; exit 1)

# CI verification
ci:
    just lint
    just test
    just build
    just check-dirty

# report coverage information after running tests
coverage *args='--src=src/ -r text --all':
    c8 report -a {{ args }}

# autofix and format changed files
format +FILES="`just changed`":
    just biome check --write {{ FILES }}

# install dependencies
install:
    CYPRESS_INSTALL_BINARY=0 && yarn install --immutable

# check lint rules and formatting for changed files
lint:
    just biome check .

# start an example RTSP over WebSocket server
rtsp-ws:
    #!/usr/bin/env bash
    set -euo pipefail
    trap "kill 0" EXIT
    scripts/rtsp-server.sh &
    scripts/ws-rtsp-proxy.mjs 8854:8554 8855:8555 >& ws-rtsp-proxy.log &
    wait

# statically serve a directory
serve path *args='--bind 0.0.0.0':
    http-server {{ path }} {{ args }}

# get the complete SHA ID for a commit
@sha $commitish='HEAD':
    git rev-parse $commitish

# run the default dev setup
run sub:
    just _run-{{ sub }}

# run all unit tests
test:
    just uvu
    just coverage

# run UVU tests for a workspace (tests/ directory)
uvu pattern='': (_clear-tests)
    esbuild --bundle --format=esm --outdir=tests/build --packages=external --platform=node --sourcemap=inline \
        $(glob 'tests/**/*{{pattern}}*.test.{ts,tsx}')
    c8 -r none --clean=false -- uvu tests/build '.*{{pattern}}.*\.test\.js$'

#
# hidden commands (these can be run but they are not shown with just --list)
#

_clear-tests:
    if [[ -d tests/build ]]; then rm -r tests/build; fi

_copy-player-bundle dst:
    cp msl-player.min.js {{ dst }}
    cp msl-player.min.js.map {{ dst }}

_copy-streams-bundle dst:
    cp msl-streams.min.js {{ dst }}
    cp msl-streams.min.js.map {{ dst }}

_run-example-overlay-react: build
    cd example-overlay-react && node vite.mjs

_run-example-player-react: build
    cd example-player-react && node vite.mjs

_run-example-player-webcomponent: build (_copy-player-bundle "example-player-webcomponent")
    just serve example-player-webcomponent

_run-example-streams-node: build
    cd example-streams-node && node player.mjs

_run-example-streams-web: build (_copy-streams-bundle "example-streams-web")
    #!/usr/bin/env bash
    set -euo pipefail
    trap "kill 0; wait" EXIT
    just rtsp-ws &
    just serve example-streams-web &
    wait -n

_run-overlay: build
    echo "no direct playground for overlay, running example-overlay-react instead"
    just _run-example-overlay-react

_run-player:
    node esbuild.mjs
    node vite-player.mjs

_run-streams: build
    echo "no direct playground for streams, running example-streams-web instead"
    just _run-example-streams-web

