import os from 'os'
import fs from 'fs'
import path from 'path'

const dirPath = process.argv[2]
const files = fs.readdirSync(dirPath || `${os.homedir()}/s3data`)

const delaysArr = []

files.forEach((fileName) => {
  let filePath = path.join(dirPath, fileName)
  let dataSet = []
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8')
    dataSet = JSON.parse(data)
  }
  
  dataSet.forEach((_o) => {
    const delay = Object.values(_o)[0]
    delaysArr.push(delay)
  })
})

console.log(delaysArr)

const accumulated = delaysArr.reduce((previousValue, currentValue) => {
  return previousValue + currentValue
}, 0)

const longestTime = Math.max(...delaysArr)
console.log(accumulated / delaysArr.length)
console.log(longestTime)
