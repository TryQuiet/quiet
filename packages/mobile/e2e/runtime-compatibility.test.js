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
    await element(by.text('HermesWebCrypto')).tap()
    await element(by.id('BottomMenu.Canvas')).tap()
    await waitFor(element(by.id('runtime-compatibility-run')))
      .toBeVisible()
      .withTimeout(10000)
  })

  it('uses Hermes and the real WebView bridge to hash, round-trip keys, sign, and reject tampering', async () => {
    await expect(element(by.id('runtime-compatibility-engine'))).toHaveText('Hermes')
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
})
