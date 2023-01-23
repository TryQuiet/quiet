import { Docker } from 'docker-cli-js'
import { Browser, Builder, ThenableWebDriver } from 'selenium-webdriver'

export class BuildSetup {
  private docker: Docker
  private driver: ThenableWebDriver
  public containerId: string
  public ipAddress: string

  private getDocker() {
    if (!this.docker) {
      this.docker = new Docker({ echo: false })
    }
    return this.docker
  }

  public getDriver() {
    if (!this.driver) {
      try {
        this.driver = new Builder()
          .usingServer(`http://${this.ipAddress}:9515`)
          .withCapabilities({
            'goog:chromeOptions': {
              binary: '/app/Quiet-0.16.0.AppImage',
              args: ['--remote-debugging-port=9222']
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
        'run -d -v /dev/shm:/dev/shm -v $(pwd)/tests/Quiet:/app --device "/dev/fuse:/dev/fuse" --cap-add SYS_ADMIN --security-opt apparmor:unconfined  -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1080 e2e-test-image',
        (e, d) => {
          if (e) {
            console.log(e)
          }
          this.containerId = d.containerId
        }
      )
    } catch (e) {
      console.log(e)
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
