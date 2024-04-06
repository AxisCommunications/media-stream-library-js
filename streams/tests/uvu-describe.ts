import { Test, suite } from 'uvu'

export function describe(name: string, fn: (s: Test) => void): void {
  const mySuite = suite(name)

  fn(mySuite)

  mySuite.run()
}
