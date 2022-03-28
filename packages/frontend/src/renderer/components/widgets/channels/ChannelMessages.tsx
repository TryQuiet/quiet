import React, { useEffect, useLayoutEffect } from 'react'
import { usePrevious } from '../../hooks'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import { useResizeDetector } from 'react-resize-detector'

import { MessagesDailyGroups, PublicChannel } from '@quiet/nectar'

import debounce from 'lodash.debounce'

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
  channel: PublicChannel
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  setChannelMessagesSliceValue?: (value: number) => void
  cacheChannelScrollPosition?: (value: number) => void
}

export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  username,
  channel,
  messages = {
    count: 0,
    groups: {}
  },
  setChannelMessagesSliceValue = _value => {},
  cacheChannelScrollPosition = _value => {}
}) => {
  const classes = useStyles({})

  const chunkSize = 50 // Should come from the configuration

  const [scrollPosition, setScrollPosition] = React.useState(1)
  const [scrollHeight, setScrollHeight] = React.useState(0)

  const [messagesSlice, setMessagesSlice] = React.useState(0)

  const messagesRef = React.useRef<HTMLUListElement>()

  const previousSlice: number = usePrevious(messagesSlice)
  const previousMessages: number = usePrevious(messages.count)

  const onResize = React.useCallback(() => {
    scrollBottom()
  }, [])

  const { ref: scrollbarRef } = useResizeDetector({ onResize })

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

  const debounceCacheScrollPosition = debounce((value: number) => {
    cacheChannelScrollPosition(value)
  }, 100)

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

    //
    debounceCacheScrollPosition(scrollbarRef.current?.scrollTop)
  }, [channel?.address])

  /* Restore cached scroll position after switching back to channel */
  useLayoutEffect(() => {
    if (channel?.scrollPosition === 0) {
      // Stick to bottom when entering channel for the first time
      scrollBottom()
    } else {
      scrollbarRef.current.scrollTop = channel?.scrollPosition
    }
  }, [channel?.address])

  /* Keep scroll at the bottom in certain cases */
  useLayoutEffect(() => {
    /* Keep scroll at the bottom when new message arrives */
    if (scrollbarRef.current && scrollPosition === 1) {
      scrollBottom()
    }
    /* Scroll to the bottom when scroll is in the middle and user sends message */
    if (scrollbarRef.current && scrollPosition === -1 && isLastMessageOwner()) {
      scrollBottom()
    }
  }, [channel?.address, messages.count])

  /* Keep proper scroll position when new messages arrives */
  useEffect(() => {
    /* Keep scroll position when new chunk of messages is being loaded */
    if (scrollbarRef.current && scrollPosition === 0) {
      scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - scrollHeight
    }
    /* If scroll is at the top and user sends message, scroll to the bottom */
    if (
      isLastMessageOwner() &&
      scrollbarRef.current &&
      scrollPosition === 0 &&
      previousMessages &&
      messages.count > previousMessages + previousSlice &&
      messagesSlice === 0
    ) {
      scrollBottom()
    }
  }, [messages.count])

  /* Lazy loading messages - top (load) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 0) {
      /* Cache scroll height before loading new messages (to keep the scroll position after re-rendering) */
      setScrollHeight(scrollbarRef.current.scrollHeight)
      const trim = Math.max(0, messagesSlice - chunkSize)
      setMessagesSlice(trim)
      setChannelMessagesSliceValue(trim)
    }
  }, [setChannelMessagesSliceValue, scrollPosition])

  /* Lazy loading messages - bottom (trim) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 1) {
      const totalMessagesAmount = messages.count + messagesSlice
      const bottomMessagesSlice = Math.max(0, totalMessagesAmount - chunkSize)
      setMessagesSlice(bottomMessagesSlice)
      setChannelMessagesSliceValue(bottomMessagesSlice)
    }
  }, [setChannelMessagesSliceValue, scrollPosition, messages.count])

  /* Reset loading slice on channel change */
  useEffect(() => {
    setMessagesSlice(0)
  }, [channel?.address])

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
