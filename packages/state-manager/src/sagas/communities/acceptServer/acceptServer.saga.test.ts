import { testSaga } from 'redux-saga-test-plan'
import { CommunityOwnership, type Community } from '@quiet/types'
import { acceptServerSaga } from './acceptServer.saga'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'

const community: Community = {
  id: 'community-id',
  name: 'community',
  ownership: CommunityOwnership.User,
  teamId: 'team-id',
  tosAccepted: false,
  qssEnabled: false,
  serverHosts: [{ hostUrl: 'qss.example.com', accepted: false }],
}

describe('acceptServerSaga', () => {
  it('waits for ToS acceptance before enabling QSS and accepting servers', () => {
    const accepted = communitiesActions.setTermsOfServiceAccepted({
      communityId: community.id,
      accepted: true,
    })

    testSaga(acceptServerSaga)
      .next()
      .select(communitiesSelectors.currentCommunity)
      .next(community)
      .put(communitiesActions.requestTermsOfService())
      .next()
      .take(communitiesActions.setTermsOfServiceAccepted)
      .next(accepted)
      .select(communitiesSelectors.currentCommunity)
      .next({ ...community, tosAccepted: true })
      .put(
        communitiesActions.updateCommunityData({
          id: community.id,
          updates: {
            tosAccepted: true,
            qssEnabled: true,
            serverHosts: [{ hostUrl: 'qss.example.com', accepted: true }],
          },
        })
      )
      .next()
      .isDone()
  })

  it('does not enable QSS when ToS is declined', () => {
    testSaga(acceptServerSaga)
      .next()
      .select(communitiesSelectors.currentCommunity)
      .next(community)
      .put(communitiesActions.requestTermsOfService())
      .next()
      .take(communitiesActions.setTermsOfServiceAccepted)
      .next(communitiesActions.setTermsOfServiceAccepted({ communityId: community.id, accepted: false }))
      .isDone()
  })

  it('accepts servers immediately when ToS was already accepted', () => {
    const acceptedCommunity = { ...community, tosAccepted: true }

    testSaga(acceptServerSaga)
      .next()
      .select(communitiesSelectors.currentCommunity)
      .next(acceptedCommunity)
      .put(
        communitiesActions.updateCommunityData({
          id: community.id,
          updates: {
            tosAccepted: true,
            qssEnabled: true,
            serverHosts: [{ hostUrl: 'qss.example.com', accepted: true }],
          },
        })
      )
      .next()
      .isDone()
  })
})
