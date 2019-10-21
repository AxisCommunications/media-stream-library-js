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

Most components have unit tests, and basic proper behaviour is always
tested, but we don't have full coverage (yet) of all the component code.
If you contribute a new component, please make sure it has appropriate
unit tests with sufficient coverage.

You can run all test with:

```
npm run test
```

or

```
yarn test
```
