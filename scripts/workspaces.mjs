#!/usr/bin/env node
import { readFileSync } from 'fs'

function workspacesFromPackage(packageJsonPath) {
  const contents = JSON.parse(readFileSync(packageJsonPath))
  return contents.workspaces.packages
}

const workspaces = workspacesFromPackage(process.argv[2])
console.log(workspaces.join(' '))
