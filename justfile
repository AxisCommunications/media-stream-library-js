set shell := ["bash", "-uc"]

export PATH := "./node_modules/.bin" + ":" + join(justfile_directory(), "node_modules/.bin") + ":" + env_var('PATH')

# just setup -- default when running just with no command
default:
    just install

# run biome
biome *args:
    cd {{ invocation_directory() }} && biome {{ args }}

# build all packages
build: _build-streams _build-player _build-overlay

# list changed files since branched off from origin/main
@changed:
    git diff --diff-filter=d --name-only $(git merge-base --fork-point origin/main)

# create a changelog
changelog:
    #!/usr/bin/env bash
    set -euo pipefail
    new_version="$(jq -r .version package.json)"
    old_version="$(git show HEAD:package.json | jq -r .version)"
    url="$(jq -r .repository.url package.json)"
    range=$(just sha v$old_version)..$(just sha HEAD)
    changelog $new_version $range --url $url --outfile=CHANGELOG.md

# check if there are uncommitted changes in the workspace
@check-dirty:
    git diff --quiet || (echo "workspace dirty!"; git diff; exit 1)

# report coverage information after running tests
coverage workspace *args='--src=src/ -r text --all':
    cd {{workspace}} && c8 report -a {{ args }}


# run esbuild, WORKSPACE=(overlay|player|streams)
esbuild workspace *args:
    cd {{ workspace }} && node esbuild.mjs {{ args }}
    
# autofix and format changed files
format +FILES="`just changed`":
    just biome check --write {{ FILES }}

# install dependencies
install:
    CYPRESS_INSTALL_BINARY=0 && yarn install --immutable

# check lint rules and formatting for changed files
lint workspace:
    just biome check {{ workspace }}

# check for updates
ncu *args:
    ncu --root --workspaces {{ args }}

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

# generate tools
tools:
    cd tools && esbuild --platform=node --outfile=src/__generated__/changelog.mjs --format=esm --out-extension:.js=.mjs --bundle --external:cmd-ts src/changelog/cli.ts
    just biome format --write 'tools/src/__generated__/*'

# CI verification
verify:
    just build
    just lint .
    just test
    just tools
    just check-dirty

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
    just coverage streams

# run tsc in workspace(s) (default current, or all if in project root)
tsc workspace:
    cd {{ workspace }} && tsc -p tsconfig.types.json

# run UVU tests for a workspace (tests/ directory)
uvu workspace pattern='': (_clear-tests workspace)
    cd {{workspace}} && esbuild --bundle --format=esm --outdir=tests/build --packages=external --platform=node --sourcemap=inline \
        $(glob 'tests/**/*{{pattern}}*.test.{ts,tsx}')
    cd {{workspace}} && c8 -r none --clean=false -- uvu tests/build '.*{{pattern}}.*\.test\.js$'


#
# hidden commands (these can be run but they are not shown with just --list)
#

_build-streams: (tsc "streams")
    just esbuild streams

_build-player: _build-streams (tsc "player")
    just esbuild player

_build-overlay: (tsc "overlay")
    just esbuild overlay

_clear-tests workspace:
    cd {{workspace}} && if [[ -d tests/build ]]; then rm -r tests/build; fi

_copy-player-bundle dst:
    cp player/dist/media-stream-player.min.js {{ dst }}
    cp player/dist/media-stream-player.min.js.map {{ dst }}

_copy-streams-bundle dst:
    cp streams/dist/media-stream-library.min.js {{ dst }}
    cp streams/dist/media-stream-library.min.js.map {{ dst }}

_run-example-overlay-react: _build-overlay
    cd example-overlay-react && node vite.mjs

_run-example-player-react: _build-player
    cd example-player-react && node vite.mjs

_run-example-player-webcomponent: _build-player (_copy-player-bundle "example-player-webcomponent")
    just serve example-player-webcomponent

_run-example-streams-node: _build-streams
    cd example-streams-node && node player.cjs

_run-example-streams-web: _build-streams (_copy-streams-bundle "example-streams-web")
    #!/usr/bin/env bash
    set -euo pipefail
    trap "kill 0; wait" EXIT
    just rtsp-ws &
    just serve example-streams-web &
    wait -n

_run-overlay: _build-overlay
    echo "no direct playground for overlay yet, running example-overlay-react instead"
    just _run-example-overlay-react

_run-player: (esbuild 'streams')
    just vite player

_run-streams: _build-streams
    echo "no direct playground for streams yet, running example-streams-web instead"
    just _run-example-streams-web

