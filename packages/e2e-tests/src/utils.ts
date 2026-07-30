import { Browser, Builder, type ThenableWebDriver } from 'selenium-webdriver'
import { spawn, exec, execSync, type ChildProcessWithoutNullStreams, ChildProcess } from 'child_process'
import { type SupportedPlatformDesktop } from '@quiet/types'
import getPort from 'get-port'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { DESKTOP_DATA_DIR, getAppDataPath } from '@quiet/common'
import { RetryConfig } from './types'
import { config } from 'dotenv'

import { createLogger } from './logger'

const logger = createLogger('utils')

export const BACKWARD_COMPATIBILITY_BASE_VERSION = '7.0.1' // version to test against
const appImagesPath = `${__dirname}/../Quiet`
const defaultChromeDriverPath = require.resolve('electron-chromedriver/chromedriver.js')

export interface BuildSetupInit {
  port?: number
  debugPort?: number
  defaultDataDir?: boolean
  dataDir?: string
  fileName?: string
  chromeDriverPath?: string
  username?: string
}

export class BuildSetup {
  private driver?: ThenableWebDriver | null
  private processOutput = ''
  public port?: number
  public debugPort?: number
  public dataDir?: string
  public dataDirPath: string
  public id: string
  public child?: ChildProcessWithoutNullStreams
  private defaultDataDir: boolean
  private fileName?: string
  private chromeDriverPath?: string

  constructor({
    port,
    debugPort,
    defaultDataDir = false,
    dataDir,
    fileName,
    chromeDriverPath,
    username,
  }: BuildSetupInit) {
    this.port = port
    this.debugPort = debugPort
    this.defaultDataDir = defaultDataDir
    this.dataDir = dataDir
    this.fileName = fileName
    this.chromeDriverPath = chromeDriverPath
    this.id = `${username ?? Date.now()}_${(Math.random() * 10 ** 18).toString(36)}`
    if (this.defaultDataDir) this.dataDir = DESKTOP_DATA_DIR
    if (this.dataDir == null) {
      this.dataDir = `e2e_${this.id}`
    }
    this.dataDirPath = getAppDataPath({ dataDir: this.dataDir })
    logger.info('Running app from directory', this.dataDirPath)
  }

  async initPorts() {
    this.port = await getPort()
    this.debugPort = await getPort()
  }

  // Note: .env file is being used locally right now, mainly by script e2e:linux:build
  static getEnvFileName() {
    const { parsed, error } = config()
    logger.info('Dotenv config', { parsed, error })
    return process.env.FILE_NAME
  }

  private getBinaryLocation(): string {
    let binaryPath: string | undefined = undefined
    switch (process.platform) {
      case 'linux':
        logger.info('filename', this.fileName)
        binaryPath = `${__dirname}/../Quiet/${this.fileName ? this.fileName : BuildSetup.getEnvFileName()}`
        break
      case 'win32':
        binaryPath = `${process.env.LOCALAPPDATA}\\Programs\\@quietdesktop\\Quiet.exe`
        break
      case 'darwin':
        binaryPath = this.getMacBinaryDir()
        break
      default:
        throw new Error(`Running on unsupported platform ${process.platform}`)
    }

    logger.info('Found binary path', binaryPath, process.platform, this.fileName)
    return binaryPath
  }

  private getMacBinaryDir(): string {
    let basePath = '/Applications'
    if (process.env.IS_LOCAL === 'true') {
      logger.warn('RUNNING ON LOCAL BINARY')
      const distDirByArch = process.arch === 'arm64' ? 'mac-arm64' : 'mac'
      basePath = `${__dirname}/../../desktop/dist/${distDirByArch}`
    }

    return `${basePath}/Quiet.app/Contents/MacOS/Quiet`
  }

  public getVersionFromEnv() {
    const envFileName = BuildSetup.getEnvFileName()
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

  private getChromeDriverSpawnConfig() {
    const args = [`--port=${this.port}`, '--verbose']
    const chromeDriverPath = this.chromeDriverPath ?? defaultChromeDriverPath

    return {
      command: process.execPath,
      args: [chromeDriverPath, ...args],
      shell: false,
    }
  }

  public async createChromeDriver(qssEnabled = false) {
    await this.initPorts()
    let env: any = {
      DEBUG:
        process.env.TRACE_APP_LOGS === 'true'
          ? '*:trace'
          : 'backend*,quiet*,state-manager*,desktop*,utils*,identity*,common*,main,libp2p:*',
      DATA_DIR: this.dataDir,
      STATIC_LOG_ID: this.id,
    }
    if (qssEnabled) {
      env = {
        ...env,
        QSS_ALLOWED: true,
        QSS_ENDPOINT: 'ws://127.0.0.1:3003',
      }
    } else {
      env = {
        ...env,
        QSS_ALLOWED: false,
      }
    }

    const chromeDriver = this.getChromeDriverSpawnConfig()
    if (process.platform === 'win32' && !this.chromeDriverPath) {
      logger.info('!WINDOWS!')
    }
    this.child = spawn(chromeDriver.command, chromeDriver.args, {
      shell: chromeDriver.shell,
      detached: false,
      env: Object.assign(process.env, env),
    })
    // Extra time for chromedriver to setup
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 2000)
    )

