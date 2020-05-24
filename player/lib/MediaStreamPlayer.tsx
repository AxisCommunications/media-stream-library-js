import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Player } from './Player'

interface InitialAttributes {
  readonly hostname: string
  readonly autoplay: boolean
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
    return ['hostname', 'autoplay']
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

  connectedCallback() {
    window
      .fetch(`http://${this.hostname}/axis-cgi/usergroup.cgi`, {
        credentials: 'include',
        mode: 'no-cors',
      })
      .then(() => {
        const { hostname, autoplay } = this

        ReactDOM.render(
          <PlayerComponent
            subscribeAttributesChanged={(cb) =>
              this.attributeChangeSubscriber(cb)
            }
            initialAttributes={{
              hostname,
              autoplay,
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

    const { hostname, autoplay } = this
    this._setState({
      hostname,
      autoplay,
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

  const { hostname, autoplay } = state

  return <Player hostname={hostname} autoPlay={autoplay} />
}
