#!/usr/bin/env node
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

import { changeset } from './changeset'

const changesetCli = command({
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
      defaultValue: () => new Date().toISOString(),
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
    if (args.outfile !== undefined) {
      fs.writeFileSync(args.outfile, contents)
    } else {
      process.stdout.write(contents)
    }
  },
})

await run(binary(changesetCli), process.argv)
