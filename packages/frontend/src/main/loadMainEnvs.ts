import fs from 'fs'
import path from 'path'
import {exec} from 'child_process'

if (process.env.NODE_ENV !== 'development') {
  exec('ls -al', (a, b, c) => {
    console.log(a, b, c)
  })
  exec('pwd', (a, b, c) => {
    console.log(a, b, c)
  })
  try {
    const envsFile = fs.readFileSync(path.join('mainEnvs.json'), { encoding: 'utf8' })
    const envs = JSON.parse(envsFile)
    console.log('Read extra envs:', envs)
    process.env.TEST_MODE = envs.TEST_MODE
  } catch (e) {
    console.info(e.message)
  }
}
