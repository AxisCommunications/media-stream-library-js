export type ChallengeParams = Map<string, string>

export interface Challenge {
  type: string
  params: ChallengeParams
}

export const parseWWWAuthenticate = (header: string): Challenge => {
  const [dummy, type, ...challenge] = header.split(' ')

  const pairs: [string, string][] = []
  const re = /\s*([^=]+)=\"([^\"]*)\",?/gm
  let match
  do {
    match = re.exec(challenge.join(''))
    if (match !== null) {
      const [full, key, value] = match
      pairs.push([key, value])
    }
  } while (match !== null)

  const params = new Map(pairs)

  return { type: type.toLowerCase(), params }
}
