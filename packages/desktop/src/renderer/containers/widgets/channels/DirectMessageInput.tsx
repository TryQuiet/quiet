import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { FileContent, identity, publicChannels } from '@quiet/state-manager'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const useDirectMessageInputActions = () => {
  const dispatch = useDispatch()

  const onChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/TryQuiet/ZbayLite/issues/442
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

  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannelAddress)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)

  const unsupportedFileModal = useModal<{
    unsupportedFiles: FileContent[]
    title: string
    sendOtherContent: string
    textContent: string
    tryZipContent: string
  }>(ModalName.unsupportedFileModal)

  const user = useSelector(identity.selectors.currentIdentity)

  return (
    <ChannelInputComponent
      channelAddress={currentChannelAddress}
      channelName={currentChannelName}
      // TODO https://github.com/TryQuiet/ZbayLite/issues/443
      inputPlaceholder={`#${currentChannelName} as @${user?.nickname}`}
      onChange={value => {
        resetDebounce()
        onChange(value)
      }}
      onKeyPress={message => {
        onEnter(message)
      }}
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      unsupportedFileModal={unsupportedFileModal}
    />
  )
}

export default ChannelInput
