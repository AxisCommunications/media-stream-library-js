## Contributing

Development happens on the `master` branch. When a release is
being prepared, it is tagged on that branch with a `vX.0.0-rc#`
tag, and released to npm with the `next` tag. Typically,
releases that start from the `master` branch will increase
the major version number.
After release, changes are continued on a `X-rel` branch.
On that branch, bugfixes will increase the patch number, while
backported features (that don't break the interface) will
increase the minor version number.

Please use the github issue tracker for any bugs or feature requests,
email sent to the maintainer(s) will probably be ignored.
If you would like to backport a feature from master to a release
branch, also put a ticket for enhancement.

If you would like to contribute bug fixes or new components,
make sure there is an existing issue for it, and make a pull
request referencing the issue.

If your changes cause problems with how the library was used
before, please write `[breaking]` att the beginning of the commit
title (and pull request if applicable), and describe what has
changed in the commit message.

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
