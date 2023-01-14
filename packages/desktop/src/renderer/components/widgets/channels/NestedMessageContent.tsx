import React, { ReactNode } from 'react'
import { styled } from '@mui/material/styles'
import theme from '../../../theme'
import classNames from 'classnames'
import { Grid, Typography } from '@mui/material'
import { AUTODOWNLOAD_SIZE_LIMIT, DisplayableMessage, DownloadState, DownloadStatus } from '@quiet/state-manager'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import UploadedImage from '../../Channel/File/UploadedImage/UploadedImage'
import FileComponent, { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import Linkify from 'react-linkify'
import { MathComponent } from 'mathjax-react'
import { displayMathRegex, splitByTex } from '../../../../utils/functions/splitByTex'

const PREFIX = 'NestedMessageContent'

const classes = {
  message: `${PREFIX}message`,
  pending: `${PREFIX}pending`,
  info: `${PREFIX}info`,
  link: `${PREFIX}link`
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
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}))

interface TextMessageComponentProps {
  message: string
  messageId: string
  pending: boolean
  openUrl: (url: string) => void
}

const TextMessageComponent: React.FC<TextMessageComponentProps> = ({
  message,
  messageId,
  pending,
  openUrl
}) => {
  const componentDecorator = (decoratedHref: string, decoratedText: string, key: number): ReactNode => {
    return (
      <a onClick={() => { openUrl(decoratedHref) }} className={classNames({ [classes.link]: true })} key={key}>
        {decoratedText}
      </a>
    )
  }

  return (
    <Typography
      component={'span' as any} // FIXME
      className={classNames({
        [classes.message]: true,
        [classes.pending]: pending
      })}
      data-testid={`messagesGroupContent-${messageId}`}>
      <Linkify componentDecorator={componentDecorator}>{message}</Linkify>
    </Typography>
  )
}

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
        if (!displayMathRegex.test(message.message)) { // Regular text message
          return <TextMessageComponent message={message.message} messageId={message.id} pending={pending} openUrl={openUrl} />
        }

        let texMessage: string[]
        try {
          texMessage = splitByTex(String.raw`${message.message}`, displayMathRegex)
        } catch (e) {
          return <TextMessageComponent message={message.message} messageId={message.id} pending={pending} openUrl={openUrl} />
        }

        return (
          texMessage.map((partialMessage: string, index: number) => {
            if (displayMathRegex.test(partialMessage)) {
              const extracted = partialMessage.match(displayMathRegex)[1]
              return <MathComponent tex={String.raw`${extracted}`} key={index} />
            } else {
              return <TextMessageComponent message={partialMessage} messageId={`${message.id}-${index}`} pending={pending} openUrl={openUrl} />
            }
          })
        )
    }
  }

  return <StyledGrid item>{renderMessage()}</StyledGrid>
}

export default NestedMessageContent
