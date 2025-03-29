import React from 'react'
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native'
import { getLocaleDebugInfo } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate'
import { DateTime } from 'luxon'

export const LocaleDebug = () => {
  const localeInfo = getLocaleDebugInfo()

  // Generate and ensure each date has local timezone set
  const now = DateTime.now().setZone('local')
  const yesterday = now.minus({ days: 1 })
  const twoDaysAgo = now.minus({ days: 2 })
  const lastMonth = now.minus({ months: 1 })
  const lastYear = now.minus({ years: 1 })

  // Generate test timestamps for fixed dates
  const testTimestamp1 = 1704067200 // Jan 1, 2024, 00:00:00 UTC
  const testTimestamp2 = 1703970000 // Dec 31, 2023, 12:00:00 UTC

  // Create datetime objects explicitly with local timezone
  const testDate1 = DateTime.fromSeconds(testTimestamp1).setZone('local')
  const testDate2 = DateTime.fromSeconds(testTimestamp2).setZone('local')

  // Native Date object comparison
  const nativeDate = new Date()
  const nativeDateString = nativeDate.toLocaleString()
  const nativeDateISO = nativeDate.toISOString()

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Locale Debugging Information</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <Text style={styles.info}>{localeInfo}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Native JS Date Info</Text>
        <Text>Time: {nativeDateString}</Text>
        <Text>ISO: {nativeDateISO}</Text>
        <Text>Offset: {new Date().getTimezoneOffset() / -60}h</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Luxon Date Samples</Text>

        <View style={styles.dateExample}>
          <Text style={styles.dateLabel}>Now with .setZone('local'):</Text>
          <Text>{now.toLocaleString(DateTime.DATETIME_FULL)}</Text>
          <Text>{now.toLocaleString(DateTime.TIME_SIMPLE)}</Text>
          <Text style={styles.debug}>
            Zone: {now.zoneName}, Offset: {now.offset / 60}h
          </Text>
        </View>

        <View style={styles.dateExample}>
          <Text style={styles.dateLabel}>Yesterday:</Text>
          <Text>{yesterday.toLocaleString(DateTime.DATETIME_FULL)}</Text>
          <Text style={styles.debug}>Zone: {yesterday.zoneName}</Text>
        </View>

        <View style={styles.dateExample}>
          <Text style={styles.dateLabel}>Two Days Ago:</Text>
          <Text>{twoDaysAgo.toLocaleString(DateTime.DATETIME_FULL)}</Text>
          <Text>
            {twoDaysAgo.toLocaleString({
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fixed Timestamp Tests</Text>

        <View style={styles.dateExample}>
          <Text style={styles.dateLabel}>Jan 1, 2024 00:00 UTC (timestamp: {testTimestamp1}):</Text>
          <Text>{testDate1.toLocaleString(DateTime.DATETIME_FULL)}</Text>
          <Text style={styles.debug}>
            Zone: {testDate1.zoneName}, Offset: {testDate1.offset / 60}h
          </Text>
        </View>

        <View style={styles.dateExample}>
          <Text style={styles.dateLabel}>Dec 31, 2023 12:00 UTC (timestamp: {testTimestamp2}):</Text>
          <Text>{testDate2.toLocaleString(DateTime.DATETIME_FULL)}</Text>
          <Text style={styles.debug}>
            Zone: {testDate2.zoneName}, Offset: {testDate2.offset / 60}h
          </Text>
        </View>
      </View>
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
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    fontFamily: 'monospace',
  },
  dateExample: {
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debug: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
})
