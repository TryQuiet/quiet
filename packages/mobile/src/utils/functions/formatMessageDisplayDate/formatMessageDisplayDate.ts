import { DateTime, Settings, Info } from 'luxon'
import { Platform, NativeModules } from 'react-native'

// Initialize Luxon to always use the local timezone
// This ensures we don't default to UTC
Settings.defaultZone = 'system'

// Debug function to log locale information
export const getLocaleDebugInfo = (): string => {
  // Get device locale from React Native
  const deviceLocale =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier

  // Get native Date information
  const now = new Date()
  const localTimeStr = now.toLocaleString()
  const localISOStr = now.toISOString()
  const tzOffset = -now.getTimezoneOffset() / 60 // Convert minutes to hours

  // Get Intl.DateTimeFormat info for timezone detection
  let detectedTimeZone: string
  try {
    // This works in many environments but not all
    detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
  } catch (e) {
    detectedTimeZone = 'Not available'
  }

  // Test timestamp formatting with both APIs
  const testDate = new Date(2024, 0, 15, 13, 30, 0) // Jan 15, 2024, 1:30 PM

  // Test different formatting options with native API
  const formats = {
    toLocaleString: testDate.toLocaleString(),
    toLocaleDateString: testDate.toLocaleDateString(),
    toLocaleTimeString: testDate.toLocaleTimeString(),
    custom1: testDate.toLocaleString([], { hour: 'numeric', minute: '2-digit' }),
    custom2: testDate.toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  }

  // Test message formatting function
  const nowTimestamp = Math.floor(now.getTime() / 1000)
  const yesterdayTimestamp = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime() / 1000)
  const twoDaysAgoTimestamp = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).getTime() / 1000
  )

  return `
DEVICE INFORMATION
-----------------
Device Locale: ${deviceLocale}
Detected TimeZone: ${detectedTimeZone}
System Time: ${localTimeStr}
ISO Time: ${localISOStr}
TZ Offset: ${tzOffset > 0 ? '+' : ''}${tzOffset}h (${-now.getTimezoneOffset()} minutes)
Date.getHours(): ${now.getHours()}
Date.getUTCHours(): ${now.getUTCHours()}

FORMATTING TESTS
-----------------
Test date (Jan 15, 2024, 1:30 PM local time):
- toLocaleString(): ${formats.toLocaleString}
- toLocaleDateString(): ${formats.toLocaleDateString}
- toLocaleTimeString(): ${formats.toLocaleTimeString}
- Custom time only: ${formats.custom1}
- Custom date+time: ${formats.custom2}

MESSAGE FORMATTING RESULTS
-----------------
Now: ${formatMessageDisplayDate(nowTimestamp)}
Yesterday: ${formatMessageDisplayDate(yesterdayTimestamp)}
Two days ago: ${formatMessageDisplayDate(twoDaysAgoTimestamp)}
  `.trim()
}

export const formatMessageDisplayDate = (createdAt: number): string => {
  // Convert timestamp to Date object and use native formatting
  // This bypasses Luxon's timezone issues and uses the device's native date handling
  const messageDate = new Date(createdAt * 1000)
  const now = new Date()

  // Same year
  if (messageDate.getFullYear() === now.getFullYear()) {
    // Check if message was sent yesterday (within 24h window)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = messageDate.getDate() === yesterday.getDate() && messageDate.getMonth() === yesterday.getMonth()

    if (isYesterday) {
      return 'Yesterday'
    }

    // Check if message was sent today
    const isToday = messageDate.getDate() === now.getDate() && messageDate.getMonth() === now.getMonth()

    if (isToday) {
      // Format time only, using device locale (e.g. "10:30 AM")
      return messageDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }

  // For dates older than yesterday, show date and time
  return messageDate.toLocaleString([], {
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
