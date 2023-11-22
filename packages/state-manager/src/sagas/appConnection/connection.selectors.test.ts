import { setupCrypto } from '@quiet/identity'
import { type Store } from '@reduxjs/toolkit'
import { getFactory } from '../../utils/tests/factories'
import { prepareStore } from '../../utils/tests/prepareStore'
import { connectionSelectors } from './connection.selectors'
import { type communitiesActions } from '../communities/communities.slice'
import { connectionActions } from './connection.slice'
import { type FactoryGirl } from 'factory-girl'
import { type Community } from '@quiet/types'

describe('communitiesSelectors', () => {
    setupCrypto()

    let store: Store
    let community: Community
    let factory: FactoryGirl

    beforeEach(async () => {
        store = prepareStore({}).store
        factory = await getFactory(store)
    })

    it('select peers sorted by quality', async () => {
        community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
            'Community',
            {
                peerList: [
                    '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/443/ws/p2p/QmQEk68gnPTRhfBvRAPWXjjXjPydV1MvvZGGJF7W7w2Sv5',
                    '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/443/ws/p2p/QmbrDuN2oCb8G2e1ajRzpfnALGbeFDYFSoVCBhUYGLSeRD',
                    '/dns4/kkzkv2u53aehfjz7mqgnt3mp2hemcr2h74vtmxpxuh4a5yna7kltsiqd.onion/tcp/443/ws/p2p/QmeiKGmfD64o3sTt6T4PVyvp1hnJ42Zki754rQgYr6fSnN',
                    '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/443/ws/p2p/QmTjQLMxJq74yXWBabh1VM8hZsRNhci4wfbVz6vFhLH5am',
                    '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/443/ws/p2p/Qmd35TsAvtskei8zWY3A65ifNWcY4x4SdqkQDHMkH5xPF9',
                ],
            }
        )

        // This peer should be first in the list as it is the most revently seen one.
        store.dispatch(
            connectionActions.updateNetworkData({
                peer: 'Qmd35TsAvtskei8zWY3A65ifNWcY4x4SdqkQDHMkH5xPF9',
                connectionDuration: 50,
                lastSeen: 1000,
            })
        )

        // This peer should be second as it has the most shared uptime
        store.dispatch(
            connectionActions.updateNetworkData({
                peer: 'QmQEk68gnPTRhfBvRAPWXjjXjPydV1MvvZGGJF7W7w2Sv5',
                connectionDuration: 500,
                lastSeen: 900,
            })
        )

        // This is actually the third one on the list of last seen peers and it goes next, note that the upper peer which should go before that is already in the list.
        store.dispatch(
            connectionActions.updateNetworkData({
                peer: 'QmbrDuN2oCb8G2e1ajRzpfnALGbeFDYFSoVCBhUYGLSeRD',
                connectionDuration: 200,
                lastSeen: 500,
            })
        )

        // This is the least valuable peer so it goes last. Rmaining peers, without any network data will be concated to the end of the list.
        store.dispatch(
            connectionActions.updateNetworkData({
                peer: 'QmTjQLMxJq74yXWBabh1VM8hZsRNhci4wfbVz6vFhLH5am',
                connectionDuration: 100,
                lastSeen: 100,
            })
        )

        const expectedArray = [
            '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/443/ws/p2p/Qmd35TsAvtskei8zWY3A65ifNWcY4x4SdqkQDHMkH5xPF9',
            '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/443/ws/p2p/QmQEk68gnPTRhfBvRAPWXjjXjPydV1MvvZGGJF7W7w2Sv5',
            '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/443/ws/p2p/QmbrDuN2oCb8G2e1ajRzpfnALGbeFDYFSoVCBhUYGLSeRD',
            '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/443/ws/p2p/QmTjQLMxJq74yXWBabh1VM8hZsRNhci4wfbVz6vFhLH5am',
            '/dns4/kkzkv2u53aehfjz7mqgnt3mp2hemcr2h74vtmxpxuh4a5yna7kltsiqd.onion/tcp/443/ws/p2p/QmeiKGmfD64o3sTt6T4PVyvp1hnJ42Zki754rQgYr6fSnN',
        ]

        const peersList = connectionSelectors.peerList(store.getState())
        expect(peersList).toMatchObject(expectedArray)
    })
})