    this.child.on('error', () => {
      logger.error('ERROR')
      // this.killNine()
    })

    this.child.on('exit', () => {
      logger.info('EXIT')
      // this.killNine()
    })

    this.child.on('close', () => {
      logger.info('CLOSE')
      // this.killNine()
    })

    this.child.on('message', data => {
      logger.info('message', data)
    })
    this.child.on('error', data => {
      logger.error('error', data)
    })

    this.child.stdout.on('data', data => {
      this.appendProcessOutput(data)
      logger.info(`stdout:\n${data}`)
    })

    this.child.stderr.on('data', data => {
      this.appendProcessOutput(data)
      // Quiet logs (handled by 'debug' package) are available in stderr and only with 'verbose' flag on chromedriver
      const trashLogs = ['DevTools', 'COMMAND', 'INFO:CONSOLE', '[INFO]:', 'libnotify-WARNING', 'ALSA lib']
      const dataString = `${data}`
      for (const l of trashLogs) {
        if (dataString.includes(l)) return
      }
      logger.info(`[${this.dataDir}]: ${dataString}`)
    })

    this.child.stdin.on('data', data => {
      logger.info(`stdin: ${data}`)
    })
  }

  private appendProcessOutput(data: unknown): void {
    this.processOutput = `${this.processOutput}${String(data)}`.slice(-2_000_000)
  }

  public clearProcessOutput(): void {
    this.processOutput = ''
  }

  public async waitForProcessOutput(text: string, timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (this.processOutput.includes(text)) {
        return
      }
      await sleep(250)
    }
    throw new Error(`Process output for ${this.dataDir} did not contain "${text}" within ${timeoutMs}ms`)
  }

  public async getTorPid() {
    const execAsync = async (cmd: string) => {
      return await new Promise(resolve => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            logger.warn(error)
          }
          resolve(stdout || stderr)
        })
      })
    }
    const torPid = await execAsync('lsof -t -c tor')
    logger.info({ torPid })
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
        logger.error(`Error while getting chrome driver`, e)
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
    logger.info(`Killing driver (DATA_DIR=${this.dataDir})`)
    this.child?.kill()
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 2000)
    )
  }

  public async closeDriver() {
    logger.info(`Closing driver (DATA_DIR=${this.dataDir})`)
    await this.driver?.close()
  }

  public clearDataDir(force: boolean = false) {
    if (process.env.IS_CI === 'true' && !force) {
      logger.warn('Not deleting data directory because we are running in CI')
      return
    }
    logger.info(`Deleting data directory at ${this.dataDirPath}`)
    try {
      fs.rmdirSync(this.dataDirPath, { recursive: true })
    } catch (e) {
      logger.error(`Could not delete ${this.dataDirPath}`, e)
    }
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
    logger.info('Backend process info', appBackendProcess)
    // Use regex to extract paths instead of splitting by spaces
    if (process.platform === 'darwin') {
      // Match dataDirPath (Application Support path)
      const dataDirMatch = appBackendProcess.match(
        /\/(?:Users|Volumes)\/[\w\-/ ]*Application Support\/[\w\-/ ]+(?=\s-\w|$)/
      )
      if (dataDirMatch) {
        dataDirPath = dataDirMatch[0]
      }
      // Match resourcesPath (Quiet.app/Contents/Resources)
      const resourcesPathMatch = appBackendProcess.match(/\/[\w\-/.]+Quiet\.app\/Contents\/Resources/)
      if (resourcesPathMatch) {
        resourcesPath = resourcesPathMatch[0]
      }
    } else if (process.platform === 'linux') {
      // Dynamically match the literal data‑dir, stopping before the next CLI flag or EOL
      const dataDirRegexp = new RegExp(`[\\\\/]\\S*${this.dataDir}(?=\\s-\\w|$)`)
      const dataDirMatch = appBackendProcess.match(dataDirRegexp)
      if (dataDirMatch) {
        dataDirPath = dataDirMatch[0]
      }

      // Resources path is optional on Linux; keep a permissive heuristic
      const resourcesPathMatch = appBackendProcess.match(/\\S+Quiet\.app\/Contents\/Resources/)
      if (resourcesPathMatch) {
        resourcesPath = resourcesPathMatch[0]
      }
    } else if (process.platform === 'win32') {
      // Capture the values passed to -a and -r, regardless of order or quoting
      const dataDirMatch = appBackendProcess.match(/-a\s+"?([A-Za-z]:\\[^"-]+)"?/i)
      if (dataDirMatch) {
        dataDirPath = dataDirMatch[1]
      }
      const resourcesPathMatch = appBackendProcess.match(/-r\s+"?([A-Za-z]:\\[^"-]+)"?/i)
      if (resourcesPathMatch) {
        resourcesPath = resourcesPathMatch[1]
      }
    }
    logger.info('Extracted dataDirPath:', dataDirPath, 'resourcesPath:', resourcesPath)
    return {
      dataDirPath,
      resourcesPath,
    }
  }
}

