export type ChallengeParams = Map<string, string>

export interface Challenge {
  type: string
  params: ChallengeParams
}

export const parseWWWAuthenticate = (header: string): Challenge => {
  const [, type, ...challenge] = header.split(' ')

  const pairs: Array<[string, string]> = []
  const re = /\s*([^=]+)=\"([^\"]*)\",?/gm
  let match
  do {
    match = re.exec(challenge.join(' '))
    if (match !== null) {
      const [, key, value] = match
      pairs.push([key, value])
    }
  } while (match !== null)

  const params = new Map(pairs)

  return { type: type.toLowerCase(), params }
}
