import React, { useEffect, useLayoutEffect } from 'react'
import { usePrevious } from '../../hooks'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import { MessagesDailyGroups } from '@quiet/nectar'

const useStyles = makeStyles(theme => ({
  scroll: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%'
  },
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: '0 4px',
    width: '100%'
  },
  link: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer'
  },
  info: {
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px'
  },
  root: {
    width: '100%',
    padding: '8px 16px'
  },
  item: {
    backgroundColor: theme.palette.colors.gray03,
    padding: '9px 16px'
  },
  bold: {
    fontWeight: 'bold'
  }
}))

export interface IChannelMessagesProps {
  username: string
  channel: string
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  setChannelLoadingSlice?: (value: number) => void
}

// TODO: scrollbar smart pagination
export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  username,
  channel,
  messages = {
    count: 0,
    groups: {}
  },
  setChannelLoadingSlice = _value => {}
}) => {
  const classes = useStyles({})

  const chunkSize = 50 // Should come from the configuration

  const [scrollPosition, setScrollPosition] = React.useState(1)
  const [scrollHeight, setScrollHeight] = React.useState(0)

  const [messagesSlice, setMessagesSlice] = React.useState(0)

  const scrollbarRef = React.useRef<HTMLDivElement>()
  const messagesRef = React.useRef<HTMLUListElement>()

  const previousSlice: number = usePrevious(messagesSlice)
  const previousMessages: number = usePrevious(messages.count)

  const scrollBottom = () => {
    if (!scrollbarRef.current) return
    scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight
  }

  const isLastMessageOwner = () => {
    if (!messages?.groups) return
    const groupsArray = Array.from(Object.values(messages.groups))
    if (!groupsArray.length) return 
    const usersArray = groupsArray[groupsArray.length - 1]
    const chunksArray = usersArray[usersArray.length - 1]
    const lastMessage = chunksArray[chunksArray.length - 1]
    return lastMessage.nickname === username
  }

  /* Get scroll position and save it to the state as 0 (top), 1 (bottom) or -1 (middle) */
  const onScroll = React.useCallback(() => {
    const top = scrollbarRef.current?.scrollTop === 0

    const bottom =
      scrollbarRef.current?.scrollHeight - scrollbarRef.current?.scrollTop ===
      scrollbarRef.current?.clientHeight

    let position = -1
    if (top) position = 0
    if (bottom) position = 1

    setScrollPosition(position)
  }, [setScrollPosition])

  /* Keep scroll position when new chunk of messages are being loaded */
  useEffect(() => {
    if (scrollbarRef.current && scrollPosition === 0) {
      setTimeout(() => {
        scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - scrollHeight
      })
    }
  }, [messages.count])

  /* Lazy loading messages - top (load) */
  useEffect(() => {
    console.log(messages.groups)
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 0) {
      // Cache scroll height before loading new messages (to keep the scroll position after re-rendering)
      setScrollHeight(scrollbarRef.current.scrollHeight)
      // Load next chunk of messages
      const trim = Math.max(0, messagesSlice - chunkSize)
      setMessagesSlice(trim)
      setChannelLoadingSlice(trim)
    }
    if (
      isLastMessageOwner() &&
      scrollbarRef.current &&
      scrollPosition === 0 &&
      previousMessages &&
      messages.count > previousMessages + previousSlice &&
      messagesSlice === 0
    ) {
      setTimeout(() => {
        scrollBottom()
      })
    }
  }, [setChannelLoadingSlice, scrollPosition, messages.count])

  /* Lazy loading messages - bottom (trim) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 1) {
      const totalMessagesAmount = messages.count + messagesSlice
      const bottomMessagesSlice = Math.max(0, totalMessagesAmount - chunkSize)
      setMessagesSlice(bottomMessagesSlice)
      setChannelLoadingSlice(bottomMessagesSlice)
    }
  }, [setChannelLoadingSlice, scrollPosition, messages.count])

  /* Scroll to the bottom on entering the channel or resizing window */
  useLayoutEffect(() => {
    if (scrollbarRef.current && scrollPosition === 1) {
      setTimeout(() => {
        scrollBottom()
      })
    }
    const eventListener = () => {
      scrollBottom()
    }
    window.addEventListener('resize', eventListener)
    return () => window.removeEventListener('resize', eventListener)
  }, [channel, messages, scrollbarRef])

  return (
    <div
      className={classes.scroll}
      ref={scrollbarRef}
      onScroll={onScroll}
      data-testid='channelContent'>
      <List disablePadding className={classes.list} ref={messagesRef} id='messages-scroll'>
        {Object.keys(messages.groups).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages.groups[day].map(items => {
                // Messages merged by sender (DisplayableMessage[])
                const data = items[0]
                return <BasicMessageComponent key={data.id} messages={items} />
              })}
            </div>
          )
        })}
      </List>
    </div>
  )
}

export default ChannelMessagesComponent
