
export type EventCallback<EventType> = (evt: EventType) => void
export interface EventObject<EventType> { handleEvent: EventCallback<EventType> }
export type EventHandler<EventType> = EventCallback<EventType> | EventObject<EventType>

interface Listener {
  once: boolean
  callback: any
}

/**
 * Adds types to the EventTarget class. Hopefully this won't be necessary forever.
 *
 * https://github.com/microsoft/TypeScript/issues/28357
 * https://github.com/microsoft/TypeScript/issues/43477
 * https://github.com/microsoft/TypeScript/issues/299
 * etc
 */
export class EventEmitter<EventMap extends Record<string, any>> extends EventTarget {
  #listeners = new Map<any, Listener[]>()

  listenerCount (type: string) {
    const listeners = this.#listeners.get(type)

    if (listeners == null) {
      return 0
    }

    return listeners.length
  }

  addEventListener<K extends keyof EventMap>(type: K, listener: EventHandler<EventMap[K]> | null, options?: boolean | AddEventListenerOptions): void
  addEventListener (type: string, listener: EventHandler<Event>, options?: boolean | AddEventListenerOptions): void {
    super.addEventListener(type, listener, options)

    let list = this.#listeners.get(type)

    if (list == null) {
      list = []
      this.#listeners.set(type, list)
    }

    list.push({
      callback: listener,
      once: (options !== true && options !== false && options?.once) ?? false
    })
  }

  removeEventListener<K extends keyof EventMap>(type: K, listener?: EventHandler<EventMap[K]> | null, options?: boolean | EventListenerOptions): void
  removeEventListener (type: string, listener?: EventHandler<Event>, options?: boolean | EventListenerOptions): void {
    super.removeEventListener(type.toString(), listener ?? null, options)

    let list = this.#listeners.get(type)

    if (list == null) {
      return
    }

    list = list.filter(({ callback }) => callback !== listener)
    this.#listeners.set(type, list)
  }

  dispatchEvent (event: Event): boolean {
    const result = super.dispatchEvent(event)

    let list = this.#listeners.get(event.type)

    if (list == null) {
      return result
    }

    list = list.filter(({ once }) => !once)
    this.#listeners.set(event.type, list)

    return result
  }
}

/**
 * CustomEvent is a standard event but it's not supported by node.
 *
 * Remove this when https://github.com/nodejs/node/issues/40678 is closed.
 *
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
 */
class CustomEventPolyfill<T = any> extends Event {
  /** Returns any custom data event was created with. Typically used for synthetic events. */
  public detail: T

  constructor (message: string, data?: EventInit & { detail: T }) {
    super(message, data)
    // @ts-ignore
    this.detail = data?.detail
  }
}

export const CustomEvent = globalThis.CustomEvent ?? CustomEventPolyfill
