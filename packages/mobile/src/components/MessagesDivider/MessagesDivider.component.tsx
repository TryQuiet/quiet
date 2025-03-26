import React, { FC } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MessagesDividerProps } from './MessagesDivider.types'
import { defaultTheme } from '../../styles/themes/default.theme'

export const MessagesDivider: FC<MessagesDividerProps> = ({ title, isSticky }) => {
  return (
    <View style={[styles.container, isSticky && styles.stickyContainer]}>
      <View style={[styles.pillContainer, isSticky && styles.stickyPillContainer]}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  title: {
    color: '#000000',
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '400',
    lineHeight: 15,
  },
})
