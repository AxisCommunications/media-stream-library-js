import { Transform, TransformCallback } from 'stream'
import { Message } from './message'

type MessageTransform = (
  this: Transform,
  msg: Message,
  encoding: string,
  callback: TransformCallback,
) => void

export const createTransform = (transform: MessageTransform) => {
  return new Transform({
    objectMode: true,
    transform,
  })
}
