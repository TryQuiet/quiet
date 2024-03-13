import { Browser, Builder, type ThenableWebDriver } from 'selenium-webdriver'
import { spawn, exec, execSync, type ChildProcessWithoutNullStreams } from 'child_process'
import { type SupportedPlatformDesktop } from '@quiet/types'
import getPort from 'get-port'
import path from 'path'
import fs from 'fs'
import { DESKTOP_DATA_DIR } from '@quiet/common'

export const BACKWARD_COMPATIBILITY_BASE_VERSION = '2.0.1' // Pre-latest production version
const appImagesPath = `${__dirname}/../Quiet`

export interface BuildSetupInit {
  port?: number
  debugPort?: number
  defaultDataDir?: boolean
  dataDir?: string
  fileName?: string
}

export class BuildSetup {
  private driver?: ThenableWebDriver | null
  public port?: number
  public debugPort?: number
  public dataDir?: string
  private child?: ChildProcessWithoutNullStreams
  private defaultDataDir: boolean
  private fileName?: string

  constructor({ port, debugPort, defaultDataDir = false, dataDir, fileName }: BuildSetupInit) {
    this.port = port
    this.debugPort = debugPort
    this.defaultDataDir = defaultDataDir
    this.dataDir = dataDir
    this.fileName = fileName
    if (this.defaultDataDir) this.dataDir = DESKTOP_DATA_DIR
    if (!this.dataDir) {
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
        return `${process.env.LOCALAPPDATA}\\Programs\\@quietdesktop\\Quiet.exe`
      case 'darwin':
        let basePath = '/Applications';
        if (process.env.LOCAL === 'true') {
          console.warn("RUNNING ON LOCAL BINARY")
          basePath = `${__dirname}/../../desktop/dist/${process.arch === 'arm64' ? 'mac-arm64' : 'mac'}`
        }

        return `${basePath}/Quiet.app/Contents/MacOS/Quiet`
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public getVersionFromEnv() {
    const envFileName = process.env.FILE_NAME
    if (!envFileName) {
      throw new Error('file name not specified')
    }
    switch (process.platform) {
      case 'linux':
        const linuxIndex = envFileName.indexOf('.AppImage')
        const linuxVersion = envFileName.slice(6, linuxIndex)
        return linuxVersion
      case 'win32':
        const winIndex = envFileName.indexOf('.exe')
        const winVersion = envFileName.slice(12, winIndex)
        return winVersion
      case 'darwin':
        const darwinIndex = envFileName.indexOf('.dmg')
        const darwinVersion = envFileName.slice(6, darwinIndex)
        return darwinVersion
      default:
        throw new Error('wrong SYSTEM env')
    }
  }

  public killNine() {
    exec(`kill -9 $(lsof -t -i:${this.port})`)
    exec(`kill -9 $(lsof -t -i:${this.debugPort})`)
  }

  public async createChromeDriver() {
    await this.initPorts()
    const env = {
      DEBUG: 'backend*,desktop*,utils*,main*',
      DATA_DIR: this.dataDir,
    }
    if (process.platform === 'win32') {
      console.log('!WINDOWS!')
      this.child = spawn(`cd node_modules/.bin & chromedriver.cmd --port=${this.port} --verbose`, [], {
        shell: true,
        env: Object.assign(process.env, env),
      })
    } else {
      this.child = spawn(`node_modules/.bin/chromedriver --port=${this.port} --verbose`, [], {
        shell: true,
        detached: false,
        env: Object.assign(process.env, env),
      })
    }
    // Extra time for chromedriver to setup
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 2000)
    )

    this.child.on('error', () => {
      console.error('ERROR')
      this.killNine()
    })

    this.child.on('exit', () => {
      console.log('EXIT')
      this.killNine()
    })

    this.child.on('close', () => {
      console.log('CLOSE')
      this.killNine()
    })

    this.child.on('message', data => {
      console.log('message', data)
    })
    this.child.on('error', data => {
      console.error('error', data)
    })

    this.child.stdout.on('data', data => {
      console.log(`stdout:\n${data}`)
    })

    this.child.stderr.on('data', data => {
      // Quiet logs (handled by 'debug' package) are available in stderr and only with 'verbose' flag on chromedriver
      const trashLogs = ['DevTools', 'COMMAND', 'INFO:CONSOLE', '[INFO]:', 'libnotify-WARNING', 'ALSA lib']
      const dataString = `${data}`
      for (const l of trashLogs) {
        if (dataString.includes(l)) return
      }
      console.log(`[${this.dataDir}]: ${dataString}`)
    })

    this.child.stdin.on('data', data => {
      console.log(`stdin: ${data}`)
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
    if (!this.driver) {
      const binary: string = this.getBinaryLocation()
      try {
        this.driver = new Builder()
          .usingServer(`http://localhost:${this.port}`)
          .withCapabilities({
            'goog:chromeOptions': {
              binary,
              args: [`--remote-debugging-port=${this.debugPort}`, '--enable-logging'],
            },
          })
          .forBrowser(Browser.CHROME)
          .build()
      } catch (e) {
        console.log(e)
      }
    }

    if (this.driver == null || this.driver === undefined) {
      throw new Error('No driver')
    }

    return this.driver
  }

  public resetDriver() {
    this.driver = null
  }

  public async killChromeDriver() {
    console.log(`Killing driver (DATA_DIR=${this.dataDir})`)
    this.child?.kill()
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 2000)
    )
  }

