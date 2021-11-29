import React, { useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import { Scrollbars } from 'rc-scrollbars'

import { loadNextMessagesLimit } from '../../../../shared/static'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import { MessagesGroupedByDay } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'

const useStyles = makeStyles(theme => ({
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
  messages?: MessagesGroupedByDay
  newMessagesLoading?: boolean
  setNewMessagesLoading?: (arg: boolean) => void
}

// TODO: scrollbar smart pagination
export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  channel,
  messages = [],
  newMessagesLoading,
  setNewMessagesLoading
}) => {
  const classes = useStyles({})

  const [scrollPosition, setScrollPosition] = React.useState(-1)

  const messagesRef = React.useRef<HTMLUListElement>()
  const scrollbarRef = React.useRef<Scrollbars>()

  const onScrollFrame = React.useCallback(
    e => {
      setScrollPosition(e.top)
    },
    [setScrollPosition]
  )

  /* Scroll to the bottom on entering the channel or resizing window */
  useEffect(() => {
    if (scrollbarRef.current && (scrollPosition === -1 || scrollPosition === 1)) {
      setTimeout(() => {
        scrollbarRef.current?.scrollToBottom()
      })
    }
    const eventListener = () => {
      if (scrollbarRef.current) scrollbarRef.current.scrollToBottom()
    }
    window.addEventListener('resize', eventListener)
    return () => window.removeEventListener('resize', eventListener)
  }, [channel, messages, scrollbarRef])

  /* Set new position of a scrollbar handle */
  useEffect(() => {
    if (scrollbarRef.current && newMessagesLoading) {
      const oneMessageHeight = scrollbarRef.current.getScrollHeight() / messages.length
      const newMessagesBlockHeight = oneMessageHeight * loadNextMessagesLimit
      setTimeout(() => {
        scrollbarRef.current.scrollTop(newMessagesBlockHeight)
      })
      setNewMessagesLoading(false)
    }
  }, [newMessagesLoading])

  return (
    <Scrollbars ref={scrollbarRef} autoHideTimeout={500} onScrollFrame={onScrollFrame}>
      <List disablePadding ref={messagesRef} id='messages-scroll' className={classes.list}>
        {messages.map((dayItem) => {
          const messagesArray = dayItem.messages
          const displayTitle = dayItem.day
          return (
            <div key={displayTitle}>
              <MessagesDivider title={displayTitle} />
              {messagesArray.map(message => {
                return <BasicMessageComponent key={message.id} message={message} />
              })}
            </div>
          )
        })}
      </List>
    </Scrollbars>
  )
}

export default ChannelMessagesComponent
