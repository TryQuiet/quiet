import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import messagesQueueHandlers from '../../../store/handlers/messagesQueue'
import mentionsHandlers from '../../../store/handlers/mentions'
import channelSelectors from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import { User } from '../../../store/handlers/users'

export const useChannelInputData = () => {
  const channelSelectorsData = useSelector(channelSelectors.data)
  const data = {
    message: useSelector(channelSelectors.message),
    id: useSelector(channelSelectors.id),
    inputState: useSelector(channelSelectors.inputLocked),
    members: useSelector(channelSelectors.members),
    channelName: useSelector(channelSelectors.data)
      ? channelSelectorsData.username
      : ' Unnamed',
    users: useSelector(usersSelectors.users),
    myUser: useSelector(usersSelectors.myUser),
    isMessageTooLong: useSelector(channelSelectors.messageSizeStatus)
  }

  return data
}

export const useChannelInputActions = () => {
  const dispatch = useDispatch()

  const onChange = useCallback((arg: { value: string; id: string }) => {
    dispatch(channelHandlers.actions.setMessage(arg))
  }, [dispatch])

  const resetDebounce = useCallback(() => {
    dispatch(messagesQueueHandlers.epics.resetMessageDebounce())
  }, [dispatch])

  const sendOnEnter = useCallback((e: React.KeyboardEvent<HTMLDivElement>, setTab: (arg: number) => void) => {
    dispatch(channelHandlers.epics.sendOnEnter(e, setTab))
  }, [dispatch])

  const checkMentions = useCallback(() => {
    dispatch(mentionsHandlers.epics.checkMentions())
  }, [dispatch])

  return { onChange, resetDebounce, sendOnEnter, checkMentions }
}

export const ChannelInput = ({ setTab }) => {
  const [infoClass, setInfoClass] = React.useState<string>(null)
  // eslint-disable-next-line
  const [anchorEl, setAnchorEl] = React.useState({} as HTMLElement)
  const [mentionsToSelect, setMentionsToSelect] = React.useState<User[]>([])

  const { channelName, id, inputState, isMessageTooLong, members, message, myUser, users } = useChannelInputData()
  const { checkMentions, onChange, resetDebounce, sendOnEnter } = useChannelInputActions()

  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      id={id}
      users={users}
      onChange={e => {
        onChange({ value: e, id })
        resetDebounce()
      }}
      onKeyPress={(e) => {
        checkMentions()
        sendOnEnter(e, setTab)
      }}
      message={message}
      inputState={inputState}
      inputPlaceholder={`#${channelName} as @${myUser.nickname}`}
      channelName={channelName}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      members={members}
      isMessageTooLong={isMessageTooLong}
    />
  )
}

export default ChannelInput
