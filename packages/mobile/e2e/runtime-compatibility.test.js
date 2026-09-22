// Exercise the actual Hermes UI runtime and hidden WebView crypto provider.
// Run with android.att.storybook or ios.sim.storybook. All crypto assertions
// exercise the UI/WebView provider, without a Node-process substitute.

describe('React Native runtime compatibility', () => {
  beforeEach(async () => {
    // A fresh process prevents an earlier story's crypto worker or results from
    // satisfying this test without mounting the real WebView again.
    await device.launchApp({ newInstance: true })
    await device.setOrientation('portrait')
    await waitFor(element(by.id('BottomMenu.Sidebar')))
      .toBeVisible()
      .withTimeout(120000)
    await element(by.id('BottomMenu.Sidebar')).tap()
    await waitFor(element(by.id('Storybook.ListView.SearchBar')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('Storybook.ListView.SearchBar')).replaceText('RuntimeCompatibility')
    if (device.getPlatform() === 'ios') {
      // The iOS search keyboard otherwise consumes the first story-row tap.
      await element(by.id('Storybook.ListView.SearchBar')).tapReturnKey()
    }
    await waitFor(element(by.text('HermesWebCrypto')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.text('HermesWebCrypto')).tap()
    await element(by.id('BottomMenu.Canvas')).tap()
    await waitFor(element(by.id('runtime-compatibility-run')))
      .toBeVisible()
      .withTimeout(10000)
  })

  it('uses Hermes and the real WebView bridge to hash, round-trip keys, sign, and reject tampering', async () => {
    await expect(element(by.id('runtime-compatibility-engine'))).toHaveText('Hermes')
    await expect(element(by.id('runtime-compatibility-architecture'))).toHaveText('Fabric bridgeless')
    await waitFor(element(by.id('runtime-compatibility-native-module'))).toHaveText('passed').withTimeout(10000)
    await expect(element(by.id('runtime-compatibility-provider'))).toHaveText('WebView bridge')
    await expect(element(by.id('runtime-compatibility-state'))).toHaveText('idle')

    await element(by.id('runtime-compatibility-run')).tap()
    await waitFor(element(by.id('runtime-compatibility-state')))
      .toHaveText('passed')
      .withTimeout(30000)

    await expect(element(by.id('runtime-compatibility-digest'))).toHaveText('passed')
    await expect(element(by.id('runtime-compatibility-key-round-trip'))).toHaveText('passed')
    await expect(element(by.id('runtime-compatibility-signature'))).toHaveText('verified')
    await expect(element(by.id('runtime-compatibility-tamper'))).toHaveText('rejected')
    await expect(element(by.id('runtime-compatibility-error'))).toHaveText('none')
    await device.takeScreenshot('runtime-compatibility-webcrypto')
  })

  it('routes native notifications or lifecycle events through the bridgeless host', async () => {
    await expect(element(by.id('runtime-compatibility-architecture'))).toHaveText('Fabric bridgeless')
    await waitFor(element(by.id('runtime-compatibility-native-module'))).toHaveText('passed').withTimeout(10000)
    if (device.getPlatform() === 'android') {
      await device.deviceDriver.invocationManager.execute({
        target: { type: 'Class', value: 'com.quietmobile.NotificationIntentHelper' },
        method: 'deliverNotification',
        args: [],
      })
      await waitFor(element(by.id('runtime-compatibility-notification')))
        .toHaveText('quiet-test-channel')
        .withTimeout(10000)
    } else {
      await expect(element(by.id('runtime-compatibility-lifecycle'))).toHaveText('0/0')
      await device.sendToHome()
      await device.launchApp({ newInstance: false })
      await waitFor(element(by.id('runtime-compatibility-lifecycle'))).toHaveText('1/1').withTimeout(10000)
    }
  })
})
