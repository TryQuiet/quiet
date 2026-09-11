/* global device, element, by, expect, waitFor */
import { singleLineInput, channelComposer } from './nativeInputs'
import waitForAndroidNotification from './waitForAndroidNotification'
const { parseQssInvitation } = require('./qssCommunity.cjs')

export const createQssCommunity = async (communityName, username) => {
  await waitFor(element(by.text('Join community')))
    .toBeVisible()
    .withTimeout(120000)
  await element(by.text('create a new community')).tap()
  await waitFor(element(by.text('Create a community')))
    .toBeVisible()
    .withTimeout(10000)
  await (await singleLineInput('Community name')).typeText(communityName)
  if (device.getPlatform() === 'android') await device.pressBack()
  await element(by.text('Continue')).tap()
  await waitFor(element(by.id('server-offer-drawer')))
    .toBeVisible()
    .withTimeout(30000)
  await element(by.text('Add server')).tap()
  await waitFor(element(by.text('Register a username')))
    .toBeVisible()
    .withTimeout(10000)
  await (await singleLineInput('Enter a username')).typeText(username)
  if (device.getPlatform() === 'android') await device.pressBack()
  await element(by.text('Continue')).tap()
  await waitFor(element(by.id('terms-of-service-component')))
    .toBeVisible()
    .withTimeout(30000)
  await element(by.text('Agree & Continue')).tap()
  // The real native WebView obtains hCaptcha's public test token. The app's
  // backend verifies it with QSS; no injected token or synchronization bypass.
  await waitFor(element(by.id('channels_list')))
    .toBeVisible()
    .withTimeout(120000)
}

export const openGeneral = async () => {
  await waitFor(element(by.id('channels_list')))
    .toBeVisible()
    .withTimeout(120000)
  await waitForAndroidNotification(device)
  await element(by.id('channel_tile_general')).tap()
  await waitFor(channelComposer('general')).toBeVisible().withTimeout(30000)
}

export const sendStoredMessage = async message => {
  const composer = channelComposer('general')
  await composer.tap()
  await composer.typeText(message)
  await expect(composer).toBeVisible()
  await expect(element(by.id('send_message_button'))).toBeVisible()
  await element(by.id('send_message_button')).tap()
  await waitFor(element(by.id(message).withAncestor(by.id('message-stored'))))
    .toBeVisible()
    .withTimeout(30000)
  await expect(composer).toHaveText('')
  if (device.getPlatform() === 'android') await device.pressBack()
}

export const readQssInvitation = async communityName => {
  await waitForAndroidNotification(device)
  await element(by.id('appbar_action_item')).tap()
  await waitFor(element(by.id('channels_list')))
    .toBeVisible()
    .withTimeout(10000)
  await element(by.id('open_menu')).tap()
  await element(by.id('Add members')).tap()
  await waitFor(element(by.id('context_menu_Add members')))
    .toBeVisible()
    .withTimeout(10000)
  // Detox's native iOS regex matcher requires the entire text to match.
  const invitation = element(by.text(/^https:\/\/tryquiet\.org\/join#.+$/))
  await waitFor(invitation).toBeVisible().withTimeout(30000)
  const attributes = await invitation.getAttributes()
  const rawInvite = attributes.text || attributes.label
  const metadata = parseQssInvitation(rawInvite, communityName)
  // Callers may hand this directly to the peer, but must not log the secret link.
  return { rawInvite, metadata }
}

export const closeQssInvitation = async () => {
  await element(by.id('Cancel')).tap()
  await waitFor(element(by.id('context_menu_Add members')))
    .not.toBeVisible()
    .withTimeout(10000)
  await expect(element(by.id('channels_list'))).toBeVisible()
}
