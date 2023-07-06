// @ts-nocheck
import os from 'os'
import fs from 'fs'
import path from 'path'

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

  console.log(`${fileName} messagesCount: ${dataSet.length}`)
  console.log(`${fileName} average: ${accumulatedPerUser / delaysArrPerUser.length}`)
  console.log(`${fileName} max:`, Math.max(...delaysArrPerUser))
})

// console.log(delaysArr)

const accumulated = delaysArr.reduce((previousValue, currentValue) => {
  return previousValue + currentValue
}, 0)

const longestTime = Math.max(...delaysArr)
console.log(`Users count: ${files.length}`)
console.log('Average:', accumulated / delaysArr.length)
console.log('Max:', longestTime)
