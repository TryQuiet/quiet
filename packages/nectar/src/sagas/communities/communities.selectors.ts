import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { communitiesAdapter } from './communities.adapter'
import { CreatedSelectors, StoreState } from '../store.types'

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (state: StoreState) =>
  state[StoreKeys.Communities]

export const selectById = (id: string) =>
  createSelector(communitiesSlice, reducerState =>
    communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
  )

export const selectEntities = createSelector(communitiesSlice, reducerState =>
  communitiesAdapter.getSelectors().selectEntities(reducerState.communities)
)

export const selectCommunities = createSelector(communitiesSlice, reducerState =>
  communitiesAdapter.getSelectors().selectAll(reducerState.communities)
)

export const currentCommunity = createSelector(communitiesSlice, reducerState => {
  const id = reducerState.currentCommunity
  return communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
})

export const currentCommunityId = createSelector(communitiesSlice, reducerState => {
  return reducerState.currentCommunity
})

export const registrarUrl = (communityId: string) =>
  createSelector(selectCommunities, communities => {
    const community = communities[communityId]
    
    let registrarAddress: string = ''

    if (!community) {
      return
    }

    if (community.onionAddress) {
      registrarAddress = community.port
        ? `${community.onionAddress}:${community.port}`
        : `${community.onionAddress}`
    } else if (community.registrarUrl) {
      registrarAddress = community.registrarUrl
    }

    return registrarAddress
  })

export const communitiesSelectors = {
  selectById,
  selectEntities,
  selectCommunities,
  currentCommunity,
  currentCommunityId,
  registrarUrl
}
