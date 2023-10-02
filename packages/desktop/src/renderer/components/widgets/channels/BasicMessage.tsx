import React from 'react'
import { styled } from '@mui/material/styles'
import { Dictionary } from '@reduxjs/toolkit'
import classNames from 'classnames'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import red from '@mui/material/colors/red'

import Jdenticon from '../../Jdenticon/Jdenticon'

import { DisplayableMessage, DownloadStatus, MessageSendingStatus } from '@quiet/types'

import { NestedMessageContent } from './NestedMessageContent'

import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'

import information from '../../../static/images/updateIcon.svg'

import Icon from '../../ui/Icon/Icon'
import { UseModalType } from '../../../containers/hooks'
import { HandleOpenModalType, UserLabelType } from '../userLabel/UserLabel.types'
import UserLabel from '../userLabel/UserLabel.component'

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
    backgroundColor: theme.palette.colors.white,
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
    background: theme.palette.colors.white,
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
    backgroundColor: theme.palette.colors.grayBackgroud,
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
  openUrl: (url: string) => void
  downloadStatuses?: Dictionary<DownloadStatus>
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  onMathMessageRendered?: () => void
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
}

export const BasicMessageComponent: React.FC<BasicMessageProps & FileActionsProps> = ({
  messages,
  pendingMessages = {},
  downloadStatuses = {},
  uploadedFileModal,
  onMathMessageRendered,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
}) => {
  const messageDisplayData = messages[0]

  const userLabel = messageDisplayData?.isDuplicated
    ? UserLabelType.DUPLICATE
    : !messageDisplayData?.isRegistered
    ? UserLabelType.UNREGISTERED
    : null

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
        primary={
          <Grid container direction='row' justifyContent='flex-start' alignItems='flex-start' wrap={'nowrap'}>
            <Grid item className={classNames({ [classes.avatar]: true })}>
              <div className={classes.alignAvatar}>
                {infoMessage ? (
                  <Icon src={information} className={classes.infoIcon} />
                ) : (
                  <Jdenticon size='36' value={messageDisplayData.nickname} />
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
                    <Grid>
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
                        {messageDisplayData.date}
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
                    <NestedMessageContent
                      key={index}
                      message={message}
                      pending={pending}
                      downloadStatus={downloadStatus}
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
