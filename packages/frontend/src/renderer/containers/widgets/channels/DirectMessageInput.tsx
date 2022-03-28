import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { identity, publicChannels } from '@quiet/nectar'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'

export const useDirectMessageInputActions = () => {
  const dispatch = useDispatch()

  const onChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/ZbayApp/ZbayLite/issues/442
    },
    [dispatch]
  )

  const onEnter = useCallback(
    (message: string) => {
      console.log('send direct message', message)
    },
    [dispatch]
  )

  const resetDebounce = useCallback(() => {}, [dispatch])

  return { onChange, resetDebounce, onEnter }
}

export const ChannelInput = () => {
  const [infoClass, setInfoClass] = React.useState<string>(null)

  const { onChange, onEnter, resetDebounce } = useDirectMessageInputActions()

  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const user = useSelector(identity.selectors.currentIdentity)

  return (
    <ChannelInputComponent
      channelAddress={currentChannel.address}
      channelName={currentChannel.name}
      // TODO https://github.com/ZbayApp/ZbayLite/issues/443
      inputPlaceholder={`#${currentChannel?.name} as @${user?.nickname}`}
      onChange={value => {
        resetDebounce()
        onChange(value)
      }}
      onKeyPress={message => {
        onEnter(message)
      }}
      infoClass={infoClass}
      setInfoClass={setInfoClass}
    />
  )
}

export default ChannelInput
