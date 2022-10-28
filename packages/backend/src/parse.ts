import {readdir, readFile} from 'fs/promises'
import fs from 'fs'
import os from 'os'
import path from 'path'

async function parse() {
  const combinedResults = {}
  try {
    const files = await readdir(path.join(__dirname, 'regularResults'));
    console.log('files', files)
    for (const filePath of files) {
      if (filePath.includes('_regular')) {
        const result = await readFile(path.join(__dirname, 'regularResults', filePath), { encoding: 'utf8' })
        Object.assign(combinedResults, JSON.parse(result))
      }
    }
  } catch (err) {
    console.error(err);
  }
  fs.writeFileSync(`combinedRegular.json`, JSON.stringify(combinedResults))
  return combinedResults
}

const getStatistics = (results: {}) => {
  const testsCount = Object.keys(results).length
  let failed = 0
  const requestCountSuccessRate = {
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0
  }
  let fetchTimeSum = 0
  let bootstrapTimeSum = 0
  let receivedResultsTimeSum = 0
  let fastestFetch = 100000
  let slowestFetch = 0
  for (const [address, data] of Object.entries(results)) {
    // @ts-ignore
    bootstrapTimeSum += data.bootstrapTime
    // @ts-ignore
    receivedResultsTimeSum += data.receivedResultsTime
    // @ts-ignore
    if (data.success === false) {
      failed++
      continue
    }
    for (const [requestCount, requestData] of Object.entries(data)) {
      if (requestData.fetchTime) {
        fetchTimeSum += requestData.fetchTime
        requestCountSuccessRate[requestCount]++
        if (requestData.fetchTime < fastestFetch) {
          fastestFetch = requestData.fetchTime
        }
        if (requestData.fetchTime > slowestFetch) {
          slowestFetch = requestData.fetchTime
          console.log('slowest:', slowestFetch, requestCount, address)
        }
      }
    }
  }
  return {
    testsCount,
    failedTests: failed,
    averageFetchTime: fetchTimeSum / testsCount,
    averageBootstrapTime: bootstrapTimeSum / testsCount,
    averageReceivedResultsTime: receivedResultsTimeSum / testsCount,
    fastestFetch,
    slowestFetch,
    requestCountSuccessRate
  }
}

parse().then((data) => {
  console.log(getStatistics(data))
}, (error) => {console.log('ERROR', error)})

