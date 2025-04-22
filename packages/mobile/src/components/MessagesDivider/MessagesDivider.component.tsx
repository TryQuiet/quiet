import React, { FC, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MessagesDividerProps } from './MessagesDivider.types'
import { defaultTheme } from '../../styles/themes/default.theme'
import { DateTime } from 'luxon'

/**
 * Format a timestamp in seconds to a display date string
 * Copied from @quiet/state-manager's formatMessageDisplayDate for consistency
 */
const formatDisplayDate = (timestamp: number): string => {
  // Extract timezone offset from native Date API
  const tzOffsetHours = -new Date().getTimezoneOffset() / 60
  const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

  const LC = process.env.LC_ALL || 'en_US.UTF-8'
  const locale = LC.split('_')[0]
  const messageDate = DateTime.fromSeconds(timestamp).setZone(formattedOffset).setLocale(locale)
  const now = DateTime.now().setZone(formattedOffset).setLocale(locale)
  const diffInDays = now.startOf('day').diff(messageDate.startOf('day'), 'days').days

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays >= 2 && diffInDays <= 4) {
    return messageDate.toFormat('cccc') // Full weekday name
  } else {
    return messageDate.toFormat('LLL d, y')
  }
}

export const MessagesDivider: FC<MessagesDividerProps> = ({ title, timestamp, isSticky }) => {
  // If timestamp is provided, format it using the standard formatter
  const displayText = useMemo(() => {
    if (timestamp !== undefined) {
      return formatDisplayDate(timestamp)
    }
    if (title) {
      return title
    }
    return 'Unknown Date' // Fallback in case neither timestamp nor title is provided
  }, [title, timestamp])

  return (
    <View
      style={[styles.container, isSticky && styles.stickyContainer]}
      testID={isSticky ? `StickyDateMarker_${displayText}` : `DateDivider_${displayText}`}
    >
      <View style={[styles.pillContainer, isSticky && styles.stickyPillContainer]}>
        <Text style={styles.title}>{displayText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stickyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
  },
  pillContainer: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 72,
  },
  stickyPillContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EEEEEE',
  },
  title: {
    color: '#000000',
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    lineHeight: 15,
  },
})
