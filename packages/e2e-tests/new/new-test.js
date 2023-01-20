/* eslint-disable space-before-function-paren */
/* eslint-disable prefer-const */
const { Builder, Browser, By, until, Capabilities } = require('selenium-webdriver')
const { Docker } = require('docker-cli-js')

let containerId
let docker

async function buildDriver() {
  docker = new Docker({ echo: false })
  console.log('docker run')

  try {
    await docker.command(
      // eslint-disable-next-line no-template-curly-in-string
      'run -d -v /dev/shm:/dev/shm -v $(pwd)/Quiet:/app --device "/dev/fuse:/dev/fuse" --cap-add SYS_ADMIN --security-opt apparmor:unconfined  -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1080 e2e-test-image',
      (e, d) => {
        console.log({ e, d })
      }
    )
  } catch (e) {
    console.log(e)
  }

  const ps = await docker.command('ps')
  const container = ps.containerList[0]
  containerId = container['container id']

  const inspect = await docker.command(`inspect ${containerId}`)
  const ipAddress = inspect.object[0].NetworkSettings.IPAddress
  // healthcheck
  await new Promise(resolve => setTimeout(() => resolve(), 2000))

  // let chromeCapabilities = Capabilities.chrome()
  // let chromeOptions = {
  //   args: ['--remote-debugging-port=9222']
  // }
  // chromeOptions.binary_location = '/app/Quiet-0.16.0.AppImage'
  // chromeCapabilities.set('chromeOptions', chromeOptions)
  // chromeCapabilities.setPageLoadStrategy('eager')

  const driver = new Builder()
    .usingServer(`http://${ipAddress}:9515`)
    .withCapabilities(
      {
        'goog:chromeOptions': {
          binary: '/app/Quiet-0.16.0.AppImage',
          args: ['--remote-debugging-port=9222']
        }
      }
      // chromeCapabilities
    )
    .forBrowser(Browser.CHROME)
    .build()
  return driver
}
exports.buildDriver = buildDriver

async function scenario() {
  console.log('build driver')

  const driver = await buildDriver()
  await driver.session_
  await new Promise(resolve => setTimeout(() => resolve(), 500))

  console.log('ready')
  const link = await driver.wait(until.elementLocated(By.linkText('create a new community')), 40000)
  await link.click()
  console.log('1')
  const input = await driver.findElement(By.xpath('//input[@placeholder="Community name"]'))
  await input.sendKeys('my-community')
  console.log('2')
  const continueButton = await driver.findElement(
    By.xpath('//button[@data-testid="continue-createCommunity"]')
  )
  await continueButton.click()

  await new Promise(resolve => setTimeout(() => resolve(), 10000))
  console.log('driver close')
  await driver.close()
  console.log('docker kill')
  await docker.command(`kill ${containerId}`)
  console.log('done')
}

exports.scenario = scenario

scenario()
