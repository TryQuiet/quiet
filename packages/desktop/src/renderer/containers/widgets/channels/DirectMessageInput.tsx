import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { identity, publicChannels } from '@quiet/state-manager'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'

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
    const [infoClass, setInfoClass] = React.useState<string>('')

    const { onChange, onEnter, resetDebounce } = useDirectMessageInputActions()

    const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
    const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)
    const user = useSelector(identity.selectors.currentIdentity)
    if (!currentChannelId) return null
    return (
        <ChannelInputComponent
            channelId={currentChannelId}
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
            openFilesDialog={() => {}}
            handleOpenFiles={() => {}}
            handleClipboardFiles={() => {}}
        />
    )
}

export default ChannelInput
