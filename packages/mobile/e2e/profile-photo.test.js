import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { execFileSync } from 'child_process'

import press from './utils/press'
import write from './utils/write'
import { BASIC, LONG, STARTUP } from './utils/consts/timeouts'
import { CREATE_COMMUNITY_HEADING, JOIN_COMMUNITY_HEADING } from '@quiet/common'

/**
 * One player, no second client: create a community, open your own profile, set a photo, and prove
 * the backend is still there afterwards.
 *
 * Why the assertion is "still alive" rather than "photo looks right": setting a profile photo used
 * to kill the app. saveUserProfile.saga forwarded the picker's `file://` URI as a filesystem path,
 * IpfsFileManagerService.attachFile threw ENOENT, and because the emitter discards that promise
 * the rejection reached backendManager's unhandledRejection handler, which closed every service
 * and exited node. The React Native half stayed up with a dead socket, which is why it read as a
 * crash. A jest unit test cannot see any of that — it mocks the picker and stops at the dispatch.
 *
 * Detox cannot drive Android's system photo picker, which belongs to com.google.android.photopicker
 * and is therefore out of Espresso's reach. The e2e build instead answers the picker itself (see
 * `pickPhoto` in UserProfile.screen.tsx) with the response the real picker would have produced for
 * a file this spec puts in the app's cache — same percent-encoded `file://` shape, same everything
 * after it. So the gallery UI is NOT covered here; the URI normalization, the saga, the socket, the
 * node backend's attachFile, the IPFS write and the profile round trip all are.
 *
 * Run it against an e2e build (ENVFILE=.env.e2e, i.e. the android.e2e app), Android only:
 *   QUIET_E2E_PROFILE_PHOTO=1 npx detox test -c android.att.e2e e2e/profile-photo.test.js
 */

const PACKAGE = process.env.QUIET_E2E_PACKAGE || 'com.quietmobile.debug'
const COMMUNITY = 'rockets'
const USERNAME = 'rick'
const FIRST_MESSAGE = 'before the photo'
const SECOND_MESSAGE = 'after the photo'

/** The single source of truth for the file name: the same value the e2e build was compiled with. */
const photoName = (
  (fs.readFileSync(path.join(__dirname, '..', '.env.e2e'), 'utf8').match(/^E2E_PROFILE_PHOTO_NAME=(.*)$/m) || [])[1] ||
  ''
).trim()

/** The exact lines backendManager logs on its way out; their absence is what this spec is for. */
const BACKEND_DIED = /unhandledRejection received, initiating shutdown|Scheduling process exit/

const adb = (...args) => {
  const serial = process.env.QUIET_E2E_ANDROID_DEVICE
  return execFileSync(process.env.ADB_PATH || 'adb', [...(serial ? ['-s', serial] : []), ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
}

/**
 * run-as starts in the app's data directory, so `cache/` is exactly what RNFS.CachesDirectoryPath
 * names in the app. The bytes travel as base64 in the command itself rather than on stdin, because
 * adb translates line endings on a piped stream and would corrupt them.
 */
const seedPhotoInAppCache = () => {
  const bytes = fs.readFileSync(path.join(__dirname, 'fixtures', 'profile-photo.jpg'))
  const encoded = bytes.toString('base64')
  adb('shell', `run-as ${PACKAGE} sh -c 'echo ${encoded} | base64 -d > cache/${photoName}'`)
  const listing = adb('shell', `run-as ${PACKAGE} ls -l cache/${photoName}`)
  assert(
    listing.includes(String(bytes.length)),
    `Seeded photo is not ${bytes.length} bytes in the app cache — check the run-as quoting: ${listing}`
  )
}

const suite = process.env.QUIET_E2E_PROFILE_PHOTO && photoName ? describe : describe.skip

/* eslint-disable no-undef */
suite('Profile photo', () => {
  /** Onboarding differs by env file; take the optional steps only when they actually appear. */
  const pressIfPresent = async matcher => {
    try {
      await waitFor(element(matcher)).toBeVisible().withTimeout(BASIC)
    } catch {
      return
    }
    await press(element(matcher))
  }

  const sendMessage = async text => {
    await press(element(by.id('input')))
    await write(element(by.id('input')), text)
    await press(element(by.id('send_message_button')))
    await waitFor(element(by.id(text)))
      .toBeVisible()
      .withTimeout(LONG)
    await device.pressBack()
  }

  beforeAll(async () => {
    assert(device.getPlatform() === 'android', 'This spec reads the app cache over adb, so it is Android only')
    // Blacklist the long-lived Tor/IPFS sockets; without it detox waits on them forever.
    await device.launchApp({ delete: true, newInstance: true, launchArgs: { detoxURLBlacklistRegex: '.*' } })
    seedPhotoInAppCache()
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  test('creates a community on its own', async () => {
    await waitFor(element(by.text(JOIN_COMMUNITY_HEADING)))
      .toBeVisible()
      .withTimeout(STARTUP)
    await press(element(by.text('create a new community')))

    await waitFor(element(by.text(CREATE_COMMUNITY_HEADING)))
      .toBeVisible()
      .withTimeout(BASIC)
    await write(element(by.id('input')), COMMUNITY)
    await device.pressBack()
    await device.disableSynchronization()
    await press(element(by.text('Continue')))

    await pressIfPresent(by.text('Not now'))

    await waitFor(element(by.text('Register a username')))
      .toBeVisible()
      .withTimeout(LONG)
    await write(element(by.id('input')), USERNAME)
    await press(element(by.text('Continue')))
    await device.enableSynchronization()

    await pressIfPresent(by.text('Agree & Continue'))

    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(STARTUP)
  })

  test('opens its own profile from a sent message', async () => {
    await press(element(by.text('general')))
    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(BASIC)
    await sendMessage(FIRST_MESSAGE)

    // The author row carries the message id, which is generated; match the stable prefix instead.
    await press(element(by.id(/^message-author-name-/)).atIndex(0))

    await waitFor(element(by.id(/^user-profile-component-/)))
      .toBeVisible()
      .withTimeout(BASIC)
    // The edit control only renders on your own profile, so its presence is the isMe check too.
    await waitFor(element(by.id('user-profile-edit-photo')))
      .toBeVisible()
      .withTimeout(BASIC)
  })

  test('sets the photo and shows it', async () => {
    try {
      adb('logcat', '-c')
    } catch {
      // Some devices refuse to clear the ring buffer; the markers below are still unambiguous.
    }

    await press(element(by.id('user-profile-edit-photo')))

    // Attaching runs a real IPFS write, so give it room; the identicon is replaced by an Image
    // whose alt text ProfilePhoto sets, which is what distinguishes the two.
    await waitFor(element(by.label(`${USERNAME}'s profile image`)))
      .toBeVisible()
      .withTimeout(STARTUP)
  })

  test('leaves the backend alive', async () => {
    const log = adb('logcat', '-d', 'NODEJS-MOBILE:V', 'ReactNativeJS:V', '*:S')
    const dying = log.split('\n').filter(line => BACKEND_DIED.test(line))
    assert.deepStrictEqual(
      dying,
      [],
      `Backend shut itself down while attaching the profile photo:\n${dying.join('\n')}`
    )
  })

  test('still answers after the photo', async () => {
    // The process survives its own node runtime dying, so liveness has to be functional: a message
    // only renders if the backend took it, stored it and handed it back.
    await press(element(by.id('appbar_action_item')))
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(BASIC)
    await press(element(by.text('general')))
    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(BASIC)

    await sendMessage(SECOND_MESSAGE)
  })
})
