// @ts-nocheck
import { readdir, readFile } from 'fs/promises'
import fs from 'fs'
import os from 'os'
import path from 'path'

const myArgs = process.argv.slice(2)
const dirPath = myArgs[0]

async function parse() {
    const combinedResults = {}
    try {
        const files = await readdir(dirPath)
        for (const filePath of files) {
            if (!filePath.includes('combined')) {
                const result = await readFile(path.join(dirPath, filePath), { encoding: 'utf8' })
                Object.assign(combinedResults, JSON.parse(result))
            }
        }
    } catch (err) {
        console.error(err)
    }
    fs.writeFileSync(`combined${path.basename(dirPath)}.json`, JSON.stringify(combinedResults))
    return combinedResults
}

const getStatistics = (results: Record<string, unknown>) => {
    const testsCount = Object.keys(results).length
    let failed = 0
    const requestCountSuccessRate = {}
    let fetchTimeSum = 0
    let bootstrapTimeSum = 0
    let receivedResultsTimeSum = 0
    let fastestFetch = 100000
    let slowestFetch = 0
    let slowestSuccessfullReceivedResultsTime = 0
    for (const [_address, data] of Object.entries(results)) {
        // @ts-ignore
        bootstrapTimeSum += data.bootstrapTime
        // @ts-ignore
        receivedResultsTimeSum += data.receivedResultsTime
        // @ts-ignore
        if (data.success === false) {
            failed++
            continue
        }
        // @ts-ignore
        slowestSuccessfullReceivedResultsTime = Math.max(
            slowestSuccessfullReceivedResultsTime,
            data.receivedResultsTime
        )
        // @ts-ignore
        if (data.receivedResultsTime) {
            for (const [requestCount, requestData] of Object.entries(data)) {
                if (requestData.fetchTime) {
                    fetchTimeSum += requestData.fetchTime
                    requestCountSuccessRate[requestCount]
                        ? requestCountSuccessRate[requestCount]++
                        : (requestCountSuccessRate[requestCount] = 1)
                    fastestFetch = Math.min(requestData.fetchTime, fastestFetch)
                    slowestFetch = Math.max(requestData.fetchTime, slowestFetch)
                }
            }
        }
    }
    return {
        dirPath,
        testsCount,
        failedTests: failed,
        averageFetchTime: fetchTimeSum / testsCount,
        averageBootstrapTime: bootstrapTimeSum / testsCount,
        averageReceivedResultsTime: receivedResultsTimeSum / testsCount,
        slowestSuccessfullReceivedResultsTime,
        fastestFetch,
        slowestFetch,
        requestCountSuccessRate,
    }
}

parse().then(
    data => {
        console.log(getStatistics(data))
    },
    error => {
        console.log('ERROR', error)
    }
)
