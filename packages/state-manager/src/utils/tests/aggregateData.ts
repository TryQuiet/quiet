import os from 'os'
import fs from 'fs'

const path = `${os.homedir()}/data.json`

let dataSet = []

if (fs.existsSync(path)) {
  const data = fs.readFileSync(path, 'utf-8')
  dataSet = JSON.parse(data)
}

const delaysArr = []

dataSet.forEach((_o) => {
  const delay = Object.values(_o)[0]
  delaysArr.push(delay)
})

const accumulated = delaysArr.reduce((previousValue, currentValue) => {
  return previousValue + currentValue
}, 0)

const longestTime = Math.max(...delaysArr)
console.log(accumulated / delaysArr.length)
console.log(longestTime)
