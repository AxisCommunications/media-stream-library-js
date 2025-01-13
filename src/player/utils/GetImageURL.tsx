export const getImageURL = (
  el: CanvasImageSource,
  { width, height }: { readonly width: number; readonly height: number }
) => {
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  /**
   * This has been tested and works on Chrome and Firefox.
   * Might not work on some versions of MS Edge and IE.
   *
   * 2020-07-15
   */
  canvas?.getContext('2d')?.drawImage(el, 0, 0, width, height)

  return canvas?.toDataURL('image/jpeg')
}
