#!/usr/bin/env python

import argparse
import sys
import subprocess

import utils


parser = argparse.ArgumentParser(
    description="""
If no range is given, HEAD~..HEAD is used (so only the latest commit
will be checked).

Note that the a range fa56eb..HEAD does not include the fa56eb commit
(to start from e.g. fa56eb, you would write fa56eb~..HEAD to use the parent
as starting point).

Check if message conforms to a conventional commit message, see
https://www.conventionalcommits.org/en/v1.0.0/#specification
"""
)
parser.add_argument(
    "range", metavar="RANGE", type=str, nargs="?", default="HEAD~..HEAD"
)
args = parser.parse_args()


for sha in utils.cmd(["git", "rev-list", args.range]).split():
    message = utils.cmd(["git", "log", "-1", "--format=%s", sha])
    try:
        data = utils.conventional_commit_parse(message)
        print("ok:", message)
    except:
        print("ERROR:", message)
        sys.exit(1)
