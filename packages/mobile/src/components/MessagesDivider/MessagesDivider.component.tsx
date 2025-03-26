import React, { FC } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MessagesDividerProps } from './MessagesDivider.types'
import { defaultTheme } from '../../styles/themes/default.theme'

export const MessagesDivider: FC<MessagesDividerProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: defaultTheme.palette.input.border,
  },
  titleContainer: {
    paddingHorizontal: 12,
  },
  title: {
    color: defaultTheme.palette.typography.grayDark,
    fontSize: 14,
  },
})
