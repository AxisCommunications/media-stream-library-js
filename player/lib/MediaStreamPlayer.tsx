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
    return ['hostname', 'autoplay']
  }

  get hostname() {
    return this.getAttribute('hostname') ?? ''
  }

  set hostname(value: string) {
    this.setAttribute('hostname', value)
  }

  get autoplay() {
    return this.getAttribute('autoplay') ?? 'false'
  }

  set autoplay(value: string) {
    this.setAttribute('autoplay', value)
  }

  createPlayer() {
    const { autoplay, hostname } = this

    return <Player hostname={hostname} autoPlay={Boolean(autoplay)} />
  }

  connectedCallback() {
    /**
     */
  }

  disconnectedCallback() {
    /**
     */
  }

  attributeChangedCallback(attrName: string, _: string, value: string) {
    if (attrName === 'hostname' || attrName === 'autoplay') {
      // cleanup previous
      ReactDOM.unmountComponentAtNode(this)

      // Provide default authentication
      window
        .fetch(`http://${value}/axis-cgi/usergroup.cgi`, {
          credentials: 'include',
          mode: 'no-cors',
        })
        .then(() => {
          ReactDOM.render(this.createPlayer(), this)
        })
        .catch((err) => {
          console.error(`Authorization failed: ${err.message}`)
        })
    }
  }
}
