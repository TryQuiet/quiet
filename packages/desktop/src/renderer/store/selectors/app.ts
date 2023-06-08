import { createSelector } from 'reselect'
import { StoreState } from '../../sagas/store.types'

const app = (s: StoreState) => s.app

const version = createSelector(app, (a) => a.version)

export default {
  version
}
