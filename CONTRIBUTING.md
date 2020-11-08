## Contributing

Please use the github issue tracker for any bugs or feature requests,
email sent to the maintainer(s) will probably be ignored.
If you would like to backport a feature from master to a release
branch, also put a ticket for enhancement.

If you would like to contribute bug fixes or new components,
make sure there is an existing issue for it, and make a pull
request referencing the issue.

We use [conventional commits](https://www.conventionalcommits.org) to write commit messages.
If your changes cause problems with how the library was used before,
don't forget to write `BREAKING CHANGE:` inside the commit message body,
followed by a description of what has changed and how to adapt for it.

We use `node` and `yarn` for any development related things, so make sure you
have those installed. If you want to run the examples against a test RTSP server,
you'll need to have a working `docker` environment with access to docker hub.

### Testing

Make sure your changes pass linting and unit testing locally to save time with your PR,
by running `yarn test`.
If you add a new feature, please write a new unit test to catch any future regressions.

Most components have unit tests, and basic proper behaviour is always
tested, but we don't have full coverage (yet) of all the component code.
If you contribute a new component, please make sure it has appropriate
unit tests with sufficient coverage.

### Code formatting

We use [prettier](https://prettier.io/) to automatically format code, and this is verified
during testing (part of linting).
To make sure tests don't fail on format problems, it's recommended to use a prettier plugin
for you editor, or to run `yarn prettier:fix` before committing any changes.

## Getting started

After cloning this repository, run `yarn` to install all dependencies.
The easiest way to get started is to get the examples up and running,
so you can test any changes you make.

There are two sets of examples: those that expect a camera backend,
and those that work with a test video provided by an RTSP server that
you can run locally via this library.

Run `yarn dev` to build the library, run a local RTSP test server, and serve
the examples. You'll see a link to a port on `localhost` (usually 8080).

## Creating PRs

Whenever you want to apply your changes to the upstream repository,
you can create a pull request (PR). You can find general information
on making pull requests on GitHub.

When you are ready to push your changes,
make sure you include a proper version strategy in your commit by running:

```
yarn version <strategy> --deferred
```

where you should select a `<strategy>` based on if your changes introduce
(possible) breaking changes (`major`), new feature additions (`minor`),
or just fixes a bug (`patch`).

The command will generate a file in `.yarn/versions` that should be committed
together with your changes.

## Continuous integration

### Verification

Automated tests are run on the master branch and pull requests with GitHub Actions,
for which the configuration can be found in the `.github/workflows/verify.yml` file.
These tests always need to pass before a PR can be merged.

### Releases

When tags are pushed, an automated deploy will release to both Github and NPM, which
can be found in `.github/workflows/publish.yml`.
Any tags that are prereleases will be tagged `next` for NPM, otherwise `latest` is used.

To release, make sure you are on the master branch and run:

```
yarn release
git push --follow-tags
```

after which the pushed tag will cause a build + deploy through GitHub Actions.