  public async closeDriver() {
    console.log(`Closing driver (DATA_DIR=${this.dataDir})`)
    await this.driver?.close()
  }

  public getProcessData = () => {
    let dataDirPath = ''
    let resourcesPath = ''
    const backendBundlePath = path.normalize('backend-bundle/bundle.cjs')
    const byPlatform = {
      linux: `pgrep -af "${backendBundlePath}" | grep -v egrep | grep "${this.dataDir}"`,
      darwin: `ps -A | grep "${backendBundlePath}" | grep -v egrep | grep "${this.dataDir}"`,
      win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${backendBundlePath.replace(
        /\\/g,
        '\\\\'
      )}%' and commandline LIKE '%${
        this.dataDir
      }%' and name = 'Quiet.exe'} | Format-Table CommandLine -HideTableHeaders -Wrap -Autosize"`,
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
      resourcesPath,
    }
  }
}

const quietAppImage = (version = BACKWARD_COMPATIBILITY_BASE_VERSION) => {
  return `Quiet-${version}.AppImage`
}

export const downloadInstaller = (version = BACKWARD_COMPATIBILITY_BASE_VERSION) => {
  if (process.platform !== 'linux') throw new Error('Linux support only')

  const appImage = quietAppImage(version)
  const appImageTargetPath = path.join(appImagesPath, appImage)
  if (fs.existsSync(appImageTargetPath)) {
    console.log(`${appImage} already exists. Skipping download.`)
    return appImage
  }
  const downloadUrl = `https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fdesktop%40${version}/${appImage}`
  console.log(`Downloading Quiet version: ${version} from ${downloadUrl}`)
  // With newer curl: execSync(`curl -LO --output-dir ${appImagesPath} ${downloadUrl}`)
  execSync(`curl -LO ${downloadUrl}`)
  const appImageDownloadPath = path.join(process.cwd(), appImage)
  console.log(`Downloaded to ${appImageDownloadPath}`)
  fs.renameSync(appImageDownloadPath, appImageTargetPath)
  console.log('Moved to', appImageTargetPath)
  // Make it executable
  fs.chmodSync(appImageTargetPath, 0o755)
  return appImage
}

export const copyInstallerFile = (file: string) => {
  if (process.platform !== 'linux') throw new Error('Linux support only')

  const base = path.join(appImagesPath, file)
  const parsedBase = path.parse(file)
  const copiedFileName = `${parsedBase.name}-copy${parsedBase.ext}`
  const copiedFilePath = path.join(appImagesPath, copiedFileName)
  if (fs.existsSync(copiedFilePath)) {
    console.log(`${copiedFileName} already exists. Skipping copy.`)
    return copiedFileName
  }

  fs.copyFileSync(base, copiedFilePath)
  console.log(`Copied ${base} to ${copiedFilePath}`)
  return copiedFileName
}

export const sleep = async (time = 1000) => {
  await new Promise<void>(resolve =>
    setTimeout(() => {
      resolve()
    }, time)
  )
}
