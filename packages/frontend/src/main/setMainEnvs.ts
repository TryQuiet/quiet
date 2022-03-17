import fs from 'fs'
import path from 'path'

try {
  const envsFile = fs.readFileSync(path.join('mainEnvs.json'), { encoding: 'utf8' })
  const envs = JSON.parse(envsFile)
  console.log('Read extra envs:', envs)
  process.env.APP_MODE = envs.APP_MODE
} catch (e) {
  console.info(e.message)
}