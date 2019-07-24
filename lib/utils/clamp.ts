export function clamp(val: number, min: number, max: number): number {
  return val > max ? max : val < min ? min : val
}
