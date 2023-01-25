export type Coord = readonly [number, number]
export type CoordArray = ReadonlyArray<Coord>

/**
 * Compute a ranged version of a number so that is always
 * between 0 and n-1 for a range of n.
 * @param  {Number} i - The index value to make bounded
 * @param  {Number} n - The range in which the index falls
 * @return {Number} - A bounded index
 */
export const modulo = (i: number, n: number) => {
  return ((i % n) + n) % n
}

/**
 * Select an element from an array, respecting cyclic boundary conditions.
 * @param  {Array} arr - Any array
 * @param  {Number} i - The index of the element to select
 * @return {Object} - The element corresponding to cyclic index i
 */
export const select = <T>(arr: ReadonlyArray<T>, i: number) => {
  return arr[modulo(i, arr.length)]
}

/**
 * Create an array of item pairs for a cyclic array of items.
 * @param  {Array} items - The array to double
 * @return {Array} - A new array of doubled items
 */
export const doubled = <T>(
  items: ReadonlyArray<T>
): ReadonlyArray<readonly [T, T]> => {
  return items.map((item, i, arr) => {
    return [item, select(arr, i + 1)]
  })
}

/**
 * Compute an array of midpoints from an array of points.
 * @param  {Point[]} points An array of points
 * @return {Point[]} An array of points lying in between the original points
 */
export const midPoints = (points: CoordArray): CoordArray => {
  return doubled(points).map(([p1, p2]) => {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
  })
}

export const withMidPoints = (points: CoordArray): CoordArray => {
  return doubled(points).reduce<Array<Coord>>((acc, [p1, p2]) => {
    acc.push(p1)
    acc.push([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2])
    return acc
  }, [])
}

/**
 * Compute the bounding box of a collection of points
 */
const SMALL = Number.MIN_SAFE_INTEGER
const LARGE = Number.MAX_SAFE_INTEGER
export const bbox = (coords: CoordArray) => {
  const { x, y, x2, y2 } = coords.reduce(
    (acc, [cx, cy]) => {
      acc.x = Math.min(acc.x, cx)
      acc.y = Math.min(acc.y, cy)
      acc.x2 = Math.max(acc.x2, cx)
      acc.y2 = Math.max(acc.y2, cy)
      return acc
    },
    { x: LARGE, y: LARGE, x2: SMALL, y2: SMALL }
  )
  const width = x2 - x
  const height = y2 - y
  return { x, y, width, height, x2, y2 }
}
