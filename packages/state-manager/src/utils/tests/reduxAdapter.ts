import { Store } from '../../sagas/store.types'

export class CustomReduxAdapter {
  store: Store

  constructor(store: Store) {
    this.store = store
  }

  build<T>(Action: any, payload?: Partial<T>) {
    return Action(payload)
  }

  async save(action: any) {
    return this.store.dispatch(action).payload
  }

  get(payload: any, attr: any, _payload: any) {
    return payload[attr]
  }

  set(props: any, payload: any, _payload: any) {
    Object.keys(props).forEach((key) => {
      payload[key] = props[key]
    })
    return payload
  }
}
