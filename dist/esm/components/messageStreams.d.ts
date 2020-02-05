/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
import { Message } from './message';
declare type MessageTransform = (this: Transform, msg: Message, encoding: string, callback: TransformCallback) => void;
export declare const createTransform: (transform: MessageTransform) => Transform;
export {};
