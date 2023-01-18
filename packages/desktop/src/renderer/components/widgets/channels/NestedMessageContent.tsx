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
import { displayMathRegex, splitByTex } from '../../../../utils/functions/splitByTex'
import { convertToSvg, convertPromise } from './customMathJax'

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
  onMathMessageRendered?: () => void
}

function asyncUseMathJax(_a) {
  var src = _a.src, lang = _a.lang, display = _a.display, settings = _a.settings;
  const onMathMessageRendered = _a.onMathMessageRendered
  const [renderedHTML, setRenderedHTML] = React.useState(null)
  const [node, setNode] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(function () {
      if (!node)
          return function () { };
      var _a = convertPromise({ src: src, lang: lang }, node, display, settings), promise = _a.promise, cancel = _a.cancel;
      promise.then((result) => {
        console.log('mathjax promise resolved')
        setRenderedHTML(result)
        onMathMessageRendered()
      }, setError);
      return function () {
          setError(null);
          cancel();
      };
  }, [node, src, lang, display, settings]);
  return {
      renderedHTML: renderedHTML,
      error: error,
      getProps: function () { return ({
          ref: setNode,
          dangerouslySetInnerHTML: renderedHTML !== null ? { __html: renderedHTML } : undefined,
      }); },
  };
}

function CustomMathComponent(props) {
  const { display, settings, tex } = props
  const getProps = asyncUseMathJax({ display: display, settings: settings, src: tex.trim(), lang: 'TeX', onMathMessageRendered: props.onMathMessageRendered}).getProps
  return display ? React.createElement("div", getProps()) : React.createElement("span", getProps());
}

const CustomMathComponentAsync: React.FC<TextMessageComponentProps & {onMathMessageRendered: (arg: number) => void}> = ({
  message,
  messageId,
  pending,
  openUrl,
  onMathMessageRendered
}) => {
  let texMessageSplit: string[]
  try {
    texMessageSplit = splitByTex(String.raw`${message}`, displayMathRegex)
  } catch (e) {
    console.error('Error extracting tex from message', e.message)
    return <TextMessageComponent message={message} messageId={messageId} pending={pending} openUrl={openUrl} />
  }

  const texMessage = texMessageSplit.map((partialMessage: string, index: number) => {
    if (displayMathRegex.test(partialMessage)) {
      const extracted = partialMessage.match(displayMathRegex)[1]
      return <CustomMathComponent display={false} tex={String.raw`${extracted}`} key={index} onMathMessageRendered={onMathMessageRendered}/>
    } else {
      return <TextMessageComponent message={partialMessage} messageId={`${messageId}-${index}`} pending={pending} openUrl={openUrl} key={`${messageId}-${index}`}/>
    }
  })

  return <>{texMessage}</>
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

        return <CustomMathComponentAsync message={message.message} messageId={message.id} pending={pending} openUrl={openUrl} onMathMessageRendered={onMathMessageRendered}/>
    }
  }

  return <StyledGrid item>{renderMessage()}</StyledGrid>
}

export default NestedMessageContent
