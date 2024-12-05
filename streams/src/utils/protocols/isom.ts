import { decode } from 'utils/bytes'

/*
 * Track data which can be attached to an ISOM message.
 * It indicates the start of a new movie.
 */
export interface MediaTrack {
  type: string
  encoding?: string
  mime?: string
  codec?: any
}

export const BOX_HEADER_BYTES = 8

export const boxType = (buffer: Uint8Array) => {
  return decode(buffer.subarray(4, 8)).toLowerCase()
}
