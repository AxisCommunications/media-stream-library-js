import React, { useEffect, useMemo, useState } from 'react'
import { Root, createRoot } from 'react-dom/client'

import { BasicPlayer } from './BasicPlayer'
import { VapixParameters } from './PlaybackArea'
import { Player } from './Player'
import { Format } from './types'

enum PlayerVariants {
  BASIC = 'basic',
  ADVANCED = 'advanced',
}
interface InitialAttributes {
  readonly variant: string
  readonly hostname: string
  readonly autoplay: boolean
  readonly autoretry: boolean
  readonly format: string
  readonly compression: string
  readonly resolution: string
  readonly rotation: string
  readonly camera: string
  readonly fps: string
  readonly audio: string
  readonly clock: string
  readonly date: string
  readonly text: string
  readonly textstring: string
  readonly textcolor: string
  readonly textbackgroundcolor: string
  readonly textpos: string
  readonly secure: boolean
}

type SetStateType = React.Dispatch<React.SetStateAction<InitialAttributes>>

/**
 * Create a custom element that uses React to mount the actual Player component.
 *
 * Note that this does not use a shadow DOM to avoid certain issues with React.
 */
export class MediaStreamPlayer extends HTMLElement {
  private _setState?: SetStateType
  private _root?: Root

  public attributeChangeSubscriber(cb: SetStateType) {
    this._setState = cb
  }

  public static get observedAttributes() {
    return [
      'variant',
      'hostname',
      'autoplay',
      'autoretry',
      'format',
      'compression',
      'resolution',
      'rotation',
      'camera',
      'fps',
      'audio',
      'clock',
      'date',
      'text',
      'textstring',
      'textcolor',
      'textbackgroundcolor',
      'textpos',
      'secure',
    ]
  }

  private get allAttributes() {
    const {
      variant,
      hostname,
      autoplay,
      autoretry,
      format,
      compression,
      resolution,
      rotation,
      camera,
      fps,
      audio,
      clock,
      date,
      text,
      textstring,
      textcolor,
      textbackgroundcolor,
      textpos,
      secure,
    } = this

    return {
      variant,
      hostname,
      autoplay,
      autoretry,
      format,
      compression,
      resolution,
      rotation,
      camera,
      fps,
      audio,
      clock,
      date,
      text,
      textstring,
      textcolor,
      textbackgroundcolor,
      textpos,
      secure,
    }
  }

  public get variant() {
    return this.getAttribute('variant') ?? PlayerVariants.ADVANCED
  }

  public set variant(value: string) {
    this.setAttribute('variant', value)
  }

  public get hostname() {
    return this.getAttribute('hostname') ?? ''
  }

  public set hostname(value: string) {
    this.setAttribute('hostname', value)
  }

  public get autoplay() {
    return this.hasAttribute('autoplay')
  }

  public set autoplay(value) {
    if (value !== undefined) {
      this.setAttribute('autoplay', '')
    } else {
      this.removeAttribute('autoplay')
    }
  }

  public get autoretry() {
    return this.hasAttribute('autoretry')
  }

  public set autoretry(value) {
    if (value !== undefined) {
      this.setAttribute('autoretry', '')
    } else {
      this.removeAttribute('autoretry')
    }
  }

  public get format() {
    return this.getAttribute('format') ?? 'JPEG'
  }

  public set format(value: string) {
    this.setAttribute('format', value)
  }

  public get compression() {
    return this.getAttribute('compression') ?? ''
  }

  public set compression(value: string) {
    this.setAttribute('compression', value)
  }

  public get resolution() {
    return this.getAttribute('resolution') ?? ''
  }

  public set resolution(value: string) {
    this.setAttribute('resolution', value)
  }

  public get rotation() {
    return this.getAttribute('rotation') ?? ''
  }

  public set rotation(value: string) {
    this.setAttribute('rotation', value)
  }

  public get camera() {
    return this.getAttribute('camera') ?? ''
  }

  public set camera(value: string) {
    this.setAttribute('camera', value)
  }

  public get fps() {
    return this.getAttribute('fps') ?? ''
  }

  public set fps(value: string) {
    this.setAttribute('fps', value)
  }

  public get audio() {
    return this.getAttribute('audio') ?? ''
  }

  public set audio(value: string) {
    this.setAttribute('audio', value)
  }

  public get clock() {
    return this.getAttribute('clock') ?? ''
  }

