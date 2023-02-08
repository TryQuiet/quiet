// import path from 'path'
// import { createApp, actions, assertions, SendImage } from 'integration-tests'
// import { fixture, test } from 'testcafe'
// import { JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Channel } from './selectors'
// import { goToMainPage } from './utils'

// const longTimeout = 120_000

// let communityOwner = null

// fixture`Files sending test`
//   .before(async ctx => {
//     ctx.ownerUsername = 'alice'
//     ctx.ownerImage = {
//       path: path.join(__dirname, '/assets/test-image.jpeg'),
//       name: 'test-image',
//       ext: '.jpeg'
//     }
//     ctx.joiningUserUsername = 'bob-joining'
//   })
//   .beforeEach(async () => {
//     await goToMainPage()
//   })
//   .afterEach(async () => {
//     if (communityOwner) {
//       await communityOwner.manager.closeAllServices()
//       communityOwner = null
//     }
//   })

// test('Users can send and receive images', async t => {
//   // Owner creates community and sends an image
//   communityOwner = await createApp()
//   const onionAddress = await actions.createCommunity({
//     username: t.fixtureCtx.ownerUsername,
//     communityName: 'e2eCommunity',
//     store: communityOwner.store
//   })
//   await t.wait(2000) // Give the backend some time, headless tests are fast
//   const payload: SendImage = {
//     file: t.fixtureCtx.ownerImage,
//     store: communityOwner.store
//   }
//   await actions.sendImage(payload)
//   const invitationCode = onionAddress.split('.')[0]

//   // User opens app for the first time, sees spinner, waits for spinner to disappear
//   await t
//     .expect(new LoadingPanel('Starting Quiet').title.exists)
//     .notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, {
//       timeout: longTimeout
//     })

//   // User sees "join community" page, types correct community code and submits
//   const joinModal = new JoinCommunityModal()
//   await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
//   await joinModal.typeCommunityCode(invitationCode)
//   await joinModal.submit()

//   // User sees "register username" page, enters the valid, non-taken name and submits by clicking on the button
//   const registerModal = new RegisterUsernameModal()
//   await t.expect(registerModal.title.exists).ok({ timeout: longTimeout })
//   await registerModal.typeUsername(t.fixtureCtx.joiningUserUsername)
//   await registerModal.submit()

//   // User waits for the spinner to disappear and then sees general channel
//   const generalChannel = new Channel('general')
//   await t
//     .expect(new LoadingPanel('Creating community').title.exists)
//     .notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, {
//       timeout: longTimeout
//     })
//   await t
//     .expect(generalChannel.title.exists)
//     .ok('User can\'t see "general" channel', { timeout: longTimeout })

//   // Owner is connected with joining user
//   await assertions.assertReceivedCertificates(t.fixtureCtx.ownerUsername, 2, longTimeout, communityOwner.store)
//   await assertions.assertConnectedToPeers(communityOwner.store, 1)

//   // Joining user sees image replicated from the owner
//   let ownerMessages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
//   await t.expect(ownerMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(ownerMessages.textContent).eql('') // Image is not yet downloaded
//   await t.wait(2000) // Wait for image to be downloaded
//   ownerMessages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
//   await t.expect(ownerMessages.textContent).contains(t.fixtureCtx.ownerImage.name) // Image has been successfully downloaded
// })
