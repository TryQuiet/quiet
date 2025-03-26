import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Grid, useTheme } from '@mui/material'
import { AUTODOWNLOAD_SIZE_LIMIT, DownloadState, DownloadStatus } from '@quiet/state-manager'

import UploadedImage from '../../Channel/File/UploadedImage/UploadedImage'
import FileComponent, { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import { displayMathRegex } from '../../../../utils/functions/splitByTex'
import { TextMessageComponent } from './TextMessage'
import { MathMessageComponent } from '../../MathMessage/MathMessageComponent'
import { UseModalType } from '../../../containers/hooks'
import { DisplayableMessage } from '@quiet/types'

const PREFIX = 'NestedMessageContent'

const classes = {
  message: `${PREFIX}message`,
  pending: `${PREFIX}pending`,
  noninitial: `${PREFIX}noninitial`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.message}`]: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere',
  },

  [`& .${classes.pending}`]: {
    color: theme.palette.colors.lightGray,
  },

  [`& .${classes.noninitial}`]: {
    marginTop: '7px',
  },
}))

export interface NestedMessageContentProps {
  index: number
  message: DisplayableMessage
  pending: boolean
  downloadStatus?: DownloadStatus
  openUrl: (url: string) => void
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  onMathMessageRendered?: () => void
}

export const NestedMessageContent: React.FC<NestedMessageContentProps & FileActionsProps> = ({
  index,
  message,
  pending,
  downloadStatus,
  uploadedFileModal,
  onMathMessageRendered,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload,
}) => {
  const theme = useTheme()

  const renderMessage = () => {
    const isMalicious = downloadStatus?.downloadState === DownloadState.Malicious

    switch (message.type) {
      case 2: // MessageType.Image (cypress tests incompatibility with enums)
        const size = message?.media?.size
        const fileDisplay = !isMalicious && (!size || size < AUTODOWNLOAD_SIZE_LIMIT)
        return fileDisplay && message.media ? (
          <UploadedImage media={message.media} uploadedFileModal={uploadedFileModal} downloadStatus={downloadStatus} />
        ) : (
          <FileComponent
            message={message}
            downloadStatus={downloadStatus}
            openContainingFolder={openContainingFolder}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
          />
        )
      case 4: // MessageType.File
        return (
          <FileComponent
            message={message}
            downloadStatus={downloadStatus}
            openContainingFolder={openContainingFolder}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
          />
        )
      default:
        if (!displayMathRegex.test(message.message)) {
          // Regular text message
          return (
            <TextMessageComponent
              message={message.message}
              messageId={message.id}
              pending={pending}
              openUrl={openUrl}
            />
          )
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

  return (
    <StyledGrid item>
      <div
        className={classNames({
          [classes.message]: true,
          [classes.pending]: pending,
          [classes.noninitial]: index !== 0,
        })}
        data-testid={`messagesGroupContent-${message.id}`}
      >
        {renderMessage()}
      </div>
    </StyledGrid>
  )
}

export default NestedMessageContent
