import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'
import * as child_process from 'child_process'
import uint8arrayToString from 'uint8arrays/to-string'
import { Request } from '../config/protonsRequestMessages'

export enum Type {
  BARE,
  STANDARD
}

export enum State {
  LOCKED,
  UNLOCKED
}

export interface IRepos {
  git: SimpleGit,
  type: Type,
  parentId: string | null,
  state: State
}

export class Git {
  process: child_process.ChildProcessWithoutNullStreams | null = null
  git: SimpleGit
  gitRepos: Map<string, IRepos>
  staticDateOfRepoCreation: number
  constructor() {
    this.gitRepos = new Map()
    this.staticDateOfRepoCreation = 1607528064631
  }

  public init = async () => {
    const targetPath = `${os.homedir()}/ZbayChannels/`
    this.createPaths([targetPath])
    const dirs = fs.readdirSync(targetPath).filter(f => fs.statSync(path.join(targetPath, f)).isDirectory())
      if (dirs.length > 0) {
        for (const dir of dirs) {
          const options = {
            baseDir: `${targetPath}${dir}/`,
            binary: 'git',
            maxConcurrent: 6
          }
          const git = simpleGit(options)
          this.gitRepos.set(`${dir}`, {
            git,
            type: Type.STANDARD,
            parentId: null,
            state: State.UNLOCKED
          })
        }
      }
    return this.gitRepos
  }

  private createPaths = (paths: string[]) => {
    for (const path of paths)
    if (!fs.existsSync(path)){
      fs.mkdirSync(path, { recursive: true });
    }
  }

  private addRepo = async (repoPath: string, repoName: string) => {
    const options = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrent: 6
    }
    const git = simpleGit(options)
      await git.init()
    this.gitRepos.set(repoName, {
      git: git,
      type: Type.STANDARD,
      parentId: null,
      state: State.UNLOCKED
    })
    return this.gitRepos.get(repoName)
  }

  public createRepository = async (repoName: string) => {
    let standardRepo = this.gitRepos.get(repoName)
    if (!standardRepo) {
      const repoPath = `${os.homedir()}/ZbayChannels/${repoName}/`
      this.createPaths([repoPath])
      standardRepo = await this.addRepo(repoPath, repoName)
      await this.addCommit(repoName, '0', Buffer.from('initial commit'), 1607528064631, null)  
    }
    return standardRepo
  }

  public pullChanges = async (onionAddress: string, repoName: string, mergeTimeFromSource: number | null = null): Promise<number> => {
    const targetRepo = this.gitRepos.get(repoName)
    const mergeTime = Date.now()
    const pull = async (onionAddress, repoName, git: SimpleGit) => {
        await git.env('SOCKS5_PASSWORD', ` `)
        await git.env('GIT_PROXY_COMMAND', `${process.cwd()}/git/script/socks5proxywrapper`)
        await git.env('BINARY_PATH', `${process.cwd()}/git/script/connect`)
        await targetRepo.git.env('GIT_COMMITTER_DATE', `"${new Date(mergeTimeFromSource || mergeTime).toUTCString()}"`)
        await targetRepo.git.env('GIT_AUTHOR_DATE', `"${new Date(mergeTimeFromSource || mergeTime).toUTCString()}"`)
        await targetRepo.git.addConfig('user.name', 'zbay')
        await targetRepo.git.addConfig('user.email', 'zbay@unknown.world')
        await git.pull(`git://${onionAddress.toString()}/${repoName}/`, 'master', ['-Xtheirs'])
        return mergeTimeFromSource || mergeTime
    }
    try {
      if (!targetRepo) {
        const standardRepo = await this.createRepository(`${repoName}`)
        await pull(onionAddress, repoName, standardRepo.git)
      } else {
        await pull(onionAddress, repoName, targetRepo.git)
    }
      return mergeTimeFromSource || mergeTime
    } catch (err) {
      console.log(err)
      return null
    }
  }

  public getParentMessage = async (id: string) => {
    const targetFilePath = `${os.homedir()}/ZbayChannels/${id}/`
    let parentId = this.gitRepos.get(id).parentId
    const dir = fs.readdirSync(targetFilePath).filter(el => !el.includes('git'))
    if (!parentId && dir.length > 0) {
      const sortFiles = dir.sort((a, b) => {
        return fs.statSync(targetFilePath + b).mtime.getTime() - fs.statSync(targetFilePath + a).mtime.getTime()
      })
      parentId = sortFiles[0]
      this.gitRepos.get(id).parentId = parentId
    }
    return parentId
  }

  public loadAllMessages = async (id: string) => {
    const targetFilePath = `${os.homedir()}/ZbayChannels/${id}/`
    const files = fs.readdirSync(targetFilePath).filter(f => !fs.statSync(path.join(targetFilePath, f)).isDirectory())
    const messages = []
    for (const file of files) {
      if(file !== '0') {
        const data = fs.readFileSync(path.join(targetFilePath, file))
        const { sendMessage } = Request.decode(data)
        const timestamp = sendMessage.created
        const message = sendMessage.data.toString()
        const signature = sendMessage.signature.toString()
        const msg = {
          timestamp,
          message, 
          signature
        }
        messages.push(msg)
      }
    }
    const orderedMessages = messages.sort((a, b) => a.timestamp - b.timestamp)
    return orderedMessages
  }

  public addCommit = async (repoName: string, messageId: string, messagePayload: Buffer, date: number, parentId: string | null): Promise<void> => {
    try {
      let targetRepo = this.gitRepos.get(repoName)
      if (!targetRepo) {
        targetRepo = await this.createRepository(`${repoName}`)
      }
      await targetRepo.git.addConfig('user.name', 'zbay')
      await targetRepo.git.addConfig('user.email', 'zbay@unknown.world')
      await targetRepo.git.env('GIT_COMMITTER_DATE', `"${new Date(date).toUTCString()}"`)
      const targetFilePath = `${os.homedir()}/ZbayChannels/${repoName}/${messageId}`
      fs.writeFileSync(targetFilePath, messagePayload)
      const dateObj = new Date(date)
      fs.utimesSync(targetFilePath, dateObj, dateObj)
      await targetRepo.git.add(`${os.homedir()}/ZbayChannels/${repoName}/*`)
      await targetRepo.git.commit(`messageId: ${messageId} parentId: ${parentId}`, null, { '--date': new Date(date).toUTCString() })
      targetRepo.parentId = messageId
    } catch (e) {
      console.log(e)
    }
  }

  public getCurrentHEAD = async (repoName) => {
    try {
      const standardRepo = this.gitRepos.get(repoName)
      if (!standardRepo) {
        await this.createRepository(repoName)
        return null
      }
      const currentHEAD = standardRepo.git.revparse(['HEAD'])
      return currentHEAD
    } catch (err) {
      return null
    }
  }


  public spawnGitDaemon = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (this.process) {
      throw new Error('Already initialized')
    }
      this.process = child_process.spawn('git', ['daemon', `--base-path=${os.homedir()}/ZbayChannels/`, `--export-all`, `--verbose`])
    const id = setTimeout(() => {
      this.process?.kill()
      reject('Process timeout ??')
    }, 20000)
    this.process.stderr.on('data', (data) => {
      console.log('data', data.toString())
      if (data.toString().includes(`Ready`)) {
        clearTimeout(id)
        resolve()
      }
    })
  })
}

