/**
 * Adapter
 *
 * Transform stream that converts raw data chunks to messages,
 * through a message generator provided by the user.
 */
export class Adapter<T> extends TransformStream<Uint8Array> {
  constructor(generator: (chunk: Uint8Array) => T) {
    super({
      transform: (chunk, controller) => {
        controller.enqueue(generator(chunk))
      },
    })
  }
}
