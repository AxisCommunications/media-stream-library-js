#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import {
  binary,
  boolean,
  command,
  flag,
  option,
  optional,
  run,
  string,
} from 'cmd-ts'
const ChangeLogHeader = `# Changelog

All notable changes to this project will be documented in this file.
`
const GitHubCompareUrl = 'https://github.com/axteams-software/zeno-web/compare'
const GitHubCommitUrl = 'https://github.com/axteams-software/zeno-web/commit'
const GroupTitles = {
  'build': '\u{1F477} Build',
  'chore': '\u{1F6A7} Maintenance',
  'ci': '\u{1F6A6} Continous integration',
  'docs': '\u{1F4DD} Documentation',
  'feat': '\u2728 Features',
  'fix': '\u{1F41B} Bug fixes',
  'perf': '\u{1F3CE}\uFE0F Performance',
  'refactor': '\u267B\uFE0F Refactoring',
  'revert': '\u23EA\uFE0F Reverts',
  'style': '\u{1F484} Styling',
  'test': '\u{1F9EA} Test',
}
const GroupKeys = new Set(Object.keys(GroupTitles))
const PackageJson = 'package.json'
const changelog = command({
  name: 'changelog',
  description: `Generate a full or partial changelog. Outputs to stdout,
with an option to additionally write to a changelog file.`,
  args: {
    workspace: option({
      description: `
Filter scope by workspace. In this case, the scope itself is not included in the output.
You can use this to only generate changelogs for a specific workspace, if you have
separate releases within the same monorepo for different workspaces.
`,
      long: 'workspace',
      type: optional(string),
    }),
    full: flag({
      defaultValue: () => false,
      description: 'generate the entire changelog',
      long: 'full',
      short: 'f',
      type: boolean,
    }),
    write: option({
      description: 'write (or update) a changelog file',
      long: 'write',
      short: 'w',
      type: optional(string),
    }),
  },
  handler(args) {
    const contents = args.full
      ? generateChangelog(args.workspace)
      : generateChangeset(args.workspace)
    if (args.full) {
      args.write !== void 0
        ? fs.writeFileSync(args.write, contents)
        : process.stdout.write(contents)
    } else {
      args.write !== void 0 && updateChangelog(args.write, contents)
      process.stdout.write(contents)
    }
  },
})
await run(binary(changelog), process.argv)
function generateChangeset(workspace) {
  const packageJson = path.join(workspace ?? '.', PackageJson)
  const toVersion = worktreeVersion(packageJson)
  const fromVersion = committedVersion(packageJson)
  return changeSetFromRange(fromVersion, toVersion, workspace, 'HEAD')
}
function generateChangelog(workspace) {
  const packageJson = path.join(workspace ?? '.', PackageJson)
  const outputChunks = [ChangeLogHeader]
  let toRev = 'HEAD'
  while (existingCommit(toRev)) {
    const version = committedVersion(packageJson, toRev)
    const parentRev = `${tagFromVersion(version, workspace)}~1`
    if (!existingCommit(parentRev)) {
      break
    }
    const previousVersion = committedVersion(packageJson, parentRev)
    outputChunks.push(
      changeSetFromRange(previousVersion, version, workspace)
    )
    toRev = tagFromVersion(previousVersion, workspace)
  }
  return outputChunks.join('\n')
}
function updateChangelog(changelogPath, changeset) {
  const oldChangelogChunks = fs.readFileSync(changelogPath).toString().split(
    '\n'
  )
  const startOfVersions = oldChangelogChunks.findIndex((chunk) =>
    chunk.startsWith('##')
  )
  const newChangelogChunks = [
    ...oldChangelogChunks.slice(0, startOfVersions),
    changeset,
    ...oldChangelogChunks.slice(startOfVersions),
  ]
  const newChangelog = newChangelogChunks.join('\n')
  fs.writeFileSync(changelogPath, newChangelog)
}
function changeSetFromRange(previousVersion, version, scope, rev) {
  const outputChunks = []
  const prevTag = tagFromVersion(previousVersion, scope)
  const tag = tagFromVersion(version, scope)
  const date = rev !== void 0
    ? (/* @__PURE__ */ new Date()).toISOString()
    : commitDate(tag)
  outputChunks.push(
    `## [${version}](${GitHubCompareUrl}/${prevTag}...${tag}) (${date})
`
  )
  const groups = {}
  for (const [sha, msg] of gitLogFromRange(prevTag, rev ?? `${tag}~1`)) {
    const cc = parseConventionalCommitMessage(msg)
    if (scope !== void 0 && cc.scope !== scope) {
      continue
    }
    if (groups[cc.group] === void 0) {
      groups[cc.group] = []
    }
    groups[cc.group].push([sha, cc])
  }
  for (const group of GroupKeys) {
    if (groups[group] === void 0) {
      continue
    }
    outputChunks.push(`
### ${GroupTitles[group]}

`)
    for (const [sha, cc] of groups[group]) {
      const scopePrefix = scope === void 0 && cc.scope !== void 0
        ? ` **${cc.scope}**:`
        : ''
      const breakingPrefix = cc.breaking ? ` **BREAKING**` : ''
      const link = `([${shortSha(sha)}](${GitHubCommitUrl}/${sha}))`
      outputChunks.push(`  -${scopePrefix}${breakingPrefix} ${cc.title} ${link}
`)
    }
  }
  return outputChunks.join('')
}
function parseConventionalCommitMessage(msg) {
  try {
    const match = msg.match(/^([^:!(]+)(?:\(([^)]+)\))?(!)?: (.*)$/)
    if (match === null) {
      throw new Error('no matches found')
    }
    const [_, group, scope, breaking, title] = match
    return {
      group,
      scope,
      breaking: breaking !== void 0,
      title,
    }
  } catch {
    process.stderr.write(`invalid conventional commit message: ${msg}
`)
  }
  return {
    group: 'chore',
    breaking: false,
    title: msg,
  }
}
function existingCommit(commit) {
  try {
    execSync(`git rev-parse -q --verify ${commit}`)
  } catch {
    return false
  }
  return true
}
function worktreeVersion(pkgPath) {
  const { version } = JSON.parse(fs.readFileSync(pkgPath).toString())
  if (typeof version !== 'string') {
    throw new Error(`no version in ${pkgPath}`)
  }
  return version
}
function committedVersion(pkgPath, commit = 'HEAD') {
  const { version } = JSON.parse(
    execSync(`git show ${commit}:${pkgPath}`).toString()
  )
  if (typeof version !== 'string') {
    throw new Error(`no version in ${commit}:${pkgPath}`)
  }
  return version
}
function tagFromVersion(version, scope) {
  if (scope === void 0) {
    return `v${version}`
  }
  return `${scope}-v${version}`
}
function gitLogFromRange(prev, curr = 'HEAD') {
  try {
    const logOut = execSync(
      `git log --no-merges --date-order --format="%H%x09%s" ${prev}..${curr}`
    )
    const lines = logOut.toString().trim().split('\n')
    const shaMessagePairs = lines.map((line) => line.split('	'))
    return shaMessagePairs
  } catch (err) {
    console.warn(
      `git log failed on range ${prev}..${curr}, one of those tags probably does not exist`
    )
    return []
  }
}
function shortSha(sha) {
  return execSync(`git log -1 --format=%h ${sha}`).toString().trim()
}
function commitDate(commit) {
  return execSync(`git log -1 --format=%ci ${commit}`).toString().trim()
}
