## Contributing

Please use the github issue tracker for any bugs or feature requests,
email sent to the maintainer(s) will probably be ignored.
If you would like to backport a feature from master to a release
branch, also put a ticket for enhancement.

If you would like to contribute bug fixes or new components,
make sure there is an existing issue for it, and make a pull
request referencing the issue.

### Development setup

We use yarn v2 to handle package management. Make sure you have `yarn` and
`nodejs` installed.

If you need a proxy to access GitHub, make sure the `YARN_HTTP_PROXY` and
`YARN_HTTPS_PROXY` environment variables are set correctly, or downloading
dependencies will fail.

After running `yarn`, run `yarn dev` to start a development server hosting
the example application. You can make changes to the code and the application
should automatically reload with your changes applied.

### Code formatting

We use [prettier](https://prettier.io/) to automatically format code, and this is verified
during testing (part of linting).
To make sure tests don't fail on format problems, it's recommended to use a prettier plugin
for you editor, or to run `yarn prettier:fix` before committing any changes.

### Commits

We use [conventional commits](https://www.conventionalcommits.org) to write commit messages.
If your changes cause problems with how the library was used before,
don't forget to write `BREAKING CHANGE:` inside the commit message body,
followed by a description of what has changed and how to adapt for it.

If a commit is a fix or feature that affects the version number,
you should run `yarn version -d <level>` where `<level>` is either
`patch`, `minor`, or `major`. This will create a file under `.yarn/versions`
that needs to be added to your commit. These files are used during
release to determine the appropriate version number.

### Continuous integration

Automated tests are run for all pull requests with GitHub Actions, for which
the configuration can be found in the `.github/workflows/ci.yml` file. These
are required to pass before a PR can be merged, so please keep your PR
up-to-date by merging the latest `master` branch.

## Releases

When tags are pushed, an automated deploy will release to both Github and NPM.
Any tags that are prereleases will be tagged `next` for NPM, otherwise `latest`
is used.

To release, make sure you are on the master branch and run:

```
yarn release
git push --follow-tags
```

after which the pushed tag will cause a build + deploy through GitHub Actions.
