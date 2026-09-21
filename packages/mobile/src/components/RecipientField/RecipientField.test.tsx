import React from 'react'
import { fireEvent, screen } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { RecipientField } from './RecipientField.component'
import { Recipient } from './RecipientField.types'

/**
 * The designs show every chosen recipient as a pill carrying a thumbnail and a way to take it back
 * out; before this the mobile field showed the selection only as ticks further down the list.
 */
const RECIPIENTS: Recipient[] = [
  { userId: 'deniseUserId', label: 'denise' },
  { userId: 'gordonUserId', label: 'gordon' },
]

describe('RecipientField', () => {
  it('renders a pill per recipient and reports the one the user removes', () => {
    const onRemoveRecipient = jest.fn()
    renderComponent(
      <RecipientField
        recipients={RECIPIENTS}
        query={''}
        placeholder={'Search for people, chats or channels'}
        onChangeQuery={jest.fn()}
        onRemoveRecipient={onRemoveRecipient}
      />
    )

    expect(screen.getByTestId('new-message-recipient-pill-deniseUserId')).toBeTruthy()
    expect(screen.getByTestId('new-message-recipient-pill-gordonUserId')).toBeTruthy()

    fireEvent.press(screen.getByTestId('new-message-recipient-pill-gordonUserId'))
    expect(onRemoveRecipient).toHaveBeenCalledWith('gordonUserId')
  })

  it('shows the placeholder only while no recipient has been chosen', () => {
    const { rerender } = renderComponent(
      <RecipientField
        recipients={[]}
        query={''}
        placeholder={'Search for people, chats or channels'}
        onChangeQuery={jest.fn()}
        onRemoveRecipient={jest.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Search for people, chats or channels')).toBeTruthy()

    rerender(
      <RecipientField
        recipients={RECIPIENTS}
        query={''}
        placeholder={'Search for people, chats or channels'}
        onChangeQuery={jest.fn()}
        onRemoveRecipient={jest.fn()}
      />
    )
    expect(screen.queryByPlaceholderText('Search for people, chats or channels')).toBeNull()
  })

  it('offers a clear control only once there is a query to clear', () => {
    const onChangeQuery = jest.fn()
    const { rerender } = renderComponent(
      <RecipientField
        recipients={[]}
        query={''}
        placeholder={'Search'}
        onChangeQuery={onChangeQuery}
        onRemoveRecipient={jest.fn()}
      />
    )
    expect(screen.queryByTestId('new-message-search-clear')).toBeNull()

    rerender(
      <RecipientField
        recipients={[]}
        query={'den'}
        placeholder={'Search'}
        onChangeQuery={onChangeQuery}
        onRemoveRecipient={jest.fn()}
      />
    )
    fireEvent.press(screen.getByTestId('new-message-search-clear'))
    expect(onChangeQuery).toHaveBeenCalledWith('')
  })
})
