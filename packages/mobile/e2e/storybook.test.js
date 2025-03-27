import fs, { statSync } from 'fs'
import { readdir } from 'fs/promises'
import path from 'path'

import press from './utils/press'
import clear from './utils/clear'
import write from './utils/write'
import info from './utils/info'
import checkVisualRegression from './utils/checkVisualRegression'
import baseScreenshotsUpdate from './utils/baseScreenshotsUpdate'

import { BASIC } from './utils/consts/timeouts'

const { ios } = info

jest.setTimeout(9000000)

const blacklist = [
  'ConnectionProcess',
  'UploadingPreview'
]

let storybookAppAlreadyLaunched = false

export function launchStorybookApp() {
  return device.launchApp({ newInstance: !storybookAppAlreadyLaunched, launchArgs: { detoxDebugVisibility: 'YES' } })
}

export async function navigateToStorybookSidebar() {
  await press(element(by.id('BottomMenu.Sidebar')))
}

export async function searchForComponent(component) {
  await waitFor(element(by.id('Storybook.ListView.SearchBar')))
    .toBeVisible()
    .withTimeout(BASIC)

  // Use Storybook's search section
  await press(element(by.id('Storybook.ListView.SearchBar')))
  await clear(element(by.id('Storybook.ListView.SearchBar')))
  await write(element(by.id('Storybook.ListView.SearchBar')), component)

  // Hide keyboard if on Android
  if (device.getPlatform() === 'android') {
    await device.pressBack()
  }
}

export async function selectScenario(scenario) {
  await press(element(by.text(scenario)).atIndex(0), true)
}

export async function goToCanvasView() {
  await press(element(by.id('BottomMenu.Canvas')))
}

export async function goToSidebarView() {
  await press(element(by.id('BottomMenu.Sidebar')))
}

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
          if (!blacklist.includes(component)) {
            files.push([dirname, item, component, scenarios])
          }
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

    await launchStorybookApp()
    storybookAppAlreadyLaunched = true

    await navigateToStorybookSidebar()
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

      await searchForComponent(component)

      for (const scenario of scenarios) {
        console.log(`----checking ${scenario}`)

        await selectScenario(scenario)

        await goToCanvasView()

        const componentID = `${component.toLowerCase()}--${scenario.toLowerCase()}`
        const componentName = `${component}${scenario}`

        await checkVisualRegression(componentID, componentName)

        await goToSidebarView()
      }
    }
  })

  describe('Sticky Date Markers Tests', () => {
    beforeAll(async () => {
      // Navigate to the MultiDayChat scenario in the Chat component
      await searchForComponent('Chat')
      await selectScenario('MultiDayChat')
      await goToCanvasView()
    })

    test('sticky date marker should not be visible initially', async () => {
      // Wait for Chat component to be ready
      await waitFor(element(by.id('chat_StickyDateTest')))
        .toBeVisible()
        .withTimeout(BASIC)
      
      // Initially, the sticky date marker should not be visible
      await expect(element(by.text('Today')).atIndex(1)).not.toBeVisible()
    })
    
    test('sticky date marker should appear on scroll and show correct date', async () => {
      // Get the chat message list element
      const chatList = element(by.id('chat_StickyDateTest'))
      
      // Scroll down to see older messages - this should trigger the sticky date marker
      await chatList.scroll(100, 'down', NaN, 0.5)
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // The sticky date marker should now be visible with the current viewable date
      await expect(element(by.text('Today')).atIndex(0)).toBeVisible()
    })
    
    test('sticky date marker should disappear after scroll stops', async () => {
      // Get the chat message list element
      const chatList = element(by.id('chat_StickyDateTest'))
      
      // Scroll down to see older messages - this should trigger the sticky date marker
      await chatList.scroll(100, 'down', NaN, 0.5)
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // The sticky date marker should now be visible
      await expect(element(by.text('Today')).atIndex(0)).toBeVisible()
      
      // Now wait for the fade-out timer to complete (should be around 2000ms + animation time)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // The sticky date marker should now be hidden
      await expect(element(by.text('Today')).atIndex(1)).not.toBeVisible()
    })
    
    test('sticky date marker should update correctly when scrolling between dates', async () => {
      // Get the chat message list element
      const chatList = element(by.id('chat_StickyDateTest'))
      
      // Scroll down a lot to see the oldest messages (from March 25)
      await chatList.scroll(500, 'down', NaN, 0.8)
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // The sticky date marker should show the oldest date (March 25)
      await expect(element(by.text('25 Mar'))).toBeVisible()
      
      // Now scroll up to see messages from March 26
      await chatList.scroll(300, 'up', NaN, 0.8)
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // The sticky date marker should now show March 26
      await expect(element(by.text('26 Mar'))).toBeVisible()
    })
    
    test('sticky date marker should show correct date after fast scrolling', async () => {
      // Get the chat message list element
      const chatList = element(by.id('chat_StickyDateTest'))
      
      // Fast scroll to the bottom to see Today's messages
      await chatList.scrollTo('top', 30, 'down')  // Fast scroll with high speed
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // The sticky date marker should show "Today"
      await expect(element(by.text('Today'))).toBeVisible()
      
      // Now fast scroll to the top to see the oldest messages
      await chatList.scrollTo('bottom', 30, 'up')  // Fast scroll with high speed
      
      // Wait a short time for the scroll event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // The sticky date marker should show the oldest date (March 25)
      await expect(element(by.text('25 Mar'))).toBeVisible()
    })
    
    test('sticky date marker should change date exactly at the boundary between days', async () => {
      // Get the chat message list element
      const chatList = element(by.id('chat_StickyDateTest'))
      
      // First scroll to the bottom so we start from "Today"
      await chatList.scrollTo('top')
      
      // Wait a bit for the scroll to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Slowly scroll down until we reach the boundary between Today and March 26
      // We'll do this in small increments to catch the exact moment the date changes
      for (let i = 0; i < 10; i++) {
        await chatList.scroll(40, 'down', NaN, 0.5)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Check that we've scrolled to March 26
      await expect(element(by.text('26 Mar'))).toBeVisible()
      
      // Continue scrolling to reach the boundary between March 26 and March 25
      for (let i = 0; i < 10; i++) {
        await chatList.scroll(40, 'down', NaN, 0.5)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Check that we've scrolled to March 25
      await expect(element(by.text('25 Mar'))).toBeVisible()
    })
  })
})
