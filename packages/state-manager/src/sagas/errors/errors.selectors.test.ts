import { setupCrypto } from '@quiet/identity'
import { type Store } from '@reduxjs/toolkit'
import { getFactory } from '../../utils/tests/factories'
import { prepareStore } from '../../utils/tests/prepareStore'
import { errorsSelectors } from './errors.selectors'
import { type errorsActions } from './errors.slice'
import { type communitiesActions } from '../communities/communities.slice'
import { type Community, ErrorCodes, ErrorMessages, ErrorTypes } from '@quiet/types'

describe('Errors', () => {
  setupCrypto()

  let store: Store
  let communityAlpha: Community

  beforeEach(async () => {
    store = prepareStore({}).store
  })

  it('Selects current community errors', async () => {
    const factory = await getFactory(store)
    communityAlpha = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const registrarErrorPayload = {
      community: communityAlpha.id,
      code: ErrorCodes.BAD_REQUEST,
      message: ErrorMessages.REGISTRAR_NOT_FOUND,
      type: ErrorTypes.REGISTRAR
    }

    const communityErrorPayload = {
      community: communityAlpha.id,
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      message: ErrorMessages.NETWORK_SETUP_FAILED,
      type: ErrorTypes.COMMUNITY
    }

    await factory.create<ReturnType<typeof errorsActions.addError>['payload']>(
      'Error',
      registrarErrorPayload
    )

    await factory.create<ReturnType<typeof errorsActions.addError>['payload']>(
      'Error',
      communityErrorPayload
    )

    const registrarErrors = errorsSelectors.currentCommunityErrors(store.getState())

    expect(registrarErrors).toStrictEqual({ registrar: registrarErrorPayload, community: communityErrorPayload })
  })

  it('Selects current community registrar errors', async () => {
    const factory = await getFactory(store)
    communityAlpha = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const registrarErrorPayload = {
      community: communityAlpha.id,
      code: ErrorCodes.BAD_REQUEST,
      message: ErrorMessages.USERNAME_TAKEN,
      type: ErrorTypes.REGISTRAR
    }

    const communityErrorPayload = {
      community: communityAlpha.id,
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      message: ErrorMessages.NETWORK_SETUP_FAILED,
      type: ErrorTypes.COMMUNITY
    }

    await factory.create<ReturnType<typeof errorsActions.addError>['payload']>(
      'Error',
      registrarErrorPayload
    )

    await factory.create<ReturnType<typeof errorsActions.addError>['payload']>(
      'Error',
      communityErrorPayload
    )

    const registrarErrors = errorsSelectors.registrarErrors(store.getState())

    expect(registrarErrors).toStrictEqual(registrarErrorPayload)
  })
})
