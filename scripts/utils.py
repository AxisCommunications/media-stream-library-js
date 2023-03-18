import re
import subprocess
import sys
import typing

possible_types = ["feat", "fix", "refactor", "docs", "chore", "ci"]

types = "|".join(possible_types)

re_conventional_commit_header = re.compile(fr"^({types})(?:\(([^\)]+)\))?(!?): (.*)$")


def conventional_commit_parse(message: str):
    match = re.fullmatch(re_conventional_commit_header, message)

    if match is None:
        raise Exception()

    type, scope, breaking, header = match.groups()

    return {
        "type": type,
        "scope": scope,
        "breaking": breaking == "!",
        "description": header,
    }


def cmd(cmd: typing.List[str]) -> str:
    """ Call shell command and return the result """
    try:
        return subprocess.check_output(cmd, encoding="utf-8").strip()
    except subprocess.CalledProcessError as exc:
        print(exc.output)
        print(f"'{' '.join(cmd)} failed with exit code '{exc.returncode}'")
        sys.exit(exc.returncode)
