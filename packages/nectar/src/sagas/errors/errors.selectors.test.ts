import { setupCrypto } from '@quiet/identity'
import { Store } from '@reduxjs/toolkit'
import { getFactory } from '../../utils/tests/factories'
import { prepareStore } from '../../utils/tests/prepareStore'
import { errorsSelectors } from './errors.selectors'
import {
  errorsActions
} from './errors.slice'
import { communitiesSelectors } from '../communities/communities.selectors'
import {
  communitiesActions,
  Community
} from '../communities/communities.slice'

describe('Errors', () => {
  setupCrypto()

  let store: Store
  let communityAlpha: Community

  beforeEach(async () => {
    store = prepareStore({}).store
    const factory = await getFactory(store)
    communityAlpha = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {id: 'community-id'})
    store.dispatch(communitiesActions.setCurrentCommunity(communityAlpha.id))
  })

  
  it('select current community errors', () => {
    const errorPayload = {
      community: 'community-id',
      type: 'community',
      code: 500,
      message: 'Error occurred'
    }
    const errorPayload2 = {
      community: 'community-id',
      type: 'other',
      code: 403,
      message: 'Validation error occurred'
    }
    const errorPayload3 = {
      community: 'community-id',
      type: 'community',
      code: 403,
      message: 'Validation error occurred'
    }
    const errorPayload4 = {
      community: 'other-community-id',
      type: 'community',
      code: 403,
      message: 'Validation error occurred'
    }
    const errorPayloadGeneral = {
      type: 'activity',
      code: 500,
      message: 'Some error occurred'
    }

    store.dispatch(errorsActions.addError(errorPayload))
    store.dispatch(errorsActions.addError(errorPayload2))
    store.dispatch(errorsActions.addError(errorPayload3))
    store.dispatch(errorsActions.addError(errorPayload4))
    store.dispatch(errorsActions.addError(errorPayloadGeneral))

    const registrarError = errorsSelectors.currentCommunityErrors(store.getState())
    console.log(store.getState().Errors)
    console.log(registrarError)
  })
})
