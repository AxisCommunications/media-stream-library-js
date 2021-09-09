#!/usr/bin/env python3

import argparse
import re
import subprocess
import sys

import utils

#
# Stop immediately if version too old.
#
_MINIMUM_PYTHON_VERSION = "3.7"
if sys.version_info < tuple(map(int, _MINIMUM_PYTHON_VERSION.split("."))):
    raise Exception(
        f"You need Python >= {_MINIMUM_PYTHON_VERSION}, but you are running {sys.version}"
    )

GITHUB_COMPARE_URL = (
    "https://github.com/AxisCommunications/media-stream-library-js/compare"
)
GITHUB_COMMIT_URL = (
    "https://github.com/AxisCommunications/media-stream-library-js/commit"
)

GROUP_TITLES = {
    "feat": "✨ Features",
    "fix": "🐞 Bug fixes",
    "refactor": "♻️ Refactoring",
    "docs": "📚 Documentation",
    "chore": "⚙️ Maintenance",
    "ci": "🚦 Continous integration",
}


def changelog_part(commitish_to: str, commitish_from: str, version: str):
    date = utils.cmd(["git", "log", "-1", "--format=%ci", commitish_to])

    commit_range = (
        f"{commitish_from}..HEAD"
        if commitish_to == "HEAD"
        else f"{commitish_from}..{commitish_to}~"
    )

    commits = utils.cmd(
        ["git", "log", "--no-merges", "--date-order", "--format=%H%x09%s", commit_range]
    )

    if commits == "":
        return ""

    messages = {}

    for commit in commits.split("\n"):
        sha, msg = commit.split(maxsplit=1)
        shortsha = utils.cmd(["git", "log", "-1", "--format=%h", sha])

        try:
            data = utils.conventional_commit_parse(msg)
            messages.setdefault(data["type"], []).append(
                {**data, "sha": sha, "shortsha": shortsha}
            )
        except:
            # No conventional commit
            pass

    content = [
        f"## [{version}]({GITHUB_COMPARE_URL}/{commitish_from}...{version}) ({date})"
    ]

    for group in GROUP_TITLES.keys():
        if group not in messages:
            continue

        content.append(f"\n### {GROUP_TITLES[group]}\n")

        for data in messages[group]:

            prefix = (
                f'  - **{data["scope"]}**: ' if data["scope"] is not None else "  - "
            )
            postfix = f' ([{data["shortsha"]}]({GITHUB_COMMIT_URL}/{data["sha"]}))'

            if data["breaking"]:
                content.append(f'{prefix}**BREAKING** {data["description"]}{postfix}')
            else:
                content.append(f'{prefix} {data["description"]}{postfix}')

    return "\n".join(content)


HEADER = """
# Changelog

All notable changes to this project will be documented in this file.

"""


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate or update a CHANGELOG.md file."
    )

    parser.add_argument(
        "-s",
        "--skip-header",
        action="store_true",
        help="Don't include a changelog header",
    )

    subparsers = parser.add_subparsers(
        dest="type", metavar="COMMAND", help='One of "single" or "full".', required=True
    )

    single = subparsers.add_parser(
        "single", description="Generate changelog for a single tag."
    )
    single.add_argument("-t", "--tag", type=str, metavar="TAG")

    full = subparsers.add_parser(
        "full", description="Generate a changelog covering entire history."
    )
    full.add_argument(
        "-r",
        "--release",
        type=str,
        metavar="RELEASE",
        help="New release tag (e.g. vX.Y.Z), includes full changelog with a new entry for things not tagged",
    )

    args = parser.parse_args()

    tags = utils.cmd(
        [
            "git",
            "-c",
            "versionsort.suffix=-alpha",
            "tag",
            "--list",
            "--sort=-version:refname",
            "--merged",
            "HEAD",
        ]
    ).split()

    if args.type == "single":
        if args.tag is None:
            try:
                args.tag = tags[0]
            except:
                print(f"Error: no tags found!")
                sys.exit(1)
        if args.tag not in tags:
            print(f"Error: tag {args.tag} not found!")
            sys.exit(1)

    if args.type == "full" and args.release is not None:
        tags.insert(0, "HEAD")

    content = [HEADER] if not args.skip_header else []

    for commitish_to, commitish_from in zip(tags[:-1], tags[1:]):
        if args.type == "single" and args.tag != commitish_to:
            continue

        content.append(
            changelog_part(
                commitish_to,
                commitish_from,
                args.release if commitish_to == "HEAD" else commitish_to,
            )
        )
        content.append("")

    sys.stdout.write("\n".join(content))
    sys.stdout.close()
