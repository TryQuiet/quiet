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

  private getBinaryLocation() {
    switch (process.env.TEST_SYSTEM) {
      case 'linux':
        return `${__dirname}/Quiet/Quiet-0.16.0.AppImage`
      case 'windows':
        return `${process.env.LOCALAPPDATA}/Programs/quiet/Quiet.exe`
      case 'mac':
        return '/Applications/Quiet.app/Contents/MacOS/Quiet'
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public async createChromeDriver() {
    this.dataDir = (Math.random() * 10 ** 18).toString(36)

    if (process.env.TEST_SYSTEM === 'windows') {
      this.child = spawn(
        `set DATA_DIR=${this.dataDir} & cd node_modules/.bin & chromedriver --port=${this.port}`,
        [],
        {
          shell: true,
          detached: true
        }
      )
    } else {
      this.child = spawn(
        `DATA_DIR=${this.dataDir} node_modules/.bin/chromedriver --port=${this.port}`,
        [],
        {
          shell: true
        }
      )
    }

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
          .withCapabilities({
            'goog:chromeOptions': {
              binary: binary,
              args: [`--remote-debugging-port=${this.port + 5}`]
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

  public killChromeDriver() {
    console.log('kill')
    this.child.kill()
  }

  // __________________________________________________________________________________________________

  private getDocker() {
    if (!this.docker) {
      this.docker = new Docker({ echo: false })
    }
    return this.docker
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
}
