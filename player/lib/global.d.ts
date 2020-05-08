import { ResizeObserver } from '@juggle/resize-observer'

declare global {
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface Window {
    readonly ResizeObserver: typeof ResizeObserver
  }
}
