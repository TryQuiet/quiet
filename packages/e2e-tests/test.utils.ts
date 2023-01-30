import { Docker } from 'docker-cli-js'
import { Browser, Builder, ThenableWebDriver } from 'selenium-webdriver'
import { spawn } from 'child_process'

export class BuildSetup {
  private docker: Docker
  private driver: ThenableWebDriver
  public containerId: string
  public ipAddress: string
  public port: number
  public dataDir: string
  private child

  constructor(port: number = 0) {
    this.port = port
  }

  private getDocker() {
    if (!this.docker) {
      this.docker = new Docker({ echo: false })
    }
    return this.docker
  }

  private getBinaryLocation() {
    switch (process.env.TEST_SYSTEM) {
      case 'linux':
        return `${__dirname}/Quiet/Quiet-0.16.0.AppImage`
      case 'windows':
        return `${__dirname}/binary/windows/Quiet`
      case 'mac':
        return '/Applications/Quiet.app/Contents/MacOS/Quiet'
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public async createChromeDriver() {
    this.dataDir = (Math.random() * 10 ** 18).toString(36)
    console.log(this.dataDir)
    this.child = spawn(
      `DATA_DIR=${this.dataDir} node_modules/.bin/chromedriver --port=${this.port}`,
      [],
      {
        shell: true
        // detached: true,
      }
    )

    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))

    this.child.stdout.on('data', data => {
      console.log(`stdout:\n${data}`)
    })

    this.child.stderr.on('data', data => {
      console.error(`stderr: ${data}`)
    })
  }

  public getDriver() {
    const binary = this.getBinaryLocation()
    if (!this.driver) {
      try {
        this.driver = new Builder()
          .usingServer(`http://localhost:${this.port}`)
          // .usingServer(`http://${this.ipAddress}:9515`)
          .withCapabilities({
            'goog:chromeOptions': {
              // binary: '/Applications/Quiet.app/Contents/MacOS/Quiet',
              // binary: '/app/Quiet2.app/Contents/MacOs/Quiet',
              binary: binary,
              args: [
                // '--no-sandbox',
                // '--disable-dev-shm-usage',
                // '--window-size=1420,1080',
                // '--headless',
                // '--disable-gpu',
                // '--single-process',
                // '--disable-features=VizDisplayCompositor',
                // '--dns-prefetch-disable',
                // '--disable-extensions',
                // '--incognito',
                '--remote-debugging-port=9222'
              ]
            }
          })
          .forBrowser(Browser.CHROME)
          .build()
      } catch (e) {
        console.log(e)
      }
    }

    return this.driver
  }

  public async buildContainer() {
    const docker = this.getDocker()
    try {
      await docker.command(
        'run -d -v /dev/shm:/dev/shm -v $(pwd)/docker/Quiet:/app --device "/dev/fuse:/dev/fuse" --cap-add SYS_ADMIN --security-opt apparmor:unconfined  -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1080 e2e-test-image',
        (e, d) => {
          if (e) {
            console.log(e)
            throw new Error(e)
          }
          this.containerId = d.containerId
        }
      )
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }

    const inspect = await docker.command(`inspect ${this.containerId}`)
    this.ipAddress = inspect.object[0].NetworkSettings.IPAddress
    console.log(this.ipAddress)
    // healthcheck - i will do it better in next steps
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
    return this.containerId
  }

  public async killContainer() {
    const docker = this.getDocker()
    await docker.command(`kill ${this.containerId}`)
  }

  public async closeDriver() {
    await this.driver.close()
  }

  public killChromeDriver() {
    console.log('kill')
    this.child.kill()
  }
}