  public set clock(value: string) {
    this.setAttribute('clock', value)
  }

  public get date() {
    return this.getAttribute('date') ?? ''
  }

  public set date(value: string) {
    this.setAttribute('date', value)
  }

  public get text() {
    return this.getAttribute('text') ?? ''
  }

  public set text(value: string) {
    this.setAttribute('text', value)
  }

  public get textstring() {
    return this.getAttribute('textstring') ?? ''
  }

  public set textstring(value: string) {
    this.setAttribute('textstring', value)
  }

  public get textcolor() {
    return this.getAttribute('textcolor') ?? ''
  }

  public set textcolor(value: string) {
    this.setAttribute('textcolor', value)
  }

  public get textbackgroundcolor() {
    return this.getAttribute('textbackgroundcolor') ?? ''
  }

  public set textbackgroundcolor(value: string) {
    this.setAttribute('textbackgroundcolor', value)
  }

  public get textpos() {
    return this.getAttribute('textpos') ?? ''
  }

  public set textpos(value: string) {
    this.setAttribute('textpos', value)
  }

  public get secure() {
    return this.hasAttribute('secure')
  }

  public set secure(value) {
    if (value !== undefined) {
      this.setAttribute('secure', '')
    } else {
      this.removeAttribute('secure')
    }
  }

  public connectedCallback() {
    this._root = createRoot(this)
    const userGroupUrl = new URL(
      `http://${this.hostname}/axis-cgi/usergroup.cgi`
    )
    userGroupUrl.protocol = this.secure === true ? 'https' : 'http'

    window
      .fetch(userGroupUrl.href, {
        credentials: 'include',
        mode: 'no-cors',
      })
      .then(() => {
        this._root?.render(
          <PlayerComponent
            subscribeAttributesChanged={(cb) =>
              this.attributeChangeSubscriber(cb)
            }
            initialAttributes={{
              ...this.allAttributes,
            }}
          />
        )
      })
      .catch((err) => {
        console.error(`Authorization failed: ${err.message}`)
      })
  }

  public disconnectedCallback() {
    this._root?.unmount()
    this._root = undefined
  }

  public attributeChangedCallback(attrName: string, _: string, value: string) {
    if (this._setState === undefined) {
      console.warn(`ignored attribute change: ${attrName}=${value}`)
      return
    }

    this._setState({
      ...this.allAttributes,
    })
  }
}

interface PlayerComponentProps {
  readonly initialAttributes: InitialAttributes
  readonly subscribeAttributesChanged: (cb: SetStateType) => void
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({
  subscribeAttributesChanged,
  initialAttributes,
}) => {
  const [state, setState] = useState(initialAttributes)

  useEffect(() => {
    subscribeAttributesChanged(setState)
  }, [subscribeAttributesChanged])

  const {
    variant,
    hostname,
    autoplay,
    autoretry,
    format,
    compression,
    resolution,
    rotation,
    camera,
    fps,
    audio,
    clock,
    date,
    text,
    textstring,
    textcolor,
    textbackgroundcolor,
    textpos,
    secure,
  } = state

  const vapixParameters = useMemo(() => {
    const params = [
      { compression },
      { resolution },
      { rotation },
      { camera },
      { fps },
      { audio },
      { clock },
      { date },
      { text },
      { textstring },
      { textcolor },
      { textbackgroundcolor },
      { textpos },
    ]
      .filter((item) => Object.values(item)[0] !== '')
      .map((item) => {
        return { [Object.keys(item)[0]]: Object.values(item)[0] ?? '' }
      })

    return Object.assign({}, ...params) as VapixParameters
  }, [
    compression,
    resolution,
    rotation,
    camera,
    fps,
    audio,
    clock,
    date,
    text,
    textstring,
    textcolor,
    textbackgroundcolor,
    textpos,
  ])

  switch (variant) {
    case PlayerVariants.ADVANCED:
      return (
        <Player
          hostname={hostname}
          autoPlay={autoplay}
          autoRetry={autoretry}
          initialFormat={format as Format}
          vapixParams={vapixParameters}
          secure={secure}
        />
      )
    case PlayerVariants.BASIC:
      return (
        <BasicPlayer
          hostname={hostname}
          autoPlay={autoplay}
          autoRetry={autoretry}
          format={format as Format}
          vapixParams={vapixParameters}
          secure={secure}
        />
      )
    default:
      console.error('No player variant selected')
      return null
  }
}
