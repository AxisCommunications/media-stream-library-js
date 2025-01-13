import styled from 'styled-components'

/**
 * The limiter prevents the video element to use up all of the available width.
 * The player container will automatically limit it's own height based on the
 * available width (keeping aspect ratio).
 */
export const Limiter = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
