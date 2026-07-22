import { runSaga } from 'redux-saga'
import { CommunityOwnership, type Community } from '@quiet/types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { addServerSaga } from './addServer.saga'

describe('addServerSaga', () => {
  it('adds newly observed hosts as unaccepted without duplicating known hosts', async () => {
    const { store } = prepareStore()
    const community: Community = {
      id: 'community-id',
      name: 'community',
      ownership: CommunityOwnership.User,
      teamId: 'team-id',
      serverHosts: [{ hostUrl: 'known.example.com', accepted: true }],
    }
    store.dispatch(communitiesActions.addNewCommunity(community))

    await runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      addServerSaga,
      communitiesActions.addServer({
        id: community.id,
        serverHosts: ['known.example.com', 'unexpected.example.com'],
      })
    ).toPromise()

    expect(communitiesSelectors.selectById(community.id)(store.getState())?.serverHosts).toEqual([
      { hostUrl: 'known.example.com', accepted: true },
      { hostUrl: 'unexpected.example.com', accepted: false },
    ])
  })
})
