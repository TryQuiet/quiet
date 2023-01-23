import { promisify } from 'util'
import { exec } from 'child_process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv)).argv

// const runTest = async () => {
//   const promExec = promisify(exec)
//   let command = 'npm run test:smoke'
//   if (argv.appPath) {
//     command += ` -- --appPath=${argv.appPath as string}`
//   }

//   for (let i = 1; i <= Number(argv.iter); i++) {
//     console.log(`Starting ${i} test`)
//     const output = await promExec(command)

//     console.log(output.stdout.trim())
//     console.log(output.stderr.trim())
//     console.log(`Finished ${i} test`)
//   }
// }

// runTest().then((data) => {
//   console.log('DONE', data)
// }).catch((error) => {
//   console.error('ERROR', error)
// })
