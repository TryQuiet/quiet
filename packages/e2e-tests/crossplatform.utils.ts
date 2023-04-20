import { Browser, Builder, ThenableWebDriver } from 'selenium-webdriver'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import getPort from 'get-port'

export interface BuildSetupInit {
  port?: number
  debugPort?: number
  useDataDir?: boolean
  dataDir?: string
}

export class BuildSetup {
  private driver: ThenableWebDriver
  public containerId: string
  public ipAddress: string
  public port: number
  public debugPort: number
  public dataDir: string
  private child: ChildProcessWithoutNullStreams
  private useDataDir: boolean

  constructor({ port, debugPort, useDataDir = true, dataDir }: BuildSetupInit) {
    this.port = port
    this.debugPort = debugPort
    this.useDataDir = useDataDir
    this.dataDir = dataDir
    if (this.useDataDir && !this.dataDir) {
      this.dataDir = `e2e_${(Math.random() * 10 ** 18).toString(36)}`
    }
  }

  async initPorts() {
    this.port = await getPort()
    this.debugPort = await getPort()
  }

  private getBinaryLocation() {
    switch (process.platform) {
      case 'linux':
        return `${__dirname}/Quiet/${process.env.FILE_NAME}`
      case 'win32':
        return `${process.env.LOCALAPPDATA}\\Programs\\quiet\\Quiet.exe`
      case 'darwin':
        return '/Applications/Quiet.app/Contents/MacOS/Quiet'
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public async createChromeDriver() {
    await this.initPorts()
    if (process.platform === 'win32') {
      console.log('!WINDOWS!')
      this.child = spawn(`cd node_modules/.bin & chromedriver.cmd --port=${this.port}`, [], {
        shell: true
      })
    } else {
      const dataDir = this.dataDir ? `DATA_DIR=${this.dataDir}` : ''
      this.child = spawn(
        `DEBUG=backend* ${dataDir} node_modules/.bin/chromedriver --port=${this.port}`,
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
              args: [`--remote-debugging-port=${this.debugPort}`, '--enable-debugging']
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

  public resetDriver() {
    this.driver = null
  }

  public async killChromeDriver() {
    console.log('kill')
    this.child?.kill()
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
  }

  public async closeDriver() {
    await this.driver?.close()
  }
}
