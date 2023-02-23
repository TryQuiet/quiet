var os = require('os')
var fs = require('fs')
const checkDiskSpace = require('check-disk-space').default

let totalDiskSpace

checkDiskSpace('/').then((diskSpace) => {
  totalDiskSpace = diskSpace.size
})

const totalRAM = os.totalmem()

fs.writeFile('cpuUsage.txt', '', () => {
  console.log('created cpu usage file')
})
fs.writeFile('memoryUsage.txt', '', () => {
  console.log('created memory usage file')
})
fs.writeFile('diskUsage.txt', '', () => {
  console.log('created disk space usage file')
})

const cpuCoresAverage = () => {
  let totalIdle = 0,
    totalTick = 0
  let cpus = os.cpus()

  for (let i = 0, len = cpus.length; i < len; i++) {
    let cpu = cpus[i]

    for (type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  }

  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length }
}

const wrtieDataToFiles = (cpuUsageSecondsList, ramUsageSecondsList, diskUsageSecondsList) => {
  let secondsCpuUsageSum = 0
  let secondsRAMUsageSum = 0
  let secondsDiskUsageSum = 0
  console.log('cpuUsageSecondsList', cpuUsageSecondsList)
  for (let i = 0; i < cpuUsageSecondsList.length; i++) {
    secondsCpuUsageSum += cpuUsageSecondsList[i]
  }

  console.log('RAMUsageSecondsList', ramUsageSecondsList)
  for (let i = 0; i < ramUsageSecondsList.length; i++) {
    secondsRAMUsageSum += ramUsageSecondsList[i]
  }

  console.log('diskUsageSecondsList', diskUsageSecondsList)
  for (let i = 0; i < diskUsageSecondsList.length; i++) {
    secondsDiskUsageSum += diskUsageSecondsList[i]
  }

  let averageOfCpuUsageSeconds = secondsCpuUsageSum / cpuUsageSecondsList.length
  let averageOfRAMUsageSeconds = secondsRAMUsageSum / ramUsageSecondsList.length
  let averageOfDiskUsageSeconds = secondsDiskUsageSum / diskUsageSecondsList.length
  console.log(averageOfCpuUsageSeconds, '% Cpu minute')
  console.log(averageOfRAMUsageSeconds, '% RAM minute')
  console.log(averageOfDiskUsageSeconds, '% Disk minute')

  fs.appendFile('cpuUsage.txt', `${averageOfCpuUsageSeconds}\n`, function (err) {
    if (err) throw err
    console.log('saved cpu usage')
  })

  fs.appendFile('memoryUsage.txt', `${averageOfRAMUsageSeconds}\n`, function (err) {
    if (err) throw err
    console.log('saved memory usage')
  })

  fs.appendFile('diskUsage.txt', `${averageOfDiskUsageSeconds}\n`, function (err) {
    if (err) throw err
    console.log('saved disk usage')
  })
}

let measurementStart = cpuCoresAverage()
let cpuUsageSecondsList = []
let ramUsageSecondsList = []
let diskUsageSecondsList = []

const numberOfAvarageSeconds = 60
let seconds = 0
let minutes = 1

setInterval(() => {
  let measurementEnd = cpuCoresAverage()

  let idleDifference = measurementEnd.idle - measurementStart.idle
  let totalDifference = measurementEnd.total - measurementStart.total
  let percentageCPU = 100 - ~~((100 * idleDifference) / totalDifference)
  cpuUsageSecondsList.push(percentageCPU)
  console.log(percentageCPU + ' % CPU usage second')

  let freeRAM = os.freemem()
  let usedRAM = totalRAM - freeRAM
  let percentageRAM = (100 * usedRAM) / totalRAM
  ramUsageSecondsList.push(percentageRAM)
  console.log(percentageRAM + ' % RAM usage in second')

  checkDiskSpace('/').then((diskSpace) => {
    let freeDiskSpace = diskSpace.free
    let usedDiskSpace = totalDiskSpace - freeDiskSpace
    percentageUsedDiskSpace = (100 * usedDiskSpace) / totalDiskSpace
    diskUsageSecondsList.push(percentageUsedDiskSpace)
    console.log(percentageUsedDiskSpace + ' % Disk space usage in second')
  })

  if (seconds == numberOfAvarageSeconds) {
    wrtieDataToFiles(cpuUsageSecondsList, ramUsageSecondsList, diskUsageSecondsList)
    cpuUsageSecondsList = []
    ramUsageSecondsList = []
    diskUsageSecondsList = []
    seconds = 0
    minutes++
  }

  measurementStart = cpuCoresAverage()
  seconds++
}, 1000)
