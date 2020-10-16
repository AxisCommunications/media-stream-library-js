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
    return ['hostname', 'autoplay', 'format']
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

  connectedCallback() {
    window
      .fetch(`http://${this.hostname}/axis-cgi/usergroup.cgi`, {
        credentials: 'include',
        mode: 'no-cors',
      })
      .then(() => {
        const {
          hostname,
          autoplay,
          format,
          compression,
          resolution,
          rotation,
          camera,
        } = this

        ReactDOM.render(
          <PlayerComponent
            subscribeAttributesChanged={(cb) =>
              this.attributeChangeSubscriber(cb)
            }
            initialAttributes={{
              hostname,
              autoplay,
              format,
              compression,
              resolution,
              rotation,
              camera,
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

    const {
      hostname,
      autoplay,
      format,
      compression,
      resolution,
      rotation,
      camera,
    } = this

    this._setState({
      hostname,
      autoplay,
      format,
      compression,
      resolution,
      rotation,
      camera,
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
  } = state

  const vapixParameters = useMemo(() => {
    const params = [{ compression }, { resolution }, { rotation }, { camera }]
      .filter((item) => Object.values(item)[0] !== '')
      .map((item) => {
        return { [Object.keys(item)[0]]: Object.values(item)[0] ?? '' }
      })

    return Object.assign({}, ...params) as VapixParameters
  }, [compression, resolution, rotation, camera])

  return (
    <Player
      hostname={hostname}
      autoPlay={autoplay}
      format={format as Format}
      vapixParams={vapixParameters}
    />
  )
}

/**
 * fps
 * audio
 * color
 * clock
 * date
 *
 * text
 * textstring
 * textcolor
 * textbackgroundcolor
 * textpos
 */
