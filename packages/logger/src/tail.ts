import { DateTime } from 'luxon'
import { globSync } from 'glob'
import path from 'path'
import fs from 'fs'
import * as chokidar from 'chokidar'

const Tail = require('tail').Tail

import { TailLoggerFunction } from './types'
import { LOG_PATH } from './const'

export class LogFileTailer {
  private tailedFiles: string[] = []

  constructor() {}

  public tailAllLogFiles(
    basePath: string,
    watch: boolean = true,
    consoleFunction: TailLoggerFunction = console.log
  ): void {
    if (process.env.NODE_ENV !== 'development') {
      consoleFunction(`${DateTime.utc().toISO()} Not running in development, not tailing log files in path ${basePath}`)
    }

    const logPath = path.join(basePath, LOG_PATH)
    const exists = fs.existsSync(logPath)
    if (!exists) {
      fs.mkdirSync(logPath)
    }

    consoleFunction(`${DateTime.utc().toISO()} Searching for logs to tail in ${logPath}`)
    const logFiles = globSync(`${logPath}/*.log`, { absolute: true })

    if (watch) {
      this.watch(logPath, consoleFunction)
    }

    if (!watch && (logFiles == null || logFiles.length === 0)) {
      consoleFunction(`${DateTime.utc().toISO()} No log files found for path ${logPath}`)
      return
    }

    consoleFunction(
      `${DateTime.utc().toISO()} Found the following log files to tail: ${JSON.stringify(logFiles, null, 2)}`
    )
    for (const logFile of logFiles) {
      this.tail(logFile, consoleFunction)
    }
  }

  private tail(fileName: string, consoleFunction: TailLoggerFunction = console.log): void {
    if (this.tailedFiles.includes(fileName)) {
      consoleFunction(`${DateTime.utc().toISO()} Already tailing ${fileName}`)
    }

    consoleFunction(`${DateTime.utc().toISO()} DEVELOPMENT: tailing log file ${fileName}`)
    try {
      const tail = new Tail(fileName)
      this.tailedFiles.push(fileName)

      tail.on('line', function (data: any) {
        consoleFunction(data)
      })
    } catch (e) {
      consoleFunction(`${DateTime.utc().toISO()} Failed to tail ${fileName}, it may not be created yet!`)
    }
  }

  private watch(logPath: string, consoleFunction: TailLoggerFunction = console.log): void {
    const watcher = chokidar.watch(logPath, {
      ignored: /(^|[/\\])(\..*|.*\.[0-9]{4}-[0-9]{2}-[0-9]{2})/, // ignore daily log files and dot files
      persistent: true,
    })
    watcher.on('add', (path: string) => {
      consoleFunction(`${DateTime.utc().toISO()} Watcher found new file ${path} in ${logPath}, attempting to tail...`)
      this.tail(path, consoleFunction)
    })
  }
}
