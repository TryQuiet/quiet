import fs, { statSync } from 'fs'
import { readdir } from 'fs/promises'
import path from 'path'

import press from './utils/press'
import clear from './utils/clear'
import write from './utils/write'
import info from './utils/info'
import checkVisualRegression from './utils/checkVisualRegression'
import baseScreenshotsUpdate from './utils/baseScreenshotsUpdate'

const { ios } = info

jest.setTimeout(9000000)

/* eslint-disable no-undef */
describe('Storybook', () => {
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

  beforeAll(async () => {
    const dirname = path.resolve('src/components/')
    stories = await findStories(dirname, [])

    // Start at particular story
    if (process.argv.find(x => x.startsWith('-starting-story'))) trimStories()

    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })

    await press(element(by.id('BottomMenu.Sidebar')))
  })

  afterAll(async () => {
    // Base screenshots will only be updated, if run with -base-update flag
    await baseScreenshotsUpdate()
  })

  test('visual regressions', async () => {
    for (const story of stories) {
      const component = story[2]
      const scenarios = story[3]

      console.log(
        `Performing visual regression test for ${component} (${stories.indexOf(story) + 1}/${stories.length})`
      )

      await waitFor(element(by.id('Storybook.ListView.SearchBar')))
        .toBeVisible()
        .withTimeout(5000)

      // Use Storybook's search section
      await press(element(by.id('Storybook.ListView.SearchBar')))
      await clear(element(by.id('Storybook.ListView.SearchBar')))
      await write(element(by.id('Storybook.ListView.SearchBar')), component)

      // Hide keyboard
      if (!ios) await device.pressBack()

      for (const scenario of scenarios) {
        console.log(`----checking ${scenario}`)

        await press(element(by.text(scenario)).atIndex(0), true)

        await press(element(by.id('BottomMenu.Canvas')))

        const componentID = `${component.toLowerCase()}--${scenario.toLowerCase()}`
        const componentName = `${component}${scenario}`

        await checkVisualRegression(componentID, componentName)

        await press(element(by.id('BottomMenu.Sidebar')))
      }
    }
  })
})
