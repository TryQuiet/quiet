import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import type { Dictionary } from '@reduxjs/toolkit'
import classNames from 'classnames'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import red from '@mui/material/colors/red'

import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'

import type { DisplayableMessage, DownloadStatus, MessageSendingStatus } from '@quiet/types'

import { NestedMessageContent } from './NestedMessageContent'
import MessageReactionBar from './MessageReactionBar'

import type { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'

import information from '../../../static/images/updateIcon.svg'

import Icon from '../../ui/Icon/Icon'
import type { UseModalType } from '../../../containers/hooks'
import { type HandleOpenModalType, UserLabelType } from '../userLabel/UserLabel.types'
import UserLabel from '../userLabel/UserLabel.component'
import { DateTime } from 'luxon'

const PREFIX = 'BasicMessageComponent'

const classes = {
  messageCard: `${PREFIX}messageCard`,
  wrapper: `${PREFIX}wrapper`,
  infoWrapper: `${PREFIX}infoWrapper`,
  clickable: `${PREFIX}clickable`,
  wrapperPending: `${PREFIX}wrapperPending`,
  username: `${PREFIX}username`,
  statusIcon: `${PREFIX}statusIcon`,
  broadcasted: `${PREFIX}broadcasted`,
  failed: `${PREFIX}failed`,
  avatar: `${PREFIX}avatar`,
  alignAvatar: `${PREFIX}alignAvatar`,
  moderation: `${PREFIX}moderation`,
  time: `${PREFIX}time`,
  iconBox: `${PREFIX}iconBox`,
  pending: `${PREFIX}pending`,
  info: `${PREFIX}info`,
  infoIcon: `${PREFIX}infoIcon`,
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  [`& .${classes.messageCard}`]: {
    padding: '0 4px',
  },

  [`&.${classes.wrapper}`]: {
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },

  [`& .${classes.infoWrapper}`]: {
    backgroundColor: `${theme.palette.colors.blue} !important`,
  },

  [`& .${classes.clickable}`]: {
    cursor: 'pointer',
  },

  [`& .${classes.wrapperPending}`]: {
    background: theme.palette.background.default,
  },

  [`& .${classes.username}`]: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5,
  },

  [`& .${classes.statusIcon}`]: {
    color: theme.palette.colors.lightGray,
    fontSize: 21,
    marginLeft: theme.spacing(1),
  },

  [`& .${classes.broadcasted}`]: {
    color: theme.palette.colors.lightGray,
  },

  [`& .${classes.failed}`]: {
    color: red[500],
  },

  [`& .${classes.avatar}`]: {
    minHeight: 40,
    minWidth: 40,
    marginRight: 10,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
  },

  [`& .${classes.alignAvatar}`]: {
    marginTop: 2,
    marginLeft: 2,
    width: 38,
    height: 38,
  },

  [`& .${classes.moderation}`]: {
    cursor: 'pointer',
    marginRight: 10,
  },

  [`& .${classes.time}`]: {
    color: theme.palette.colors.lightGray,
    fontSize: 14,
    marginTop: -2,
  },

  [`& .${classes.iconBox}`]: {
    marginTop: -4,
  },

  [`& .${classes.pending}`]: {
    color: theme.palette.colors.lightGray,
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.white,
  },

  [`& .${classes.infoIcon}`]: {
    width: 38,
  },
}))

