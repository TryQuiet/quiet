import fs, { statSync } from 'fs'
import { readdir } from 'fs/promises'
import path from 'path'
import childProcess from 'child_process'
import compare from './utils/compare'

jest.setTimeout(9000000)

/* eslint-disable no-undef */
describe('Storybook', () => {
  const shouldGenerateBase = Boolean(process.argv.find(x => x.startsWith('-generate-base')))

  let stories = []

  const findStories = async (dirname, files) => {
    const items = await readdir(dirname)

    files = files || []

    for (const item of items) {
      if (statSync(`${dirname}/${item}`).isDirectory()) {
        files = await findStories(`${dirname}/${item}` + '/', files)
      } else {
        if (item.endsWith('.stories.tsx')) {
          const scenarios = await listScenarios(dirname, item)
          const component = item.split('.')[0]
          files.push([dirname, item, component, scenarios])
        }
      }
    }

    return files
  }

  const trimStories = () => {
    const start = process.argv.filter(x => x.startsWith('-starting-story'))[0].split('=')[1]

    let index

    for (const story of stories) {
      if (story.includes(start)) {
        index = stories.indexOf(story)
      }
    }

    stories = stories.slice(index, stories.length)
  }

  const listScenarios = async (dirname, item) => {
    const data = fs.readFileSync(`${dirname}${item}`, 'utf8')

    const regexp = /\.add\(\'([^)]+)\', \(\)/g

    const scenarios = []

    let matches = []
    while ((matches = regexp.exec(data)) != null) {
      scenarios.push(matches[1])
    }

    return scenarios
  }

  const checkVisualRegression = async (id, component, scenario) => {
    const imagePath = await element(by.id(id)).takeScreenshot(`${component}_${scenario}`)
    if (!shouldGenerateBase) {
      compare(
        imagePath,
        `${__dirname}/storybook-base-screenshots/${device.name}/${component}_${scenario}.png`
      )
    }
  }

  beforeAll(async () => {
    const dirname = path.resolve('src/components/')
    stories = await findStories(dirname, [])

    // Start at particular story
    if (process.argv.find(x => x.startsWith('-starting-story'))) trimStories()

    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })

    await element(by.id('BottomMenu.Sidebar')).longPress()
  })

  afterAll(async () => {
    if (shouldGenerateBase) {
      childProcess.exec(`sh e2e/update-base.sh ${device.name}`, (err, stdout) => {
        if (err) {
          console.log(err)
        }
        console.log(stdout)
      })
    }
  })

  test('visual regressions', async () => {
    for (const story of stories) {
      const component = story[2]
      const scenarios = story[3]

      console.log(`Performing visual regression test for ${component}`)

      await waitFor(element(by.id('Storybook.ListView.SearchBar')))
        .toBeVisible()
        .withTimeout(5000)

      // Use Storybook's search section
      await element(by.id('Storybook.ListView.SearchBar')).longPress()
      await element(by.id('Storybook.ListView.SearchBar')).clearText()
      await element(by.id('Storybook.ListView.SearchBar')).typeText(component)

      // Hide keyboard
      await device.pressBack()

      for (const scenario of scenarios) {
        console.log(`----checking ${scenario}`)

        await element(by.text(scenario)).atIndex(0).longPress()
        await element(by.text(scenario)).atIndex(0).longPress() // Idle (important though)

        await element(by.id('BottomMenu.Canvas')).longPress()

        const id = `${component.toLowerCase()}--${scenario.toLowerCase()}`
        await checkVisualRegression(id, component, scenario)

        await element(by.id('BottomMenu.Sidebar')).longPress()
      }
    }
  })
})
