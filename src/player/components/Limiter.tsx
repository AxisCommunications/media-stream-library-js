import React, { forwardRef, PropsWithChildren } from 'react'

/**
 * The limiter prevents the video element to use up all of the available width.
 * The player container will automatically limit it's own height based on the
 * available width (keeping aspect ratio).
 */
export const Limiter = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          top: '0',
          bottom: '0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    )
  }
)
