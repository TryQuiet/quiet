const fs = require('fs')
const os = require('os')
const path = require('path')

console.log(`Ensuring husky init file(s) are in place`)

const initShFileName = 'init.sh'
const huskyDirPath = path.join(__dirname, '../', '.husky')
const configPath = path.join(os.homedir(), '/.config/')
const huskyConfigDirPath = path.join(configPath, '/husky/')

if (!fs.existsSync(configPath)) {
  console.log(`The directory ${configPath} doesn't exist, creating now`)
  fs.mkdirSync(configPath)
}

if (!fs.existsSync(huskyConfigDirPath)) {
  console.log(`The directory ${huskyConfigDirPath} doesn't exist, creating now`)
  fs.mkdirSync(huskyConfigDirPath)
}

const localInitShPath = path.join(huskyDirPath, initShFileName)
const configInitShPath = path.join(huskyConfigDirPath, initShFileName)
if (!fs.existsSync(configInitShPath)) {
  console.log(`The init.sh file doesn't exist at ${configInitShPath}, copying from ${localInitShPath}`)
  fs.symlinkSync(localInitShPath, configInitShPath)
}

console.log(`Done`)




