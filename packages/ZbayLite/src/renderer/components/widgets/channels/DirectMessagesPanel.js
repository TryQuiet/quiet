import React from 'react'

import * as R from 'ramda'

import ItemSizedChannelsList from './ItemSizedChannelsList'

export const DirectMessagesPanel = ({ channels, selected }) => {
  return (
    <ItemSizedChannelsList
      channels={channels}
      directMessages
      itemsCount={4}
      displayAddress
      selected={selected}
    />
  )
}

export default R.compose(React.memo)(DirectMessagesPanel)
