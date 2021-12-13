import React, { useEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import { DisplayableMessage } from '@zbayapp/nectar'

const useStyles = makeStyles(theme => ({
  scroll: {
    overflow: 'scroll',
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
  channel: string
  messages?: {
    count: number
    groups: { [date: string]: DisplayableMessage[][] }
  }
  setChannelLoadingSlice?: (value: number) => void
}

// TODO: scrollbar smart pagination
export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  channel,
  messages = {
    count: 0,
    groups: {}
  },
  setChannelLoadingSlice = _value => {}
}) => {
  const classes = useStyles({})

  const chunkSize = 50 // Should come from the configuration

  const [scrollPosition, setScrollPosition] = React.useState(-1)
  const [scrollHeight, setScrollHeight] = React.useState(0)

  const [messagesSlice, setMessagesSlice] = React.useState(0)

  const scrollbarRef = React.useRef<HTMLDivElement>()
  const messagesRef = React.useRef<HTMLUListElement>()

  const scrollBottom = () => {
    if (!scrollbarRef.current) return
    scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight
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
      scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - scrollHeight
    }
  }, [messages.count])

  /* Lazy loading messages - top (load) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 0) {
      // Cache scroll height before loading new messages (to keep the scroll position after re-rendering)
      setScrollHeight(scrollbarRef.current.scrollHeight)
      // Load next chunk of messages
      const trim = Math.max(0, messagesSlice - chunkSize)
      setMessagesSlice(trim)
      setChannelLoadingSlice(trim)
    }
  }, [setChannelLoadingSlice, scrollPosition])

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
  useEffect(() => {
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
    <div className={classes.scroll} ref={scrollbarRef} onScroll={onScroll}>
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
