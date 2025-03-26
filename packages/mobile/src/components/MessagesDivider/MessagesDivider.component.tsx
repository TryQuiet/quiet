import React, { FC } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MessagesDividerProps } from './MessagesDivider.types'
import { defaultTheme } from '../../styles/themes/default.theme'

export const MessagesDivider: FC<MessagesDividerProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.pillContainer}>
        <Text style={styles.title}>{title}</Text>
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
  pillContainer: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 72,
  },
  title: {
    color: '#000000',
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    lineHeight: 15,
  },
})
