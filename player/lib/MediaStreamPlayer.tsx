import React from 'react'
import ReactDOM from 'react-dom'
import { Player } from './Player'

/**
 * Create a custom element that uses React to mount the actual Player component.
 *
 * Note that this does not use a shadow DOM to avoid certain issues with React.
 */

export class MediaStreamPlayer extends HTMLElement {
  static get observedAttributes() {
    return ['hostname']
  }

  get hostname() {
    return this.getAttribute('hostname') ?? ''
  }

  set hostname(value: string) {
    this.setAttribute('hostname', value)
  }

  connectedCallback() {
    /**
     */
  }

  disconnectedCallback() {
    /**
     */
  }

  attributeChangedCallback(attrName: string, _: string, hostname: string) {
    if (attrName === 'hostname') {
      // cleanup previous
      ReactDOM.unmountComponentAtNode(this)

      // Provide default authentication
      window
        .fetch(`http://${hostname}/axis-cgi/usergroup.cgi`, {
          credentials: 'include',
          mode: 'no-cors',
        })
        .then(() => {
          ReactDOM.render(<Player hostname={hostname} />, this)
        })
        .catch((err) => {
          console.error(`Authorization failed: ${err.message}`)
        })
    }
  }
}
