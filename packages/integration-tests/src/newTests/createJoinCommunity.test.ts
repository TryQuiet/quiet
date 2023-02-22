
import { createCommunity, getCommunityOwnerData, joinCommunity } from '../integrationTests/appActions'
import { assertConnectedToPeers, assertReceivedCertificates } from '../testUtils/assertions'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'

// describe('owner creates community', () => {
//   let owner: AsyncReturnType<typeof createApp>

//   beforeAll(async () => {
//     owner = await createApp()
//   })

//   afterAll(async () => {
//     await owner.manager.closeAllServices()
//   })

//   it('Owner creates community', async () => {
//     await createCommunity({ userName: 'owner', store: owner.store })
//     // Give orbitDB enough time to subscribe to topics.
//     await sleep(5_000)
//   })
// })

describe('owner creates community and two users join', () => {
    let owner: AsyncReturnType<typeof createApp>
    let userOne: AsyncReturnType<typeof createApp>
    let userTwo: AsyncReturnType<typeof createApp>

    beforeAll(async () => {
      owner = await createApp()
      userOne = await createApp()
      userTwo = await createApp()
    })

    afterAll(async () => {
      await owner.manager.closeAllServices()
    })

    it('Owner creates community', async () => {
      await createCommunity({ userName: 'Owner', store: owner.store })
    })

    it('Two users join community', async () => {
      const ownerData = getCommunityOwnerData(owner.store)

      await joinCommunity({
        ...ownerData,
        store: userOne.store,
        userName: 'username1',
        expectedPeersCount: 2
      })

      // await joinCommunity({
      //   ...ownerData,
      //   store: userTwo.store,
      //   userName: 'username2',
      //   expectedPeersCount: 3
      // })
    })

    it('Owner and users received certificates', async () => {
      await assertReceivedCertificates('owner', 3, 120_000, owner.store)
      await assertReceivedCertificates('userOne', 3, 120_000, userOne.store)
      // await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store)
    })

    // it('all peers are connected', async () => {
    //   await assertConnectedToPeers(owner.store, 2)
    //   await assertConnectedToPeers(userOne.store, 2)
    //   await assertConnectedToPeers(userTwo.store, 2)
    // })

    // it('disconnecting peers', async () => {
    //   await userOne.manager.closeAllServices()
    //   await assertConnectedToPeers(owner.store, 1)
    //   await assertConnectedToPeers(userTwo.store, 1)

    //   await userTwo.manager.closeAllServices()
    //   await assertConnectedToPeers(owner.store, 0)
    // })
})
