import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (
  state: StoreState
) => state[StoreKeys.Connection]

export const initializedCommunities = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedCommunities
)

export const initializedRegistrars = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedRegistrars
)

export const connectedPeers = createSelector(
  connectionSlice,
  (reducerState) => reducerState.connectedPeers
)

export const connectedPeersMapping = createSelector(
  certificatesMapping,
  connectedPeers,
  (users, usersPeerId) => {
    const usersData = Object.values(users)

    const usersDataPerPeerId = usersPeerId.reduce((accumulator, currentValue) => {
      for (let user of usersData) {
        if (currentValue === user.peerId) {
          return {
            ...accumulator,
            [currentValue]: user
          }
        }
      }
    }, {})

    return usersDataPerPeerId
  }
);

export const connectionSelectors = {
  initializedCommunities,
  initializedRegistrars,
  connectedPeers,
  connectedPeersMapping
}
