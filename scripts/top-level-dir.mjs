#!/usr/bin/env node

// Determine the top-level directory relative to a project root,
// used to determine the workspace from an invocation directory.
// Example usage:
//   node top-level-dir.mjs /home/user/project '.' => ''
//   node top-level-dir.mjs /home/user/project /home/user/project/hello/there => hello
//   node top-level-dir.mjs /home/user/project ./hello/there => hello
import { relative, sep } from 'path'

function topLevelDir(root, pathname) {
  const relativeInvocationDir = relative(root, pathname)
  const topDir = relativeInvocationDir.split(sep)[0]
  return topDir
}

const dir = topLevelDir(process.argv[2], process.argv[3])
console.log(dir)
