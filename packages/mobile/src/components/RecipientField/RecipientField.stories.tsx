import React, { useState } from 'react'
import { View } from 'react-native'
import { storiesOf } from '@storybook/react-native'

import { RecipientField } from './RecipientField.component'
import { Recipient } from './RecipientField.types'

/**
 * The "To:" field of a new DM, from the DM designs ("Search container" 823:15128 and
 * "Search states" 919:48410 in Figma tXuRsUfP6VnSv99dox00C1).
 *
 * Tap a pill to remove that recipient — the pill darkens from #F7F7F7 to #F0F0F0 while held, which
 * is the design's hover state.
 */
const PLACEHOLDER = 'Search for people, chats or channels'

const ALL: Recipient[] = [
  { userId: 'deniseUserId', label: 'denise' },
  { userId: 'gordonUserId', label: 'gordon' },
  { userId: 'annabelleUserId', label: 'annabelle' },
  { userId: 'christopherUserId', label: 'christopher' },
  { userId: 'evangelinaUserId', label: 'evangelina' },
]

const Harness: React.FC<{ initial: Recipient[]; initialQuery?: string }> = ({ initial, initialQuery }) => {
  const [recipients, setRecipients] = useState<Recipient[]>(initial)
  const [query, setQuery] = useState<string | undefined>(initialQuery)
  return (
    <View style={{ backgroundColor: '#ffffff', paddingTop: 24 }}>
      <RecipientField
        recipients={recipients}
        query={query}
        placeholder={PLACEHOLDER}
        onChangeQuery={setQuery}
        onRemoveRecipient={userId => setRecipients(current => current.filter(r => r.userId !== userId))}
      />
    </View>
  )
}

storiesOf('RecipientField', module)
  .add('Empty', () => <Harness initial={[]} />)
  .add('Query typed', () => <Harness initial={[]} initialQuery={'den'} />)
  .add('One recipient', () => <Harness initial={ALL.slice(0, 1)} />)
  .add('One recipient and a query', () => <Harness initial={ALL.slice(0, 1)} initialQuery={'gor'} />)
  .add('Recipients wrap', () => <Harness initial={ALL} />)
  .add('Long nickname', () => (
    <Harness initial={[{ userId: 'longUserId', label: 'bartholomew-of-the-very-long-nickname' }]} />
  ))
