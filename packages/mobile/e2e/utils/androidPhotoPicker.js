const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const { randomUUID, createHash } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)
const appId = 'com.quietmobile.storybook.debug'
const quote = value => `'${String(value).replace(/'/g, "'\\''")}'`
const digest = data => createHash('sha256').update(data).digest('hex')
const delay = () => new Promise(resolve => setTimeout(resolve, 250))

// Detox 20.17.1 exposes UIAutomator through this internal proxy. Keep its use
// here: normal Detox elements cannot inspect the separate system picker app.
module.exports = async function androidPhotoPicker(device) {
  const adb = path.join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
  const execute = (args, options = {}) => execFileAsync(adb, ['-s', device.id, ...args], { timeout: 15000, ...options })
  const shell = async (...args) => (await execute(['shell', args.map(quote).join(' ')])).stdout
  const fixture = path.resolve(__dirname, '../../src/assets/icons/png/quiet_icon.png')
  const name = `quiet-picker-${randomUUID()}.png`
  const directory = `/sdcard/Pictures/${name.slice(0, -4)}`
  const mediaPath = `${directory}/${name}`
  const hierarchyPath = `/data/user/0/${appId}/cache/${name}.xml`
  const ui = device.getUiDevice()
  let mediaUri
  const copiedFiles = []

  const poll = async (read, description) => {
    const deadline = Date.now() + 15000
    do {
      const result = await read()
      if (result) return result
      await delay()
    } while (Date.now() < deadline)
    throw new Error(`Timed out waiting for ${description}`)
  }

  const nodes = async () => {
    await ui.dumpWindowHierarchy(hierarchyPath)
    const xml = await shell('run-as', appId, 'cat', hierarchyPath)
    return Array.from(xml.matchAll(/<node\s+([^>]+)>/g), node =>
      Object.fromEntries(Array.from(node[1].matchAll(/([\w-]+)="([^"]*)"/g), attribute => [attribute[1], attribute[2]]))
    )
  }

  const find = (predicate, description) =>
    poll(async () => {
      const matches = (await nodes()).filter(predicate)
      assert(matches.length <= 1, `Expected one ${description}, found ${matches.length}`)
      return matches[0]
    }, description)

  const tap = async node => {
    const bounds = node.bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/)
    assert(bounds, `Missing native bounds: ${JSON.stringify(node)}`)
    const [, left, top, right, bottom] = bounds.map(Number)
    assert(right > left && bottom > top, 'The native picker target must have nonempty bounds')
    await ui.click(Math.floor((left + right) / 2), Math.floor((top + bottom) / 2))
  }

  return {
    async openFromChannel() {
      // The composer moves while Android dismisses the keyboard. Resolve its
      // final native bounds before tapping the production paperclip.
      await poll(
        async () => (await shell('dumpsys', 'input_method')).includes('mDecorViewVisible=false'),
        'keyboard dismissal'
      )
      await tap(await find(node => node['resource-id'] === 'attach_file_button', 'the production attachment button'))
    },

    async seed() {
      await shell('mkdir', '-p', directory)
      await execute(['push', fixture, mediaPath])
      // A distinct future date identifies only our fixture in the native
      // accessibility tree, without selecting another photo or fixed coordinates.
      await shell('touch', '-t', '209901010000', mediaPath)
      await shell('am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${mediaPath}`)
      mediaUri = await poll(async () => {
        const rows = await shell(
          'content',
          'query',
          '--uri',
          'content://media/external/images/media',
          '--projection',
          '_id',
          '--where',
          `_display_name='${name}'`
        )
        const id = rows.match(/_id=(\d+)/)
        return id && `content://media/external/images/media/${id[1]}`
      }, 'the seeded photo in MediaStore')
    },

    async waitUntilOpen() {
      await poll(
        async () =>
          /^com\.(?:google\.android|android)\.(?:providers\.media\.module|photopicker)$/.test(
            await ui.getCurrentPackageName()
          ),
        'the system photo picker'
      )
      await find(node => node.text === 'Photos', 'the native photo picker tab')
    },

    async selectFixture() {
      const before = new Set((await shell('run-as', appId, 'ls', 'cache')).split('\n'))
      await tap(await find(node => /Photo taken on .*2099/.test(node['content-desc']), 'the seeded photo'))
      await tap(
        await find(
          node =>
            (node['resource-id'].endsWith(':id/button_add') ||
              /^Add\s*\(1\)$/.test(node.text) ||
              node.text === 'Done') &&
            node.enabled === 'true',
          'the photo picker confirmation button'
        )
      )
      return async thumbnailAttributes => {
        const candidates = (await shell('run-as', appId, 'ls', 'cache'))
          .split('\n')
          .filter(file => !before.has(file) && /^rn_image_picker_lib_temp_[\w-]+\.png$/.test(file))
        // The library also copies media while resolving originalPath. Verify
        // the file used by the production thumbnail, then clean all own copies.
        assert(
          candidates.includes(`${thumbnailAttributes.label}.png`),
          'The thumbnail must use the newly selected native picker cache file'
        )
        const expected = digest(await fs.readFile(fixture))
        for (const candidate of candidates) {
          const copy = (
            await execute(['exec-out', 'run-as', appId, 'cat', `cache/${candidate}`], { encoding: 'buffer' })
          ).stdout
          assert.equal(digest(copy), expected, 'The native picker must return the seeded image bytes')
          copiedFiles.push(candidate)
        }
      }
    },

    async cleanup() {
      if (mediaUri) await shell('content', 'delete', '--uri', mediaUri)
      await shell('rm', '-f', mediaPath)
      await shell('rmdir', directory)
      for (const copiedFile of copiedFiles) await shell('run-as', appId, 'rm', '-f', `cache/${copiedFile}`)
      await shell('run-as', appId, 'rm', '-f', hierarchyPath)
    },
  }
}
