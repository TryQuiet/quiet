import React from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage, DownloadStatus } from '@quiet/state-manager'
import classNames from 'classnames'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import UploadedImage from '../../Channel/File/UploadedImage/UploadedImage'
import FileComponent, { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'

const useStyles = makeStyles(() => ({
  message: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },
  pending: {
    color: theme.palette.colors.lightGray
  },
  info: {
    color: theme.palette.colors.white
  }
}))

export interface NestedMessageContentProps {
  message: DisplayableMessage
  pending: boolean
  downloadStatus?: DownloadStatus
  uploadedFileModal?: ReturnType<
  UseModalTypeWrapper<{
    src: string
  }>['types']
  >
}

export const NestedMessageContent: React.FC<NestedMessageContentProps & FileActionsProps> = ({
  message,
  pending,
  downloadStatus,
  uploadedFileModal,
  openContainingFolder,
  cancelDownload
}) => {
  const classes = useStyles({})

  const renderMessage = () => {
    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        return (
          <div
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            <UploadedImage message={message} uploadedFileModal={uploadedFileModal} />
          </div>
        )
      case 4: // MessageType.File
        return (
          <div
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            <FileComponent message={message} downloadStatus={downloadStatus} openContainingFolder={openContainingFolder} cancelDownload={cancelDownload} />
          </div>
        )
      default:
        return (
          <Typography
            component={'span'}
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            {message.message}
          </Typography>
        )
    }
  }

  return <Grid item>{renderMessage()}</Grid>
}

export default NestedMessageContent
