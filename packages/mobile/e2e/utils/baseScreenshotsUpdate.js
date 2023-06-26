import childProcess from 'child_process'
import info from './info'

const { environment, os, test, baseUpdate } = info

const baseScreenshotsUpdate = async () => {
  await new Promise((resolve, reject) => {
    if (!baseUpdate) {
      reject('Not updating base screenshots.')
      return
    }
    childProcess.exec(`sh ./e2e/scripts/base-screenshots-update.sh ${environment} ${os} ${test}`, (err, stdout) => {
      if (err) {
        console.error(err)
        reject(`Error while updating base screenshots. ${err}`)
        return
      }
      console.log(stdout)
      resolve('Successfuly updated base screenshots.')
      return
    })
  })
}

export default baseScreenshotsUpdate
