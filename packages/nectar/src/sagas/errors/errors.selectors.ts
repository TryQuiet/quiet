import { createSelector } from 'reselect'
import { currentCommunityId } from '../communities/communities.selectors'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { errorsAdapter } from './errors.adapter'

const errorSlice: CreatedSelectors[StoreKeys.Errors] = (state: StoreState) =>
  state[StoreKeys.Errors]

export const selectEntities = createSelector(
  errorSlice, 
  (reducerState) => {
    return errorsAdapter
      .getSelectors()
      .selectEntities(reducerState.errors)
  }
)

export const selectAll = createSelector(
  errorSlice,
  (reducerState) => {
    return errorsAdapter
      .getSelectors()
      .selectAll(reducerState.errors)
  }
)

export const generalErrors = createSelector(
  selectAll,
  (errors) => {
    if(!errors) return null
    return errors.filter(error => !error.community)
  }
)

export const currentCommunityErrors = createSelector(
  currentCommunityId,
  selectAll,
  (community, errors) => {
    if (!community || !errors) return null
    return errors.filter(error => error.community === community)
  }
)

export const errorsSelectors = {
  generalErrors,
  currentCommunityErrors
}
