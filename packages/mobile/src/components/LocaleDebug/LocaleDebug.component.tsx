import React from 'react'
import { Text, ScrollView, StyleSheet } from 'react-native'
import { DateTime, Settings } from 'luxon'
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'
import { Platform, NativeModules } from 'react-native'

export const LocaleDebug = () => {
  // Get current timestamp in seconds (message createdAt format)
  const createdAtTimestamp = Math.floor(Date.now() / 1000)

  const date = new Date(createdAtTimestamp * 1000)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const testTime = `${hours}:${minutes}`

  // Extract timezone offset from native Date API
  const tzOffsetHours = -new Date().getTimezoneOffset() / 60
  const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

  // Apply offset to timestamp for correct local time
  const correctLocalTime = DateTime.fromSeconds(createdAtTimestamp)
    .setZone(formattedOffset)
    .toLocaleString(DateTime.TIME_SIMPLE)

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Luxon Time With Native Offset: {correctLocalTime} Native Time: {testTime}{' '}
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeEntry: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  timeLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  timeValue: {
    fontSize: 16,
    marginTop: 4,
    color: '#000',
  },
})
