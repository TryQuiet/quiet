import React, { ReactNode } from 'react'
import theme from '../../../theme'
import classNames from 'classnames'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { AUTODOWNLOAD_SIZE_LIMIT, DisplayableMessage, DownloadStatus } from '@quiet/state-manager'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import UploadedImage from '../../Channel/File/UploadedImage/UploadedImage'
import FileComponent, { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import Linkify from 'react-linkify'

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
  },
  link: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}))

export interface NestedMessageContentProps {
  message: DisplayableMessage
  pending: boolean
  downloadStatus?: DownloadStatus
  openUrl: (url: string) => void
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
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload
}) => {
  const classes = useStyles({})

  const componentDecorator = (decoratedHref: string, decoratedText: string, key: number): ReactNode => {
    return (
      <a onClick={() => { openUrl(decoratedHref) }} className={classNames({ [classes.link]: true })} key={key}>
        {decoratedText}
      </a>
    )
  }

  const renderMessage = () => {
    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        const size = message?.media?.size
        const fileDisplay = !size || size < AUTODOWNLOAD_SIZE_LIMIT
        return (
          <div
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            {fileDisplay ? (
              <UploadedImage message={message} uploadedFileModal={uploadedFileModal} />
            ) : (
              <FileComponent message={message} downloadStatus={downloadStatus} openContainingFolder={openContainingFolder} downloadFile={downloadFile} cancelDownload={cancelDownload} />
            )}
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
            <FileComponent message={message} downloadStatus={downloadStatus} openContainingFolder={openContainingFolder} downloadFile={downloadFile} cancelDownload={cancelDownload} />
          </div>
        )
      default:
        return (
          <Typography
            component={'span' as any}  // FIXME
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            <Linkify componentDecorator={componentDecorator}>{message.message}</Linkify>
          </Typography>
        )
    }
  }

  return <Grid item>{renderMessage()}</Grid>
}

export default NestedMessageContent
