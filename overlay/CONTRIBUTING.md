## Contributing

Please use the github issue tracker for any bugs or feature requests,
email sent to the maintainer(s) will probably be ignored.
If you would like to backport a feature from master to a release
branch, also put a ticket for enhancement.

If you would like to contribute bug fixes or new components,
make sure there is an existing issue for it, and make a pull
request referencing the issue.

### Commit messages

We use [conventional commits](https://www.conventionalcommits.org) to write commit messages.
If your changes cause problems with how the library was used before,
don't forget to write `BREAKING CHANGE:` inside the commit message body,
followed by a description of what has changed and how to adapt for it.

### Code formatting

We use [prettier](https://prettier.io/) to automatically format code, and this is verified
during testing (part of linting).
To make sure tests don't fail on format problems, it's recommended to use a prettier plugin
for you editor, or to run `yarn prettier:fix` before committing any changes.

### Continuous integration

Automated tests are run for all pull requests with GitHub Actions, for which
the configuration can be found in the `.github/workflows/ci.yml` file. These
are required to pass before a PR can be merged, so please keep your PR
up-to-date by merging the latest `master` branch.
