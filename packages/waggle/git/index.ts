import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'
import * as child_process from 'child_process'
import uint8arrayFromString from 'uint8arrays/from-string'
import uint8arrayToString from 'uint8arrays/to-string'
import { Request } from '../src/config/protonsRequestMessages'

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
      this.addCommit(repoName, '0', Buffer.from('initial commit'), 1607528064631, null)  
    }
    return standardRepo
  }

  public pullChanges = async (onionAddress: string, repoName: string, mergeTimeFromSource: number | null = null): Promise<number> => {
    const targetRepo = this.gitRepos.get(repoName)
    const mergeTime = Date.now()
    const pull = async (onionAddress, repoName, git: SimpleGit) => {
        await git.env('SOCKS5_PASSWORD', ` `)
        await git.env('GIT_PROXY_COMMAND', `${process.cwd()}/git/script/socks5proxywrapper`)
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

  public addCommit = async (repoName: string, messageId: string, messagePayload: Buffer, date: number, parentId: string | null): Promise<void> => {
    try {
      const targetRepo = this.gitRepos.get(repoName)
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

export const sleep = (time = 1000) =>
  new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })


const main = async () => {
    const git = new Git()
    await git.init()
    await git.createRepository('test-address')
    await git.spawnGitDaemon()
    // await git.addCommit('test-address', '123', Buffer.from('ddddd'), 1607079584362, '23133')
    await sleep(10000)
    await git.pullChanges('jwfvburxit5aym7syf4wskxthjeakwhjdg6f5tktr446ixg556kohmid.onion', 'test-address')
  // const test = Buffer.from('adamek4')
  // const date = new Date()
  // const parrentId = '21312312'
  // const msg = Request.encode({
  //   type: Request.Type.SEND_MESSAGE,
  //   sendMessage: {
  //     data: test,
  //     created: date,
  //     id: uint8arrayFromString((~~(Math.random() * 1e9)).toString(36) + Date.now()),
  //     parentId: uint8arrayFromString(parrentId)
  //   }
  // })

  // fs.writeFileSync(`${os.homedir()}/ZbayChannels/testing-02.12.2020-standard/myfile6.txt`, msg)
  // const testing123 = fs.readFileSync(`${os.homedir()}/ZbayChannels/testing-02.12.2020-standard/myfile6.txt`)

  // // console.log('hey', msg)
  // const request = Request.decode(testing123)
  // console.log('req', uint8arrayToString(request.sendMessage.data))
  // const test1 = uint8arrayToString(request.sendMessage.data)
  // const created1 = request.sendMessage.created
  // id: uint8arrayToString(request.sendMessage.id),
  // parentId: uint8arrayFromString(message.parentId)
  // const content = 'halalala5'
  // const git = new Git(8521)
  // const test = Buffer.from('adamek4')
  //Timeshift.setTime(1607079584362)
  // const date = Date.now().toString()
  // console.log(date, 'date')
  // const commitDate = new Date('1607079584362')
  // console.log(testing, 'testing')
  // await git.startHttpServer()
  // await git.pullChanges('testing-02.12.2020-standard', 'pbl6nhssnih5s6cvpbuv3kibdhj2izmdthdmvwzpydxxw7l4yzsh3kqd.onion', 'testing-02.12.2020', '8521')
  // await sleep(5000)
  // await git.init()
  // await git.createRepository('testing-02.12.2020')
  // await git.createRepository('testing-02.12.2021')

  // await sleep(20000)
  // const parentId = await git.getParentMessage('testing-02.12.2020-standard')
  // const { standardRepo, bareRepo } = await git.createRepository('testing-02.12.2020')
  // await git.addCommit('testing-02.12.2020-standard', 'adamek4', test, 1607079584362, null)
  // await sleep(5000)
  // await git.addCommit('testing-02.12.2021-standard', 'adamek4', test, 1607079584362, null)
  // console.log('finish')
  // const content = 'halalala5'
  // const git = new Git(7766)
  // await git.init()
  // await git.startHttpServer()
  // const test = Buffer.from('alala')
  // const date = new Date()
  // await git.startHttpServer()
  // await git.init()
  // await git.pullChanges('testing-02.12.2020-standard', '4mje2pdhgvhmefugd5yhaet5eof2mlws6hh5qmn6ph4ns6z7njjv74ad.onion', 'testing-02.12.2020', '8521')
  // await sleep(5000)
  // const { standardRepo, bareRepo } = await git.createRepository('testing-02.12.2020')
  // await git.addCommit('testing-02.12.2020-standard', '1234567890', test, date, null)
  // date.setHours(date.getHours() + 2)
  // await sleep(5000)
  // const date2 = new Date(date.getTime())
  // await git.addCommit('testing-02.12.2020-standard', '1111111111', test, date2, '1234567890')
  // await sleep(5000)
  // date.setHours(date.getHours() + 1)
  // const date1 = new Date(date.getTime())
  // await git.addCommit('testing-02.12.2020-standard', '2222222222', test, date1, '1111111111')
  // git.init()
  // const parentId = await git.getParentMessage('testing-02.12.2020-standard')
  // console.log('parenId', parentId)
  // const test = await git.init()
  // console.log('tesing here', test)
  // await git.startHttpServer()
  // const { standardRepo, bareRepo } = await git.createRepository('testing-02.12.2020', 'channel-address')
  // fs.writeFileSync(`${os.homedir()}/ZbayChannels/testing-02.12.2020/myfile3.txt`, content)
  // await standardRepo.add(`${os.homedir()}/ZbayChannels/testing-02.12.2020/*`)
  // await standardRepo.commit('hey3')
  // await standardRepo.push('origin', 'master')
  // await git.pullChanges('papap', '4mje2pdhgvhmefugd5yhaet5eof2mlws6hh5qmn6ph4ns6z7njjv74ad.onion', 'testing-02.12.2020-bare', '8521')
  // console.log(standardRepo.log())
  // console.log(bareRepo.log())
}

// main()
