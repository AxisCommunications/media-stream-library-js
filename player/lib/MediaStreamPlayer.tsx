import React, { useState, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { VapixParameters } from './PlaybackArea'
import { Format, Player } from './Player'

interface InitialAttributes {
  readonly hostname: string
  readonly autoplay: boolean
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
}

type SetStateType = React.Dispatch<React.SetStateAction<InitialAttributes>>

/**
 * Create a custom element that uses React to mount the actual Player component.
 *
 * Note that this does not use a shadow DOM to avoid certain issues with React.
 */
export class MediaStreamPlayer extends HTMLElement {
  private _setState?: SetStateType

  public attributeChangeSubscriber(cb: SetStateType) {
    this._setState = cb
  }

  constructor() {
    super()
  }

  static get observedAttributes() {
    return [
      'hostname',
      'autoplay',
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
    ]
  }

  private get allAttributes() {
    const {
      hostname,
      autoplay,
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
    } = this

    return {
      hostname,
      autoplay,
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
    }
  }

  get hostname() {
    return this.getAttribute('hostname') ?? ''
  }

  set hostname(value: string) {
    this.setAttribute('hostname', value)
  }

  get autoplay() {
    return this.hasAttribute('autoplay')
  }

  set autoplay(value) {
    if (value !== undefined) {
      this.setAttribute('autoplay', '')
    } else {
      this.removeAttribute('autoplay')
    }
  }

  get format() {
    return this.getAttribute('format') ?? 'JPEG'
  }

  set format(value: string) {
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

  connectedCallback() {
    window
      .fetch(`http://${this.hostname}/axis-cgi/usergroup.cgi`, {
        credentials: 'include',
        mode: 'no-cors',
      })
      .then(() => {
        ReactDOM.render(
          <PlayerComponent
            subscribeAttributesChanged={(cb) =>
              this.attributeChangeSubscriber(cb)
            }
            initialAttributes={{
              ...this.allAttributes,
            }}
          />,
          this,
        )
      })
      .catch((err) => {
        console.error(`Authorization failed: ${err.message}`)
      })
  }

  disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this)
  }

  attributeChangedCallback(attrName: string, _: string, value: string) {
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
    hostname,
    autoplay,
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

  return (
    <Player
      hostname={hostname}
      autoPlay={autoplay}
      format={format as Format}
      vapixParams={vapixParameters}
    />
  )
}
