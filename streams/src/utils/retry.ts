import { RtspSession } from '../components/rtsp-session'

/**
 * Retry failed commands.
 *
 * This retries RTSP commands that fails up to a certain
 * limit of times.
 */
export const addRTSPRetry = (
  rtspSession: RtspSession,
  { maxRetries, errors } = { maxRetries: 20, errors: [503] }
) => {
  let retries = 0

  const oldOnError = rtspSession.onError

  rtspSession.onError = (err) => {
    oldOnError?.(err)

    if (!errors.includes(err.code)) {
      return
    }

    // Stop retrying after 20 tries (~20 seconds)
    if ((retries += 1) > maxRetries) {
      console.log('retry, too many', retries, maxRetries)
      return
    }

    // Retry
    setTimeout(() => rtspSession.retry?.(), retries * 100)
  }
}
