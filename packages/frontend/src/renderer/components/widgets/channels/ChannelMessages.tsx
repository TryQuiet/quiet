import React from 'react'

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
  messages?: MessagesDailyGroups
  scrollbarRef,
  onScroll: () => void
}

export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  messages = {},
  scrollbarRef,
  onScroll
}) => {
  const classes = useStyles({})
  return (
    <div
      className={classes.scroll}
      ref={scrollbarRef}
      onScroll={onScroll}
      data-testid='channelContent'>
      <List disablePadding className={classes.list} id='messages-scroll'>
        {Object.keys(messages).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages[day].map(items => {
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
