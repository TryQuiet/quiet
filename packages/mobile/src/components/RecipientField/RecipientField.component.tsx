import React, { forwardRef } from 'react'
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

import { Typography } from '../Typography/Typography.component'
import { RecipientPill, PILL_ROW_GAP } from '../RecipientPill/RecipientPill.component'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { RecipientFieldProps } from './RecipientField.types'

/**
 * The "To:" field of a new DM: the label, the recipients picked so far as pills, and the query the
 * user is still typing.
 *
 * Laid out after "Search container" (Figma tXuRsUfP6VnSv99dox00C1, 823:15128) — full bleed, 16pt
 * side padding, 12pt top and bottom, a #F0F0F0 rule underneath — with the pills wrapping onto
 * further lines and the caret trailing the last one, as in "State=Selected (2)" (919:48416).
 *
 * This does not reuse Input: that component pins its row to a fixed 54pt height, which cannot grow
 * as pills wrap.
 */
const LABEL = 'To: '

export const RecipientField = forwardRef<TextInput, RecipientFieldProps>(
  ({ recipients, query, placeholder, onChangeQuery, onRemoveRecipient, validation, testID }, ref) => {
    return (
      <View testID={testID}>
        <View style={styles.row}>
          <Typography fontSize={14} style={styles.label}>
            {LABEL}
          </Typography>
          <View style={styles.content}>
            {recipients.map(recipient => (
              <RecipientPill
                key={recipient.userId}
                label={recipient.label}
                userId={recipient.userId}
                photo={recipient.photo}
                profilePhoto={recipient.profilePhoto}
                onRemove={() => onRemoveRecipient(recipient.userId)}
                testID={`new-message-recipient-pill-${recipient.userId}`}
              />
            ))}
            <TextInput
              ref={ref}
              style={styles.input}
              value={query}
              onChangeText={onChangeQuery}
              // The placeholder belongs to the empty field; once there are pills it would sit next
              // to them and read as another recipient.
              placeholder={recipients.length > 0 ? undefined : placeholder}
              placeholderTextColor={defaultPalette.typography.grayDark}
              autoCorrect={false}
              autoCapitalize={'none'}
              keyboardType={'email-address'}
              testID={'input'}
            />
          </View>
          {query ? (
            <TouchableOpacity
              onPress={() => onChangeQuery('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID={'new-message-search-clear'}
            >
              <Typography fontSize={16} style={styles.clear}>
                {'✕'}
              </Typography>
            </TouchableOpacity>
          ) : null}
        </View>
        {validation ? (
          <Typography fontSize={14} color={'error'} style={styles.validation}>
            {validation}
          </Typography>
        ) : null}
        <View style={styles.separator} />
      </View>
    )
  }
)

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  label: {
    color: defaultPalette.typography.gray50,
    lineHeight: 20,
    // Keeps "To:" on the first line when the pills wrap.
    paddingTop: 3,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: PILL_ROW_GAP,
  },
  input: {
    flexGrow: 1,
    minWidth: 96,
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: defaultPalette.typography.gray90,
  },
  clear: {
    color: defaultPalette.typography.gray70,
    paddingTop: 1,
  },
  validation: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: defaultPalette.background.gray06,
  },
})
