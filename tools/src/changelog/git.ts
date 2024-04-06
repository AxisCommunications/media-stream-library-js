import { execSync } from 'node:child_process'

function sanitizeGitHubUrl(url: string) {
  if (new URL(url).hostname !== 'github.com') {
    throw new Error('not implemented: only GitHub repositories are supported')
  }
  return url.replace(/\.git$/, '')
}
export const compareUrl = (url: string, range: string) =>
  `${sanitizeGitHubUrl(url)}/compare/${range}`
export const commitUrl = (url: string, commit: string) =>
  `${sanitizeGitHubUrl(url)}/commit/${commit}`

export function gitLogFromRange(range: string) {
  try {
    const logOut = execSync(
      `git log --no-merges --date-order --format="%H%x09%s" ${range}`
    )
    const lines = logOut.toString().trim().split('\n')
    const shaMessagePairs = lines.map((line) => line.split('\t'))
    return shaMessagePairs
  } catch (err) {
    console.warn(
      `git log failed on range ${range}, one of those tags probably does not exist`
    )
    return []
  }
}

export function shortSha(sha: string) {
  return execSync(`git log -1 --format=%h ${sha}`).toString().trim()
}
