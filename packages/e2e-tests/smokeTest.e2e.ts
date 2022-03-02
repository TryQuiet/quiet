import * as fs from 'fs'
import * as path from 'path'
import { fixture, t, test } from 'testcafe'
import { Channel, CreateCommunityModal, DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal } from './selectors'

const longTimeout = 100000

fixture`Smoke test`
  .beforeEach(async t => {
    await goToMainPage()
  })

const goToMainPage = async () => {
  let pageUrl: string
  try {
    // Test built app version. This is a really hacky way of accessing proper mainWindowUrl
    pageUrl = fs.readFileSync('/tmp/mainWindowUrl', { encoding: 'utf8' })
  } catch {
    // If no file found assume that tests are run with a dev project version
    pageUrl = '../frontend/dist/main/index.html#/'
  }
  console.info(`Navigating to ${pageUrl}`)
  await t.navigateTo(pageUrl)
}

test('Smoke test', async t => {
  const debugModeModal = new DebugModeModal()
  if (await debugModeModal.title.exists) {
    console.log('Close debug warning modal')
    await debugModeModal.close()
  }

  await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  // User sees "join community" page and switches to "create community" view by clicking on the link
  const joinModal = new JoinCommunityModal()
  if (!(await joinModal.title.exists)) {
    console.log("Community probably already exists. Checking if general channel is visible")
    const generalChannel = new Channel('general')
    await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')
    
  } else {
    console.log("Community doesn not exist, creating it")
    await joinModal.switchToCreateCommunity()

    // User is on "Create community" page, enters valid community name and presses the button
    const createModal = new CreateCommunityModal()
    await t.expect(createModal.title.exists).ok()
    await createModal.typeCommunityName('testcommunity')
    await createModal.submit()
  
    // User sees "register username" page, enters the valid name and submits by clicking on the button
    const registerModal = new RegisterUsernameModal()
    await t.expect(registerModal.title.exists).ok()
    await registerModal.typeUsername('testuser')
    await registerModal.submit()
  
    // User waits for the spinner to disappear and then sees general channel
    const generalChannel = new Channel('general')
    await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
    await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')
    console.log('WAITING FOR DATA TO BE SAVED')
    await t.wait(2000)
  }
})
