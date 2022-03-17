const fs = require('fs')
const path = require('path')

(function () {
  const envs = JSON.stringify({
    APP_MODE: process.env.APP_MODE
  })
  console.log('Saving extra envs for main process:', envs)
  fs.writeFileSync(path.join('mainEnvs.json'), envs)
})
