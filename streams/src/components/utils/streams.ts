export function producer<T extends unknown>(messages: T[]) {
  let counter = 0
  return new ReadableStream({
    pull(controller: ReadableStreamDefaultController<T>) {
      try {
        if (counter < messages.length) {
          controller.enqueue(messages[counter++])
        } else {
          controller.close()
        }
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

export function consumer<T>(fn: (msg: T) => void = () => {}) {
  return new WritableStream({
    write(msg: T, controller) {
      try {
        fn(msg)
      } catch (err) {
        controller.error(err)
      }
    },
    abort(reason) {
      console.error('consumer aborted:', reason)
    },
  })
}

export function peeker<T extends unknown>(fn: (msg: T) => void) {
  if (typeof fn !== 'function') {
    throw new Error('you must supply a function')
  }
  return new TransformStream<T, T>({
    transform(msg: T, controller: TransformStreamDefaultController<T>) {
      fn(msg)
      controller.enqueue(msg)
    },
  })
}
