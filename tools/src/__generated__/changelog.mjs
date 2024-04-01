#!/usr/bin/env node

// src/changelog/cli.ts
import fs from 'node:fs'
import {
  binary,
  command,
  option,
  optional,
  positional,
  run,
  string,
} from 'cmd-ts'

// src/changelog/git.ts
import { execSync } from 'node:child_process'
function sanitizeGitHubUrl(url) {
  if (new URL(url).hostname !== 'github.com') {
    throw new Error('not implemented: only GitHub repositories are supported')
  }
  return url.replace(/\.git$/, '')
}
var compareUrl = (url, range) => `${sanitizeGitHubUrl(url)}/compare/${range}`
var commitUrl = (url, commit) => `${sanitizeGitHubUrl(url)}/commit/${commit}`
function gitLogFromRange(range) {
  try {
    const logOut = execSync(
      `git log --no-merges --date-order --format="%H%x09%s" ${range}`
    )
    const lines = logOut.toString().trim().split('\n')
    const shaMessagePairs = lines.map((line) => line.split('	'))
    return shaMessagePairs
  } catch (err) {
    console.warn(
      `git log failed on range ${range}, one of those tags probably does not exist`
    )
    return []
  }
}
function shortSha(sha) {
  return execSync(`git log -1 --format=%h ${sha}`).toString().trim()
}

// src/changelog/changeset.ts
var GroupTitles = {
  build: '\u{1F477} Build',
  chore: '\u{1F6A7} Maintenance',
  ci: '\u{1F6A6} Continous integration',
  docs: '\u{1F4DD} Documentation',
  feat: '\u2728 Features',
  fix: '\u{1F41B} Bug fixes',
  perf: '\u{1F3CE}\uFE0F Performance',
  refactor: '\u267B\uFE0F Refactoring',
  revert: '\u23EA\uFE0F Reverts',
  style: '\u{1F484} Styling',
  test: '\u{1F9EA} Test',
}
var GroupKeys = new Set(Object.keys(GroupTitles))
function changeset({ date, name, range, scope, url }) {
  return [
    changesetHeader({ date, name, range, url }),
    changesetBody({ range, scope, url }),
  ].join('')
}
function changesetHeader({ date, name, range, url }) {
  if (url !== void 0) {
    return `## [${name}](${compareUrl(url, range)}) (${date})
`
  }
  return `## ${name} (${date})
`
}
function changesetBody({ range, scope, url }) {
  const outputChunks = []
  const groups = {}
  for (const [sha, msg] of gitLogFromRange(range)) {
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
      const scopePrefix =
        scope === void 0 && cc.scope !== void 0 ? ` **${cc.scope}**:` : ''
      const breakingPrefix = cc.breaking ? ` **BREAKING**` : ''
      const link =
        url !== void 0
          ? `([${shortSha(sha)}](${commitUrl(url, sha)}))`
          : `(${shortSha(sha)})`
      outputChunks.push(
        `  -${scopePrefix}${breakingPrefix} ${cc.title} ${link}
`
      )
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

// src/changelog/cli.ts
var changesetCli = command({
  name: 'changelog',
  description: `Generate a changelog for a range of commits.`,
  args: {
    name: positional({
      type: string,
      description: 'name for the changes (used in header)',
      displayName: 'name',
    }),
    range: positional({
      type: string,
      description: 'range of the changes (git revision range)',
      displayName: 'range',
    }),
    date: option({
      description: 'date of the changeset',
      long: 'date',
      short: 'd',
      defaultValue: () => /* @__PURE__ */ new Date().toISOString(),
      type: string,
    }),
    outfile: option({
      description: 'output file to write to',
      long: 'outfile',
      short: 'o',
      type: optional(string),
    }),
    scope: option({
      description:
        'Only include conventional commits that match "...(<scope>): ..."',
      long: 'scope',
      short: 's',
      type: optional(string),
    }),
    url: option({
      description: 'GitHub URL of the repository',
      long: 'url',
      short: 'u',
      type: optional(string),
    }),
  },
  handler(args) {
    const contents = changeset({
      date: args.date,
      name: args.name,
      range: args.range,
      scope: args.scope,
      url: args.url,
    })
    if (args.outfile !== void 0) {
      fs.writeFileSync(args.outfile, contents)
    } else {
      process.stdout.write(contents)
    }
  },
})
await run(binary(changesetCli), process.argv)
