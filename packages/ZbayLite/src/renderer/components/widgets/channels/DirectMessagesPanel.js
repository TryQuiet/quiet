import React from 'react'

import * as R from 'ramda'

import ItemSizedChannelsList from './ItemSizedChannelsList'

import { withSpinnerLoader } from '../../ui/SpinnerLoader'

export const DirectMessagesPanel = ({ channels }) => {
  return <ItemSizedChannelsList channels={channels} directMessages itemsCount={4} displayAddress />
}

export default R.compose(withSpinnerLoader)(DirectMessagesPanel)
