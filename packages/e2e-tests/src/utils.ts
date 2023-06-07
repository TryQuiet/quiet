import { Browser, Builder, ThenableWebDriver } from 'selenium-webdriver'
import { spawn, exec, ChildProcessWithoutNullStreams, execSync } from 'child_process'
import { SupportedPlatformDesktop } from '@quiet/types'
import getPort from 'get-port'
import path from 'path'

export interface BuildSetupInit {
  port?: number
  debugPort?: number
  useDataDir?: boolean
  dataDir?: string
  fileName?: string
}

export class BuildSetup {
  private driver?: ThenableWebDriver | null
  public containerId?: string
  public ipAddress?: string
  public port?: number
  public debugPort?: number
  public dataDir?: string
  private child?: ChildProcessWithoutNullStreams
  private useDataDir: boolean
  private fileName?: string

  constructor({ port, debugPort, useDataDir = true, dataDir, fileName }: BuildSetupInit) {
    this.port = port
    this.debugPort = debugPort
    this.useDataDir = useDataDir
    this.dataDir = dataDir
    this.fileName = fileName
    if (this.useDataDir && !this.dataDir) {
      this.dataDir = `e2e_${(Math.random() * 10 ** 18).toString(36)}`
    }
  }

  async initPorts() {
    this.port = await getPort()
    this.debugPort = await getPort()
  }

  private getBinaryLocation() {
    console.log('filename', this.fileName)
    switch (process.platform) {
      case 'linux':
        return `${__dirname}/../Quiet/${this.fileName ? this.fileName : process.env.FILE_NAME}`
      case 'win32':
        return `${process.env.LOCALAPPDATA}\\Programs\\${this.fileName ? 'quiet' : 'quiet2'}\\Quiet.exe`
      case 'darwin':
        return `${this.fileName ? '/Applications/Quiet.app/Contents/MacOS/Quiet' : '/Applications/Quiet2.app/Contents/MacOS/Quiet'}`
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public async createChromeDriver() {
    await this.initPorts()
    const env = {
      DATA_DIR: this.dataDir || 'Quiet',
      DEBUG: 'backend*'
    }
    if (process.platform === 'win32') {
      console.log('!WINDOWS!')
      this.child = spawn(`cd node_modules/.bin & chromedriver.cmd --port=${this.port}`, [], {
        shell: true,
        env: Object.assign(process.env, env)
      })
    } else {
      this.child = spawn(`node_modules/.bin/chromedriver --port=${this.port}`, [], {
        shell: true,
        detached: false,
        env: Object.assign(process.env, env)
      })
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

  public getDriver(): ThenableWebDriver {
    const binary = this.getBinaryLocation()
    if (!this.driver) {
      try {
        this.driver = new Builder()
          .usingServer(`http://localhost:${this.port}`)
          .withCapabilities({
            'goog:chromeOptions': {
              binary: binary,
              args: [`--remote-debugging-port=${this.debugPort}`, '--enable-logging']
            }
          })
          .forBrowser(Browser.CHROME)
          .build()
      } catch (e) {
        console.log(e)
      }
    }
    if (this.driver == null || this.driver === undefined) {
      throw new Error('elo')
    }

    return this.driver
  }

  public resetDriver() {
    this.driver = null
  }

  public async killChromeDriver() {
    console.log(`Killing driver (DATA_DIR=${this.dataDir})`)
    this.child?.kill()
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
  }

  public async closeDriver() {
    console.log(`Closing driver (DATA_DIR=${this.dataDir})`)
    await this.driver?.close()
  }

  public getProcessData = () => {
    let dataDirPath: string = ''
    let resourcesPath: string = ''
    const backendBundlePath = path.normalize('backend-bundle/bundle.cjs')
    const byPlatform = {
      linux: `pgrep -af "${backendBundlePath}" | grep -v egrep | grep "${this.dataDir}"`,
      darwin: `ps -A | grep "${backendBundlePath}" | grep -v egrep | grep "${this.dataDir}"`,
      win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${backendBundlePath.replace(
        /\\/g,
        '\\\\'
      )}%' and commandline LIKE '%${
        this.dataDir
      }%' and name = 'Quiet.exe'} | Format-Table CommandLine -HideTableHeaders -Wrap -Autosize"`
    }

    const command = byPlatform[process.platform as SupportedPlatformDesktop]
    const appBackendProcess = execSync(command).toString('utf8').trim()
    console.log('Backend process info', appBackendProcess)
    let args = appBackendProcess.split(' ')
    if (process.platform === 'win32') {
      args = args.filter(item => item.trim() !== '')
      args = args.map(item => item.trim())
    }
    console.log('Args:', args)
    if (args.length >= 5) {
      if (process.platform === 'win32') {
        dataDirPath = args[5]
        resourcesPath = args[7]
      } else {
        dataDirPath = args[6]
        resourcesPath = args[8]
      }
    }
    console.log('Extracted dataDirPath:', dataDirPath, 'resourcesPath:', resourcesPath)
    return {
      dataDirPath,
      resourcesPath
    }
  }
}
