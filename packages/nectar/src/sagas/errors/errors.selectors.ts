import { createSelector } from 'reselect'
import { currentCommunityId } from '../communities/communities.selectors'
import { SocketActionTypes } from '../socket/const/actionTypes'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { errorsAdapter } from './errors.adapter'
import { ErrorPayload, ErrorMessages } from './errors.types'

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
    if (!errors) return null
    return errors.filter(error => !error.community)
  }
)

export const currentCommunityErrors = createSelector(
  currentCommunityId,
  selectAll,
  (community, errors) => {
    if (!community || !errors) {
      return {}
    }
    const communityErrors = errors.filter(error => error.community === community)
    return communityErrors.reduce((types: { [type: string]: ErrorPayload }, error) => {
      types[error.type] = error
      return types
    }, {})
  }
)

// Only possible error that user can do something with is taken username, everything else should not be visible.
export const registrarErrors = createSelector(
  currentCommunityErrors,
  errors => {
    return errors[SocketActionTypes.REGISTRAR]?.message === ErrorMessages.USERNAME_TAKEN ? errors[SocketActionTypes.REGISTRAR] : undefined
  }
)

export const errorsSelectors = {
  generalErrors,
  currentCommunityErrors,
  registrarErrors
}
