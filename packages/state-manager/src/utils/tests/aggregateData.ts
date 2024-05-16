// @ts-nocheck
import os from 'os'
import fs from 'fs'
import path from 'path'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('aggregateData')

const dirPath = process.argv[2]
const files = fs.readdirSync(dirPath || `${os.homedir()}/s3data`)

let delaysArr = []

files.forEach(fileName => {
  const filePath = path.join(dirPath, fileName)
  let dataSet = []
  const delaysArrPerUser = []
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8')
    dataSet = JSON.parse(data)
  }

  dataSet.forEach(_o => {
    const delay = Object.values(_o)[0]
    delaysArrPerUser.push(delay)
  })

  delaysArr = delaysArr.concat(delaysArrPerUser)

  const accumulatedPerUser = delaysArrPerUser.reduce((previousValue, currentValue) => {
    return previousValue + currentValue
  }, 0)

  logger.info(`${fileName} messagesCount: ${dataSet.length}`)
  logger.info(`${fileName} average: ${accumulatedPerUser / delaysArrPerUser.length}`)
  logger.info(`${fileName} max:`, Math.max(...delaysArrPerUser))
})

// logger.info(delaysArr)

const accumulated = delaysArr.reduce((previousValue, currentValue) => {
  return previousValue + currentValue
}, 0)

const longestTime = Math.max(...delaysArr)
logger.info(`Users count: ${files.length}`)
logger.info('Average:', accumulated / delaysArr.length)
logger.info('Max:', longestTime)
