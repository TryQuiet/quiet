import { Browser, Builder, ThenableWebDriver } from 'selenium-webdriver'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'

export class BuildSetup {
  private driver: ThenableWebDriver
  public containerId: string
  public ipAddress: string
  public port: number
  public debugPort: number
  public dataDir: string
  private child: ChildProcessWithoutNullStreams

  constructor(port: number, debugPort: number) {
    this.port = port
    this.debugPort = debugPort
  }

  private getBinaryLocation() {
    switch (process.platform) {
      case 'linux':
        return `${__dirname}/Quiet/Quiet-1.1.0-alpha.0.AppImage`
      case 'win32':
        return `${process.env.LOCALAPPDATA}\\Programs\\quiet\\Quiet.exe`
      case 'darwin':
        return '/Applications/Quiet.app/Contents/MacOS/Quiet'
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public async createChromeDriver() {
    this.dataDir = (Math.random() * 10 ** 18).toString(36)

    if (process.platform === 'win32') {
      console.log('!WINDOWS!')
      this.child = spawn(`cd node_modules/.bin & chromedriver.cmd --port=${this.port}`, [], {
        shell: true
      })
    } else {
      this.child = spawn(
        `DEBUG=backend DATA_DIR=${this.dataDir} node_modules/.bin/chromedriver --port=${this.port}`,
        [],
        {
          shell: true,
          detached: false
        }
      )
    }
    // Extra time for chromedriver to setup
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))

    const killNine = () => {
      exec(`kill -9 $(lsof -t -i:${this.port})`)
      exec(`kill -9 $(lsof -t -i:${this.debugPort})`)
    }

    this.child.on('error', () => {
      console.log('ERROR')
      killNine()
    })

    this.child.on('exit', () => {
      console.log('EXIT')
      killNine()
    })

    this.child.on('close', () => {
      console.log('CLOSE')
      killNine()
    })

    this.child.on('message', data => console.log('message', data))
    this.child.on('error', data => console.log('error', data))

    this.child.stdout.on('data', data => {
      console.log(`stdout:\n${data}`)
    })

    this.child.stderr.on('data', data => {
      console.error(`stderr: ${data}`)
    })

    this.child.stdin.on('data', data => {
      console.error(`stdin: ${data}`)
    })
  }

  public async getTorPid() {
    const execAsync = async (cmd: string) => {
      return await new Promise(resolve => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.warn(error)
          }
          resolve(stdout || stderr)
        })
      })
    }
    const torPid = await execAsync('lsof -t -c tor')
    console.log({ torPid })
    return torPid
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
              args: [`--remote-debugging-port=${this.debugPort}`]
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

  public async killChromeDriver() {
    console.log('kill')
    this.child.kill()
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
  }

  public async closeDriver() {
    await this.driver.close()
  }
}
