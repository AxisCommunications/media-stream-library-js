/**
 * Some helpers to deal with Affine matrices
 */

import { Coord } from './geometry'

export type Vector = readonly [number, number, number]
export type Matrix = readonly [Vector, Vector, Vector]

export const isAffine = (A: Matrix) => {
  return A[2][0] === 0 && A[2][1] === 0 && A[2][2] === 1
}

export const assertAffine = (A: Matrix) => {
  if (!isAffine(A)) {
    throw new Error('expected affine transform')
  }
}

export const inverse = (A: Matrix): Matrix => {
  assertAffine(A)
  const [a, b, c] = A[0]
  const [d, e, f] = A[1]
  const D = a * e - d * b
  if (D === 0) {
    throw new Error('expected non-singular matrix')
  }

  const R = [
    [e / D, -b / D],
    [-d / D, a / D],
  ]

  const T = [-(c * R[0][0] + f * R[0][1]), -(c * R[1][0] + f * R[1][1])]

  return [
    [R[0][0], R[0][1], T[0]],
    [R[1][0], R[1][1], T[1]],
    [0, 0, 1],
  ]
}

export const multiply = (A: Matrix, B: Matrix): Matrix => {
  assertAffine(A)
  assertAffine(B)
  const [a, b, c] = A[0]
  const [d, e, f] = A[1]
  const [t, u, v] = B[0]
  const [x, y, z] = B[1]
  return [
    [a * t + b * x, a * u + b * y, a * v + b * z + c],
    [d * t + e * x, d * u + e * y, d * v + e * z + f],
    [0, 0, 1],
  ]
}

export const apply = (A: Matrix, [x, y]: Coord): Coord => {
  return [
    A[0][0] * x + A[0][1] * y + A[0][2],
    A[1][0] * x + A[1][1] * y + A[1][2],
  ]
}
