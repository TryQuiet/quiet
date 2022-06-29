var os = require("os")
var fs = require('fs')
var disk = require('diskusage');

// disk.check('/', function (err, info) {
//   console.log(info.free);
//   console.log(info.total);
// });

const totalRAM = os.totalmem()
const totalRAMInMB = totalRAM / (1024 * 1024)

fs.writeFile('cpuUsage.txt', '', () => { console.log('created cpu usage file') })
fs.writeFile('memoryUsage.txt', '', () => { console.log('created memory usage file') })

const cpuCoresAverage = () => {
  let totalIdle = 0, totalTick = 0;
  let cpus = os.cpus();

  for (let i = 0, len = cpus.length; i < len; i++) {
    let cpu = cpus[i]

    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
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

const numberOfAvarageSeconds = 10
let seconds = 0
let minutes = 1

setInterval(() => {
  let measurementEnd = cpuCoresAverage()
  let idleDifference = measurementEnd.idle - measurementStart.idle
  let totalDifference = measurementEnd.total - measurementStart.total
  let percentageCPU = 100 - ~~(100 * idleDifference / totalDifference)
  cpuUsageSecondsList.push(percentageCPU)
  console.log(percentageCPU + "% CPU second")

  let freeRAMInMB = os.freemem() / (1024 * 1024)
  let usedRAMInMb = totalRAMInMB - freeRAMInMB
  percentageRAM = Math.floor((100 * usedRAMInMb) / totalRAMInMB)
  ramUsageSecondsList.push(percentageRAM)
  console.log(percentageRAM + "% RAM second")

  if (seconds == numberOfAvarageSeconds) {
    wrtieDataToFiles(cpuUsageSecondsList, ramUsageSecondsList, diskUsageSecondsList)
    cpuUsageSecondsList = []
    ramUsageSecondsList = []
    diskUsageSecondsList = []
    seconds = 0
    minutes++
  }

  measurementStart = cpuCoresAverage();
  seconds++
}, 1000)
