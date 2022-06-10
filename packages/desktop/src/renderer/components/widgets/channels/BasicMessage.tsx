import React from 'react'
import { makeStyles, Theme } from '@material-ui/core/styles'
import classNames from 'classnames'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

import red from '@material-ui/core/colors/red'

import Jdenticon from 'react-jdenticon'

import { DisplayableMessage, MessageSendingStatus, SendingStatus } from '@quiet/state-manager'
import { NestedMessageContent } from './NestedMessageContent'
import { Dictionary } from '@reduxjs/toolkit'

const useStyles = makeStyles((theme: Theme) => ({
  messageCard: {
    padding: '0 4px'
  },
  wrapper: {
    backgroundColor: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.gray03
    }
  },
  clickable: {
    cursor: 'pointer'
  },
  wrapperPending: {
    background: theme.palette.colors.white
  },
  username: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5
  },
  statusIcon: {
    color: theme.palette.colors.lightGray,
    fontSize: 21,
    marginLeft: theme.spacing(1)
  },
  broadcasted: {
    color: theme.palette.colors.lightGray
  },
  failed: {
    color: red[500]
  },
  avatar: {
    minHeight: 36,
    minWidth: 36,
    marginRight: 10,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.grayBackgroud
  },
  alignAvatar: {
    marginTop: 2,
    marginLeft: 2,
    width: 32,
    height: 32
  },
  moderation: {
    cursor: 'pointer',
    marginRight: 10
  },
  time: {
    color: theme.palette.colors.lightGray,
    fontSize: 14,
    marginTop: -4,
    marginRight: 5
  },
  iconBox: {
    marginTop: -4
  },
  pending: {
    color: theme.palette.colors.lightGray
  }
}))

export const getTimeFormat = () => {
  return 't'
}

export const transformToLowercase = (string: string) => {
  const hasPM = string.search('PM')
  return hasPM !== -1 ? string.replace('PM', 'pm') : string.replace('AM', 'am')
}
export interface BasicMessageProps {
  messages: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
}

export const BasicMessageComponent: React.FC<BasicMessageProps> = ({
  messages,
  pendingMessages = {}
}) => {
  const classes = useStyles({})

  const messageDisplayData = messages[0]

  // Grey out sender name if the first message hasn't been sent yet
  const pending: boolean = pendingMessages[messageDisplayData.id] !== undefined

  return (
    <ListItem
      className={classNames({
        [classes.wrapper]: true
      })}
      onMouseOver={() => {}}
      onMouseLeave={() => {}}>
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <Grid
            container
            direction='row'
            justify='flex-start'
            alignItems='flex-start'
            wrap={'nowrap'}>
            <Grid item className={classes.avatar}>
              <div className={classes.alignAvatar}>
                <Jdenticon size='32' value={messageDisplayData.nickname} />
              </div>
            </Grid>
            <Grid container item direction='row'>
              <Grid container item direction='row' justify='space-between'>
                <Grid
                  container
                  item
                  xs
                  alignItems='flex-start'
                  wrap='nowrap'
                >
                  <Grid item>
                    <Typography
                      color='textPrimary'
                      className={classNames({
                        [classes.username]: true,
                        [classes.pending]: pending
                      })}>
                      {messageDisplayData.nickname}
                    </Typography>
                  </Grid>
                  {status !== 'failed' && (
                    <Grid item>
                      <Typography className={classes.time}>{messageDisplayData.date}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <Grid
                container
                direction='column'
                style={{ marginTop: '-3px' }}
                data-testid={`userMessages-${messageDisplayData.nickname}-${messageDisplayData.id}`}>
                {messages.map((message, index) => {
                  const pending = pendingMessages[message.id] !== undefined
                  return (
                    <NestedMessageContent
                      message={message}
                      pending={pending}
                      key={index}
                    />
                  )
                })}
              </Grid>
            </Grid>
          </Grid>
        }
      />
    </ListItem>
  )
}

export default BasicMessageComponent