export const tailQssLogs = (): ChildProcess => {
  const child = spawn('docker compose', ['-f', 'docker-compose.quiet.yml', 'logs', '-f', 'qss-quiet'], {
    cwd: path.join('../../3rd-party/qss/app/'),
    shell: true,
  })

  child.stdout!.on('data', (data: Buffer) => {
    console.log(data.toString('utf-8'))
  })
  child.stderr!.on('data', (data: Buffer) => {
    console.log(data.toString('utf-8'))
  })
  child.on('error', (error: Error) => {
    logger.error('Error on docker log tailer', JSON.stringify(error))
  })

  return child
}

const quietAppImage = (version = BACKWARD_COMPATIBILITY_BASE_VERSION) => {
  return `Quiet-${version}.AppImage`
}

export const downloadInstaller = (version = BACKWARD_COMPATIBILITY_BASE_VERSION) => {
  if (process.platform !== 'linux') throw new Error('Linux support only')

  const appImage = quietAppImage(version)
  const appImageTargetPath = path.join(appImagesPath, appImage)
  if (fs.existsSync(appImageTargetPath)) {
    logger.info(`${appImage} already exists. Skipping download.`)
    return appImage
  }
  const downloadUrl = `https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fdesktop%40${version}/${appImage}`
  logger.info(`Downloading Quiet version: ${version} from ${downloadUrl}`)
  // With newer curl: execSync(`curl -LO --output-dir ${appImagesPath} ${downloadUrl}`)
  execSync(`curl -LO ${downloadUrl}`)
  const appImageDownloadPath = path.join(process.cwd(), appImage)
  logger.info(`Downloaded to ${appImageDownloadPath}`)
  fs.renameSync(appImageDownloadPath, appImageTargetPath)
  logger.info('Moved to', appImageTargetPath)
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
    logger.info(`${copiedFileName} already exists. Skipping copy.`)
    return copiedFileName
  }

  fs.copyFileSync(base, copiedFilePath)
  logger.info(`Copied ${base} to ${copiedFilePath}`)
  return copiedFileName
}

export const sleep = async (timeMs = 1000) => {
  await new Promise<void>(resolve =>
    setTimeout(() => {
      resolve()
    }, timeMs)
  )
}

export class Timeout {
  private id: NodeJS.Timeout | number | undefined = undefined

  public set(timeoutMs: number, reason: string): Promise<unknown> {
    if (this.id != null) {
      throw new Error('Timeout already set')
    }

    return new Promise((resolve, reject) => {
      this.id = setTimeout(() => {
        reject(reason)
        this.clear()
      }, timeoutMs)
    })
  }

  public async wrap<T>(promise: Promise<T>, timeoutMs: number, reason: string): Promise<T> {
    return (Promise.race([promise, this.set(timeoutMs, reason)]) as Promise<T>)
      .catch(reason => {
        throw new Error(reason)
      })
      .finally(() => this.clear())
  }

  public clear(): void {
    if (this.id == null) {
      logger.warn(`Timeout already cleared!`)
      return
    }

    clearTimeout(this.id as NodeJS.Timeout)
    this.id = undefined
  }
}

export const promiseWithTimeout = async <T>(
  promise: Promise<T>,
  reason: string,
  timeoutMs: number,
  onTimeout?: () => Promise<void>
): Promise<T> => {
  const timeout = new Timeout()
  try {
    const result: T = await timeout.wrap(promise, timeoutMs, reason)
    timeout.clear()
    return result
  } catch (e) {
    if (e.message === reason) {
      if (onTimeout != null) await onTimeout()
      throw logAndReturnError(e)
    }
    throw e
  }
}

export const promiseWithRetries = async <T>(
  promise: Promise<T>,
  reason: string,
  retryConfig: RetryConfig,
  onTimeout?: () => Promise<void>
): Promise<T> => {
  const attempts = 0
  while (attempts < retryConfig.attempts) {
    try {
      const result: T = await promiseWithTimeout(promise, reason, retryConfig.timeoutMs, onTimeout)
      return result
    } catch (e) {
      logger.error(e.message)
      if (e.message === reason) {
        logger.warn(`Timeout exceeded on promise with reason: ${reason}`)
        continue
      }
      throw e
    }
  }

  throw logAndReturnError(`Exceeded ${retryConfig.attempts} retry attempts`)
}

export const logAndReturnError = (error: string | Error): Error => {
  let errorText: string
  let err: Error
  if (error instanceof Error) {
    errorText = error.message
    err = error
  } else {
    errorText = error
    err = new Error(errorText)
  }
  logger.error(errorText)
  return err
}

export const createArbitraryFile = (filePath: string, sizeBytes: number) => {
  const stream = fs.createWriteStream(filePath)
  const maxChunkSize = 1048576 // 1MB

  let remainingSize = sizeBytes

  while (remainingSize > 0) {
    const chunkSize = Math.min(maxChunkSize, remainingSize)
    stream.write(crypto.randomBytes(chunkSize))
    remainingSize -= chunkSize
  }

  stream.end()
}