const formatMessageTime = (timestamp: number | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const MessageProfilePhoto: React.FC<{ message: DisplayableMessage }> = ({ message }) => {
  return (
    <ProfilePhoto
      userProfile={message}
      userId={message.userId}
      size={36}
      style={{
        borderRadius: '4px',
        marginRight: '8px',
      }}
    />
  )
}

export interface BasicMessageProps {
  messages: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  openUrl: (url: string) => void
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes: number
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  onMathMessageRendered?: () => void
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
}

interface MessageWithReactionsProps extends FileActionsProps {
  message: DisplayableMessage
  pending: boolean
  downloadStatus?: DownloadStatus
  maxAutodownloadSizeBytes: number
  uploadedFileModal?: UseModalType<{ src: string }>
  onMathMessageRendered?: () => void
  openUrl: (url: string) => void
}

const MessageWithReactions: React.FC<MessageWithReactionsProps> = ({ message, pending, downloadStatus, ...rest }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseOver={e => {
        e.stopPropagation()
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <NestedMessageContent message={message} pending={pending} downloadStatus={downloadStatus} {...rest} />
      <MessageReactionBar messageId={message.id} hovered={hovered} />
    </div>
  )
}

export const BasicMessageComponent: React.FC<BasicMessageProps & FileActionsProps> = ({
  messages,
  pendingMessages = {},
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  uploadedFileModal,
  onMathMessageRendered,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
}) => {
  const messageDisplayData: DisplayableMessage = messages[0]

  let userLabel = null
  if (messageDisplayData?.isDuplicated) {
    userLabel = UserLabelType.DUPLICATE
  } else if (!messageDisplayData?.isRegistered) {
    userLabel = UserLabelType.UNREGISTERED
  }

  const infoMessage = messageDisplayData.type === 3 // 3 stands for MessageType.Info

  // Grey out sender name if the first message hasn't been sent yet
  const pending: boolean = pendingMessages[messageDisplayData.id] !== undefined

  return (
    <StyledListItem
      className={classNames({
        [classes.wrapper]: !infoMessage,
      })}
      onMouseOver={() => {}}
      onMouseLeave={() => {}}
    >
      <ListItemText
        disableTypography
        className={classes.messageCard}
        data-testid={`userMessagesWrapper-${messageDisplayData.nickname}-${messageDisplayData.id}`}
        primary={
          <Grid container direction='row' justifyContent='flex-start' alignItems='flex-start' wrap={'nowrap'}>
            <Grid item className={classNames({ [classes.avatar]: true })}>
              <div className={classes.alignAvatar}>
                {infoMessage ? (
                  <Icon src={information} className={classes.infoIcon} />
                ) : (
                  <MessageProfilePhoto message={messageDisplayData} />
                )}
              </div>
            </Grid>
            <Grid container item direction='row'>
              <Grid container item direction='row' justifyContent='space-between' alignItems='center'>
                <Grid container item xs alignItems='center' wrap='nowrap'>
                  <Grid item>
                    <Typography
                      color='textPrimary'
                      className={classNames({
                        [classes.username]: true,
                        [classes.pending]: pending,
                      })}
                    >
                      {infoMessage ? 'Quiet' : messageDisplayData.nickname}
                    </Typography>
                  </Grid>
                  {userLabel && !infoMessage && (
                    <Grid data-testid={`userLabel-${messageDisplayData.nickname}-${messageDisplayData.id}`}>
                      <UserLabel
                        username={messageDisplayData.nickname}
                        type={userLabel}
                        unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
                        duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
                      />
                    </Grid>
                  )}
                  {status !== 'failed' && (
                    <Grid item>
                      <Typography
                        className={classNames({
                          [classes.time]: true,
                        })}
                      >
                        {DateTime.fromSeconds(messageDisplayData.createdAt).toLocaleString(DateTime.TIME_SIMPLE)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <Grid
                container
                direction='column'
                style={{ marginTop: '-3px' }}
                data-testid={`userMessages-${messageDisplayData.nickname}-${messageDisplayData.id}`}
              >
                {messages.map((message, index) => {
                  const pending = pendingMessages[message.id] !== undefined
                  const downloadStatus = downloadStatuses[message.id]
                  return (
                    <MessageWithReactions
                      key={index}
                      message={message}
                      pending={pending}
                      downloadStatus={downloadStatus}
                      maxAutodownloadSizeBytes={maxAutodownloadSizeBytes}
                      uploadedFileModal={uploadedFileModal}
                      openUrl={openUrl}
                      openContainingFolder={openContainingFolder}
                      downloadFile={downloadFile}
                      cancelDownload={cancelDownload}
                      onMathMessageRendered={onMathMessageRendered}
                    />
                  )
                })}
              </Grid>
            </Grid>
          </Grid>
        }
      />
    </StyledListItem>
  )
}

export default BasicMessageComponent
