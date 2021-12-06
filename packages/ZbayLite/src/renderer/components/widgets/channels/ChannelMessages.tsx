import React, { useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import { Scrollbars } from 'rc-scrollbars'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import { DisplayableMessage } from '@zbayapp/nectar'

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
  messages?: { [date: string]: DisplayableMessage[][] }
}

// TODO: scrollbar smart pagination
export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  channel,
  messages = {}
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

  return (
    <Scrollbars ref={scrollbarRef} autoHideTimeout={500} onScrollFrame={onScrollFrame}>
      <List disablePadding ref={messagesRef} id='messages-scroll' className={classes.list}>
        {Object.keys(messages).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages[day].map(items => { // Messages merged by sender (DisplayableMessage[])
                const data = items[0]
                return <BasicMessageComponent key={data.id} messages={items} />
              })}
            </div>
          )
        })}
      </List>
    </Scrollbars>
  )
}

export default ChannelMessagesComponent
