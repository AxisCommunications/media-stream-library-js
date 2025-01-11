import { logInfo as logDebug } from './log'

import { IsomMessage } from './components/types'
import { encode } from './components/utils/bytes'

const MAX_BUFFER = 225000000 // 5 min at a rate of 6 Mbit/s

// Detect the start of the movie by detecting an ftyp box.
const magicHeader = encode('ftyp')
function isFtypIsom(box: Uint8Array): boolean {
  const header = box.subarray(4, 8)
  return magicHeader.every((byte, i) => byte === header[i])
}

/** Given a callback and max buffer size, returns two functions, one that takes
 * MP4 data (as ISOM message) and stores that data whenever it detects the start
 * of a movie, and a function that triggers the end of data storage. The trigger
 * is called automatically if the buffer is full. */
export function setupMp4Capture(
  cb: (bytes: Uint8Array) => void,
  bufferSize = MAX_BUFFER
): {
  capture: (msg: IsomMessage) => void
  triggerEnd: () => void
} {
  let active = true
  let buffer = new Uint8Array(bufferSize)
  let bufferOffset = 0
  let startOfMovie = false

  const triggerEnd = () => {
    active = false
    logDebug(`stop MP4 capture, collected ${bufferOffset} bytes`)
    try {
      cb(buffer.subarray(0, bufferOffset))
    } catch (err) {
      console.error('capture callback failed:', err)
    }
  }

  const capture = (msg: IsomMessage) => {
    if (!active) {
      return
    }

    // Arrival of ISOM with MIME type indicates new movie, start recording if active.
    if (!startOfMovie) {
      if (isFtypIsom(msg.data)) {
        startOfMovie = true
        logDebug('detected start of movie, proceeding with MP4 capture')
      } else {
        return
      }
    }

    // If movie started, record all ISOM (MP4) boxes
    if (bufferOffset < buffer.byteLength - msg.data.byteLength) {
      buffer.set(msg.data, bufferOffset)
      bufferOffset += msg.data.byteLength
    } else {
      triggerEnd()
    }
  }

  return {
    capture,
    triggerEnd,
  }
}
