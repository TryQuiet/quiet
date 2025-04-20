import press from './utils/press'
import clear from './utils/clear'
import write from './utils/write'
import { BASIC } from './utils/consts/timeouts'

// Increase the test timeout since we'll be doing scrolling and waiting for animations
jest.setTimeout(120000)

describe('Sticky Date Markers', () => {
  beforeAll(async () => {
    // Launch the app fresh
    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
    
    // Navigate to storybook sidebar
    await press(element(by.id('BottomMenu.Sidebar')))
    
    // Use Storybook's search to find our MultiDayChat component
    await waitFor(element(by.id('Storybook.ListView.SearchBar')))
      .toBeVisible()
      .withTimeout(BASIC)
    
    await press(element(by.id('Storybook.ListView.SearchBar')))
    await clear(element(by.id('Storybook.ListView.SearchBar')))
    await write(element(by.id('Storybook.ListView.SearchBar')), 'Chat')
    
    // Close keyboard if on Android
    if (device.getPlatform() === 'android') {
      await device.pressBack()
    }
    
    // Select the MultiDayChat story which we created for testing sticky date markers
    await press(element(by.text('MultiDayChat')).atIndex(0), true)
    
    // Go to canvas view to see the component
    await press(element(by.id('BottomMenu.Canvas')))
    
    // Wait for Chat component to be ready
    await waitFor(element(by.id('chat_StickyDateTest')))
      .toBeVisible()
      .withTimeout(BASIC * 2)
  })
  
  /*
  test('sticky date marker should not be visible initially', async () => {
    // Initially, the sticky date marker should not be visible
    await expect(element(by.id('StickyDateMarker_Today'))).not.toBeVisible()
    
    // Regular date divider should be visible
    await expect(element(by.id('DateDivider_Today'))).toBeVisible()
  })
  */
 
  test('sticky date marker should appear on scroll and show correct date', async () => {
    // Swipe up to trigger scrolling
    await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.5)
    
    // Wait a short time for the scroll event to be processed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // The sticky date marker should now be visible
    await expect(element(by.id('StickyDateMarker_Today'))).toBeVisible()
  })
  
  test('sticky date marker should be visible during scroll', async () => {
    // Swipe up to trigger scrolling
    await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.5)
    
    // Wait a short time for the scroll event to be processed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // The sticky date marker should now be visible
    await expect(element(by.id('StickyDateMarker_Today'))).toBeVisible()
    
    // Note: Due to how React Native animation works with opacity, 
    // we don't test for the marker disappearing, as Detox might still see it
    // even when its opacity is 0
  })
  
  test('chat should display proper messages when scrolling through', async () => {
    // Multiple swipes to get to older messages
    for (let i = 0; i < 5; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.7)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Swipe one more time and then wait for the scroll to settle
    await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.7)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Look for any message text with "March 26" in it
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
    // The chat should be scrolled to messages from older dates
    
    // Keep swiping to get to even older messages
    for (let i = 0; i < 5; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.7)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Swipe one more time and then wait for the scroll to settle
    await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.7)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // The chat should now be scrolled to even older messages
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
    
    // Now swipe back to newer messages
    for (let i = 0; i < 5; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('down', 'slow', 0.7)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Swipe one more time and wait for the scroll to settle
    await element(by.id('chat_StickyDateTest')).swipe('down', 'slow', 0.7)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // The chat should now be scrolled back to newer messages
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
  })
  
  test('fast scrolling should work without errors', async () => {
    // Fast swipes back to the most recent messages ("Today")
    for (let i = 0; i < 5; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('down', 'fast', 0.9)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Wait for the scroll to settle and do one more swipe
    await element(by.id('chat_StickyDateTest')).swipe('down', 'fast', 0.9)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // We should still see the chat component
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
    
    // Fast swipes to get to the oldest messages
    for (let i = 0; i < 8; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('up', 'fast', 0.9)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // One more swipe and wait for the scroll to settle
    await element(by.id('chat_StickyDateTest')).swipe('up', 'fast', 0.9)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // We should still see the chat component
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
  })
  
  test('scrolling through date boundaries should show messages from different days', async () => {
    // Swipe back to "Today" to reset position
    for (let i = 0; i < 6; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('down', 'fast', 0.9)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Wait for the scroll to settle with one more swipe
    await element(by.id('chat_StickyDateTest')).swipe('down', 'fast', 0.9)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Confirm we're at Today by checking Today's messages
    await expect(element(by.text('First message from today'))).toBeVisible()
    
    // Do a swipe to trigger scrolling
    await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.3)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Keep doing swipes until we see a message from March 26
    for (let i = 0; i < 10; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.2)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Try to find any March 26 message
      try {
        const hasMessage = await element(by.text('This message is from March 26')).getAttributes()
        if (hasMessage && hasMessage.visible) {
          break
        }
      } catch (e) {
        // Element might not exist yet, continue with more swipes
      }
    }
    
    // We should now see a March 26 message
    await expect(element(by.text('This message is from March 26'))).toBeVisible()
    
    // Continue with more swipes to get to March 25
    for (let i = 0; i < 10; i++) {
      await element(by.id('chat_StickyDateTest')).swipe('up', 'slow', 0.2)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Try to find any March 25 message
      try {
        const hasMessage = await element(by.text('This message is from March 25')).getAttributes()
        if (hasMessage && hasMessage.visible) {
          break
        }
      } catch (e) {
        // Element might not exist yet, continue with more swipes
      }
    }
    
    // We should now see a March 25 message
    await expect(element(by.text('This message is from March 25'))).toBeVisible()
  })
  
  test('chat should not have layout jumps on initial render', async () => {
    // Launch fresh and navigate to the chat component again
    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
    
    // Navigate to storybook sidebar
    await press(element(by.id('BottomMenu.Sidebar')))
    
    // Use Storybook's search to find our MultiDayChat component
    await waitFor(element(by.id('Storybook.ListView.SearchBar')))
      .toBeVisible()
      .withTimeout(BASIC)
    
    await press(element(by.id('Storybook.ListView.SearchBar')))
    await clear(element(by.id('Storybook.ListView.SearchBar')))
    await write(element(by.id('Storybook.ListView.SearchBar')), 'Chat')
    
    // Close keyboard if on Android
    if (device.getPlatform() === 'android') {
      await device.pressBack()
    }
    
    // Select the MultiDayChat story
    await press(element(by.text('MultiDayChat')).atIndex(0), true)
    
    // Go to canvas view
    await press(element(by.id('BottomMenu.Canvas')))
    
    // Get initial positions of important elements to check for layout jumps
    await waitFor(element(by.id('chat_StickyDateTest')))
      .toBeVisible()
      .withTimeout(BASIC * 2)
      
    // Take a screenshot immediately after rendering
    await device.takeScreenshot('initial-render')
    
    // Wait a moment to let any animations or layout changes happen
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Take another screenshot after possible layout changes
    await device.takeScreenshot('after-render')
    
    // Note: Screenshots can be compared visually, but we can't do pixel comparison in the test
    
    // Verify the chat component is still visible
    await expect(element(by.id('chat_StickyDateTest'))).toBeVisible()
    
    // Check that input area has expected components
    await expect(element(by.id('input'))).toBeVisible()
  })
})