import { Component, Tube, Sink, Source } from '../components/component'

/**
 * Pipeline
 *
 * A pipeline is a linked list of components with some convenience methods to
 * handle inserting or removing components from the linked list.
 *
 * A internal set keeps track of which components the pipeline contains, while
 * any order is completely determined by the component's connectedness.
 */
export class Pipeline {
  public firstComponent: Component
  public lastComponent: Component

  private _set: Set<Component>
  /**
   * @param components - The components of the pipeline in order.
   */
  constructor(...components: Component[]) {
    const [car, ...cdr] = components

    this._set = new Set(components)

    this.firstComponent = car
    this.lastComponent = cdr.reduce((last, component) => {
      return last.connect(component as Tube | Sink)
    }, car)
  }

  /**
   * @param components - The components of the pipeline in order.
   */
  init(...components: Component[]) {
    const [car, ...cdr] = components

    this._set = new Set(components)

    this.firstComponent = car
    this.lastComponent = cdr.reduce((last, component) => {
      return last.connect(component as Tube | Sink)
    }, car)
  }

  /**
   * Inserts a component into the pipeline.
   *
   * @param component - Tube or Source behind which to insert a new component.
   * @param component - Tube or Sink to insert.
   */
  insertAfter(component: Source | Tube, newComponent: Tube | Sink) {
    if (!this._set.has(component)) {
      throw new Error('insertion point not part of pipeline')
    }
    if (this._set.has(newComponent)) {
      throw new Error('new component already in the pipeline')
    }

    const cdr = component.next
    if (cdr === null) {
      component.connect(newComponent)
      this.lastComponent = newComponent
    } else {
      component.disconnect()
      component.connect(newComponent).connect(cdr)
    }
    this._set.add(newComponent)

    return this
  }

  /**
   * Inserts a component into the pipeline.
   *
   * @param component - Tube or Sink in front of which to insert a new component.
   * @param component - Tube or Source to insert.
   */
  insertBefore(component: Tube | Sink, newComponent: Source | Tube) {
    if (!this._set.has(component)) {
      throw new Error('insertion point not part of pipeline')
    }
    if (this._set.has(newComponent)) {
      throw new Error('new component already in the pipeline')
    }

    const car = component.prev
    if (car === null) {
      newComponent.connect(component)
      this.firstComponent = newComponent
    } else {
      car.disconnect()
      car.connect(newComponent as Tube).connect(component)
    }
    this._set.add(newComponent)

    return this
  }

  /**
   * Removes a component from the pipeline.
   *
   * @param component - Component to remove.
   */
  remove(component: Component) {
    if (!this._set.has(component)) {
      throw new Error('component not part of pipeline')
    }

    const car = component.prev
    const cdr = component.next
    if (car === null && cdr === null) {
      throw new Error('cannot remove last component')
    } else if (car === null && cdr !== null) {
      component.disconnect()
      this.firstComponent = cdr
    } else if (car !== null && cdr === null) {
      car.disconnect()
      this.lastComponent = car
    } else if (car !== null && cdr !== null) {
      car.disconnect()
      // FIXME: upgrade to Typescript 4.5.5
      // infers component as "never" in this case.
      // Try to revert this with newer TS versions.
      const cmp = component as unknown as Component
      cmp.disconnect()
      car.connect(cdr)
    }
    this._set.delete(component)

    return this
  }

  /**
   * Inserts a component at the end of the pipeline.
   *
   * @param component - Tube or Sink to insert.
   */
  append(...components: Array<Tube | Sink>) {
    components.forEach((component) => {
      this.insertAfter(this.lastComponent as Source | Tube, component)
    })

    return this
  }

  /**
   * Inserts a component at the beginning of the pipeline.
   *
   * @param component - Tube or Source to insert.
   */
  prepend(...components: Array<Source | Tube>) {
    components.forEach((component) => {
      this.insertBefore(this.firstComponent as Tube | Sink, component)
    })

    return this
  }
}
