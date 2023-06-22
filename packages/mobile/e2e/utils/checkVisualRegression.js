import compare from './compare'

const fs = require('fs')

const enableVisualRegression = Boolean(process.argv.filter(x => x.startsWith('-enable-visual-regression'))[0])

const ci = Boolean(process.argv.filter(x => x.startsWith('--ci'))[0])
const environment = ci ? 'ci' : 'local'

const platform = device.getPlatform()

const checkVisualRegression = async componentName => {
  if (!enableVisualRegression) return
  const imagePath = await element(by.id(componentName)).takeScreenshot(`${componentName}`)

  let basePath = `${__dirname}/visual-regressions/${environment}/${platform}/starter-base-screenshots/${componentName}.png`

  if (!fs.existsSync(basePath)) {
    console.error(`SKIP: There's no base screenshot for ${componentName} in current test scenario.`)
    return
  }

  await compare(imagePath, basePath)
}

export default checkVisualRegression
