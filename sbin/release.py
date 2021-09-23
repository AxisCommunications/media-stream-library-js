#!/usr/bin/env python3

import argparse
import json

import utils

parser = argparse.ArgumentParser()
parser.add_argument(
    "level",
    metavar="LEVEL",
    nargs="?",
    default="prerelease",
    choices=[
        "major",
        "minor",
        "patch",
        "premajor",
        "preminor",
        "prepatch",
        "prerelease",
    ],
)
args = parser.parse_args()

with open("package.json", "r") as f:
    data = json.load(f)
    current_version = data["version"]
    next_version = utils.cmd(
        [
            "yarn",
            "semver",
            current_version,
            "--increment",
            args.level,
            "--preid",
            "alpha",
        ]
    )
    next_tag = f"v{next_version}"

    # Generate new commit
    print(f" - Update version to {next_version}")
    utils.cmd(["yarn", "version", "--deferred", next_version])
    utils.cmd(["yarn", "version", "apply", "--all"])

    print(" - Update changelog")
    changelog = utils.cmd(["./sbin/changelog.py", "full", "--release", next_tag])
    with open("CHANGELOG.md", "w") as f:
        f.write(changelog)

    print(" - Create release commit and tag")
    utils.cmd(["git", "add", "-u"])
    utils.cmd(["git", "commit", "-m", next_tag])
    utils.cmd(["git", "tag", "-a", "-m", next_tag, next_tag])
