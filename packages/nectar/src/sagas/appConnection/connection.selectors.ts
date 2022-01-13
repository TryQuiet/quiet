import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { CreatedSelectors, StoreState } from '../store.types'
import { usersSlice } from '../users/users.slice'
import { certificates, certificatesMapping } from '../users/users.selectors'
import { identityAdapter } from '../identity/identity.adapter'
import { userData } from 'packages/identity/src/test/helpers'

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

// export const joinedCommunities = createSelector(
//   certificatesMapping,
//   connectedPeers,
//   (users, usersPeerId) => {
//     const usersData = Object.values(certificatesMapping)
//     const data =  usersPeerId.map((item) => {
//       const data2 = 
//     })
//   }
// );

export const connectionSelectors = {
  initializedCommunities,
  initializedRegistrars,
  connectedPeers
}
