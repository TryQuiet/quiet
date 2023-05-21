import React from 'react'
import { styled } from '@mui/material/styles'
import theme from '../../../theme'
import classNames from 'classnames'
import { Grid } from '@mui/material'
import { AUTODOWNLOAD_SIZE_LIMIT, DisplayableMessage, DownloadState, DownloadStatus } from '@quiet/state-manager'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import UploadedImage from '../../Channel/File/UploadedImage/UploadedImage'
import FileComponent, { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import { displayMathRegex } from '../../../../utils/functions/splitByTex'
import { TextMessageComponent } from './TextMessage'
import { MathMessageComponent } from '../../MathMessage/MathMessageComponent'

const PREFIX = 'NestedMessageContent'

const classes = {
  message: `${PREFIX}message`,
  pending: `${PREFIX}pending`,
  info: `${PREFIX}info`
}

const StyledGrid = styled(Grid)(() => ({
  [`& .${classes.message}`]: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },

  [`& .${classes.pending}`]: {
    color: theme.palette.colors.lightGray
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.white
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
  onMathMessageRendered?: () => void
}

export const NestedMessageContent: React.FC<NestedMessageContentProps & FileActionsProps> = ({
  message,
  pending,
  downloadStatus,
  uploadedFileModal,
  onMathMessageRendered,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload
}) => {
  const renderMessage = () => {
    const isMalicious = downloadStatus?.downloadState === DownloadState?.Malicious

    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        const size = message?.media?.size
        const fileDisplay = !isMalicious && (!size || size < AUTODOWNLOAD_SIZE_LIMIT)
        return (
          <div
            className={classNames({
              [classes.message]: true,
              [classes.pending]: pending
            })}
            data-testid={`messagesGroupContent-${message.id}`}>
            {fileDisplay && message.media ? (
              <UploadedImage media={message.media} uploadedFileModal={uploadedFileModal} downloadStatus={downloadStatus} />
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
        if (!displayMathRegex.test(message.message)) { // Regular text message
          return <TextMessageComponent message={message.message} messageId={message.id} pending={pending} openUrl={openUrl} />
        }

        return (
          <MathMessageComponent
            message={message.message}
            messageId={message.id}
            pending={pending}
            openUrl={openUrl}
            onMathMessageRendered={onMathMessageRendered}
          />
        )
    }
  }

  return <StyledGrid item>{renderMessage()}</StyledGrid>
}

export default NestedMessageContent
