import { getValidInvitationUrlTestData, validInvitationDatav1 } from '@quiet/common'
import { CommunityOwnership, CreateNetworkPayload, InvitationDataV1 } from '@quiet/types'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from '../../../types'
import { getFactory } from '../../../utils/tests/factories'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { Store } from '../../store.types'
import { communitiesActions } from '../communities.slice'
import { joinNetworkSaga } from './joinNetwork.saga'

describe('Join network saga', () => {
  let store: Store
  let factory: FactoryGirl
  let validInvitationData: InvitationDataV1
  let validInvitationDeepUrl: string
  const socket = {
    emit: jest.fn(),
    emitWithAck: jest.fn(() => {
      return {}
    }),
    on: jest.fn(),
  } as unknown as Socket

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getFactory(store)

    validInvitationData = getValidInvitationUrlTestData(validInvitationDatav1[0]).data
    validInvitationDeepUrl = getValidInvitationUrlTestData(validInvitationDatav1[0]).deepUrl()
  })

  it('creates network for v1 invitation data', async () => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: validInvitationData.pairs,
      psk: validInvitationData.psk,
      ownerOrbitDbIdentity: validInvitationData.ownerOrbitDbIdentity,
    }
    await expectSaga(joinNetworkSaga, socket, communitiesActions.joinNetwork(validInvitationData))
      .withState(store.getState())
      .put(communitiesActions.createNetwork(payload))
      .run()
  })
})
