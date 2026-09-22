import React from 'react'
import { styled } from '@mui/material/styles'
import type { Dictionary } from '@reduxjs/toolkit'
import classNames from 'classnames'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import red from '@mui/material/colors/red'

import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'

import { DisplayableMessage, DownloadStatus, MessageSendingStatus, MessageType } from '@quiet/types'

import { NestedMessageContent } from './NestedMessageContent'
import { ChannelLinkNavigation } from './TextMessage'

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
  authorLink: `${PREFIX}authorLink`,
  alignAvatar: `${PREFIX}alignAvatar`,
  moderation: `${PREFIX}moderation`,
  time: `${PREFIX}time`,
  iconBox: `${PREFIX}iconBox`,
  pending: `${PREFIX}pending`,
  info: `${PREFIX}info`,
  infoIcon: `${PREFIX}infoIcon`,
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  // 'Message container' (library 4910:23935): avatar 36 r4 at x=16, name 16/26 w500 + time 14/20 #999999 8 apart,
  // text 14/20, hover fill #F7F7F7 (4910:24211). Vertical padding 10/12 -> 8/12 on the grid.
  [`& .${classes.messageCard}`]: {
    padding: 0,
  },

  [`&.${classes.wrapper}`]: {
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.md,
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.colors.gray03,
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
    marginRight: theme.space.sm,
  },

  [`& .${classes.statusIcon}`]: {
    color: theme.palette.colors.lightGray,
    fontSize: 20,
    marginLeft: theme.space.sm,
  },

  [`& .${classes.broadcasted}`]: {
    color: theme.palette.colors.lightGray,
  },

  [`& .${classes.failed}`]: {
    color: red[500],
  },

  // The author is a link to their profile; it only looks like one under the pointer, so an
  // ordinary read of the conversation is undisturbed.
  [`& .${classes.authorLink}`]: {
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  [`& .${classes.avatar}`]: {
    minHeight: 36,
    minWidth: 36,
    marginRight: theme.space.md,
    marginBottom: 0,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
  },

  [`& .${classes.alignAvatar}`]: {
    width: 36,
    height: 36,
  },

  [`& .${classes.moderation}`]: {
    cursor: 'pointer',
    marginRight: theme.space.md,
  },

  [`& .${classes.time}`]: {
    color: theme.palette.colors.gray40,
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
      }}
    />
  )
}

export interface BasicMessageProps {
  messages: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  openUrl: (url: string) => void
  channelLinks?: ChannelLinkNavigation
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes: number
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  onMathMessageRendered?: () => void
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
  /** Opens the author's profile. Absent where a profile cannot be reached, e.g. in tests. */
  openUserProfile?: (userId: string) => void
}

export const BasicMessageComponent: React.FC<BasicMessageProps & FileActionsProps> = ({
  messages,
  pendingMessages = {},
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  uploadedFileModal,
  onMathMessageRendered,
  openUrl,
  channelLinks,
  openContainingFolder,
  downloadFile,
  cancelDownload,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
  openUserProfile,
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
                  // A message is where you most often meet someone, so the photo and the name lead
                  // to their profile. An Info message is from Quiet itself and has nobody behind it.
                  <span
                    className={classNames({ [classes.authorLink]: openUserProfile != null })}
                    onClick={() => openUserProfile?.(messageDisplayData.userId)}
                    data-testid={`messageAuthorPhoto-${messageDisplayData.id}`}
                  >
                    <MessageProfilePhoto message={messageDisplayData} />
                  </span>
                )}
              </div>
            </Grid>
            <Grid container item direction='row'>
              <Grid container item direction='row' justifyContent='space-between' alignItems='center'>
                <Grid container item xs alignItems='center' wrap='nowrap'>
                  <Grid item>
                    <Typography
                      variant='h5'
                      color='textPrimary'
                      className={classNames({
                        [classes.username]: true,
                        [classes.pending]: pending,
                        [classes.authorLink]: !infoMessage && openUserProfile != null,
                      })}
                      onClick={() => !infoMessage && openUserProfile?.(messageDisplayData.userId)}
                      data-testid={`messageAuthorName-${messageDisplayData.id}`}
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
                        variant='body2'
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
                data-testid={`userMessages-${messageDisplayData.nickname}-${messageDisplayData.id}`}
              >
                {messages
                  .filter(message => message.type !== MessageType.Empty)
                  .map((message, index) => {
                    const pending = pendingMessages[message.id] !== undefined
                    const downloadStatus = downloadStatuses[message.id]
                    return (
                      <NestedMessageContent
                        key={index}
                        message={message}
                        pending={pending}
                        downloadStatus={downloadStatus}
                        maxAutodownloadSizeBytes={maxAutodownloadSizeBytes}
                        uploadedFileModal={uploadedFileModal}
                        openUrl={openUrl}
                        channelLinks={channelLinks}
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
