import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { InvitationKind, LoadingPanelType, SocketActions } from '@quiet/types'
import { validInvitationDatav4 } from '@quiet/common'

import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { networkActions } from '../../network/network.slice'
import { identityActions } from '../../identity/identity.slice'
import { joinCommunitySaga } from './joinCommunity.saga'
import { type Socket } from '../../../types'

const inviteData = { ...validInvitationDatav4[0], kind: InvitationKind.Member as const }

const draft = {
  status: 'draft' as const,
  attempt: 1,
  communityId: 'community-id',
  inviteData,
  username: 'alice',
  tosAccepted: true,
}

/**
 * A backend that refuses the request outright used to leave the user at a dead end: the
 * progress panel failed, and both clients sent them back to the three-way choice with
 * nothing said about why. The refusal is now reported like every other failed join, on the
 * invite field, which is what puts them back on the screen they pasted the link into.
 */
describe('a join the backend refuses', () => {
  const socketRefusing = {
    emitWithAck: jest.fn(async () => undefined),
  } as unknown as Socket

  const socketAccepting = (response: unknown) => ({ emitWithAck: jest.fn(async () => response) }) as unknown as Socket

  it('reports the refusal on the invite field and clears the invitation', async () => {
    await expectSaga(joinCommunitySaga, socketRefusing)
      .provide([
        [select(communitiesSelectors.pendingJoin), draft],
        [call.fn(Object), undefined],
      ])
      .put(communitiesActions.clearInvitationCodes())
      .put(communitiesActions.setJoinCommunityError({ type: 'refused' }))
      // Not 'invalid': that copy tells the user the invite is invalid or has expired, and the
      // backend said no such thing - only that it would not take the request.
      .not.put(communitiesActions.setJoinCommunityError({ type: 'invalid' }))
      .put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
      .not.put.like({ action: { type: communitiesActions.addNewCommunity.type } })
      .run()
  })

  it('reports nothing when the backend accepts', async () => {
    const response = {
      community: { id: 'community-id', name: 'community' },
      identity: { id: 'community-id' },
      profile: { pubKey: 'key' },
    }

    await expectSaga(joinCommunitySaga, socketAccepting(response))
      .provide([[select(communitiesSelectors.pendingJoin), draft]])
      .put(identityActions.addNewIdentity(response.identity as never))
      .not.put(communitiesActions.setJoinCommunityError({ type: 'refused' }))
      .not.put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
      .run()
  })

  it('submits before it touches the socket, so a refusal is never replayed as a fresh draft', async () => {
    await expectSaga(joinCommunitySaga, socketRefusing)
      .provide([[select(communitiesSelectors.pendingJoin), draft]])
      .put(communitiesActions.submitPendingJoin(draft.attempt))
      .run()

    expect(socketRefusing.emitWithAck).toHaveBeenCalledWith(
      SocketActions.JOIN_COMMUNITY,
      expect.objectContaining({ inviteData })
    )
  })
})
