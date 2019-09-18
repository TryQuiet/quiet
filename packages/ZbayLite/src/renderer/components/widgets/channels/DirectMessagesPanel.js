import React from 'react'

import * as R from 'ramda'

import ItemSizedChannelsList from './ItemSizedChannelsList'

export const DirectMessagesPanel = ({ channels }) => {
  return <ItemSizedChannelsList channels={channels} directMessages itemsCount={4} displayAddress />
}

export default R.compose(React.memo)(DirectMessagesPanel)
