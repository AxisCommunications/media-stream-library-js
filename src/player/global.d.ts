import { ResizeObserver } from '@juggle/resize-observer'

declare global {
  interface Window {
    readonly ResizeObserver: typeof ResizeObserver
  }
}
