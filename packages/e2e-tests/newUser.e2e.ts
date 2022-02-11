import { fixture, test, Selector } from 'testcafe'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Channel, LoadingPanel } from './selectors'

fixture`Electron test`
  .page('../frontend/dist/main/index.html#/')
  .before(async t => {
    const dataPath = path.join(os.homedir(), '.config')
    console.info('Cleaning up')
    try {
      fs.rmdirSync(path.join(dataPath, 'Quiet'), { recursive: true })
      fs.rmdirSync(path.join(dataPath, 'Electron'), { recursive: true })
      fs.rmdirSync(path.join(dataPath, 'e2e-tests-nodejs'), { recursive: true })
    } catch {
      console.info('No data directories to clean up')
    }
  })

const longTimeout = 100000

test('User can create new community, register and send few messages to general channel', async t => {
  // User opens app for the first time, sees spinner, waits for spinner to disappear
  await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

  // User sees "join community" page and switches to "create community" view by clicking on the link
  const joinCommunityTitle = await Selector('h3').withText('Join community')()
  await t.expect(joinCommunityTitle).ok('User can\'t see "Join community" title')
  const createCommunityLink = Selector('a').withAttribute('data-testid', 'JoinCommunityLink')
  await t.click(createCommunityLink)

  // User is on "Create community" page, enters valid community name and presses the button
  const createCommunityTitle = await Selector('h3').withText('Create your community')()
  await t.expect(createCommunityTitle).ok()
  const continueButton2 = Selector('button').withText('Continue')
  const communityNameInput = Selector('input').withAttribute('placeholder', 'Community name')
  await t.typeText(communityNameInput, 'testcommunity')
  await t.click(continueButton2)

  // User sees "register username" page, enters the valid name and submits by clicking on the button
  const registerUsernameTitle = await Selector('h3').withText('Register a username')()
  await t.expect(registerUsernameTitle).ok()
  const usernameInput = Selector('input').withAttribute('name', 'userName').filterVisible()
  const submitButton = Selector('button').withText('Register')
  await t.expect(usernameInput.exists).ok()
  const username = 'testuser'
  await t.typeText(usernameInput, username)
  await t.click(submitButton)

  // User waits for the spinner to disappear and then sees general channel
  const generalChannel = new Channel('general')
  await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

  // User sends a message
  await t.expect(generalChannel.messageInput.exists).ok()
  await generalChannel.sendMessage('Hello everyone')

  // Sent message is visible on the messages' list as part of a group
  await t.expect(generalChannel.messagesList.exists).ok('Could not find placeholder for messages', { timeout: 30000 })

  await t.expect(generalChannel.messagesGroup.exists).ok({ timeout: 30000 })
  await t.expect(generalChannel.messagesGroup.count).eql(1)

  await t.expect(generalChannel.messagesGroupContent.exists).ok()
  await t.expect(generalChannel.messagesGroupContent.textContent).eql('Hello\xa0everyone')
  await t.wait(5000) // TODO: remove after fixing https://github.com/ZbayApp/monorepo/issues/222
})

test('User reopens app, sees general channel and the messages he sent before', async t => {
  // User opens app for the first time, sees spinner, waits for spinner to disappear
  await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

  // Returning user sees "general" channel
  const generalChannel = new Channel('general')
  await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

  // User sees the message sent previously
  await t.expect(generalChannel.messagesList.exists).ok('Could not find placeholder for messages', { timeout: 30000 })

  await t.expect(generalChannel.messagesGroup.exists).ok({ timeout: 30000 })
  await t.expect(generalChannel.messagesGroup.count).eql(1)

  await t.expect(generalChannel.messagesGroupContent.exists).ok()
  await t.expect(generalChannel.messagesGroupContent.textContent).eql('Hello\xa0everyone')
})
