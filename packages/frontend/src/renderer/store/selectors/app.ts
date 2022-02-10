import { createSelector } from 'reselect'

import { Store } from '../reducers'

const app = (s: Store) => s.app

const version = createSelector(app, (a) => a.version)

export default {
  version
}
