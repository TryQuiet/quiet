import React from 'react'
import { displayMathRegex, splitByTex } from '../../../utils/functions/splitByTex'
import { TextMessageComponent, TextMessageComponentProps } from '../widgets/channels/TextMessage'
import { convertPromise, SourceLang } from './customMathJax'
import { styled } from '@mui/material/styles'
import theme from '../../theme'
import classNames from 'classnames'

const PREFIX = 'MathMessage'

const classes = {
  pending: `${PREFIX}pending`,
  message: `${PREFIX}message`,
  beginning: `${PREFIX}beginning`,
  middle: `${PREFIX}middle`
}

const StyledMath = styled('span')(() => ({
  [`&.${classes.message}`]: {
    marginLeft: '20px'
  },

  [`&.${classes.pending}`]: {
    color: theme.palette.colors.lightGray
  },

  [`&.${classes.middle}`]: {
    margin: '0 5px 0 5px'
  },

  [`&.${classes.beginning}`]: {
    margin: '0 5px 0 0'
  },
}))

interface UseMathProps {
  display: boolean
  settings?: any
  onMathMessageRendered?: () => void
  index: number
}

const MathComponent: React.FC<UseMathProps & TextMessageComponentProps> = ({
  message,
  display,
  onMathMessageRendered,
  messageId,
  pending,
  openUrl,
  index
}) => {
  const [renderedHTML, setRenderedHTML] = React.useState<string | null>(null)
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const isMath = displayMathRegex.test(message)
  React.useEffect(() => {
    if (!node || !isMath) return

    const sanitizedMessage = message.match(displayMathRegex)[1]
    const converted = convertPromise({ src: sanitizedMessage.trim(), lang: SourceLang.Tex }, node, display, {})
    converted.promise.then((result: string) => {
      setRenderedHTML(result)
      // Notify channel to adjust scrollbar position
      onMathMessageRendered()
    }, setError)

    return function () {
      // setError(null)
      converted.cancel()
    }
  }, [node, message, display])

  if (isMath) {
    const props = {
      ref: setNode,
      dangerouslySetInnerHTML: renderedHTML !== null ? { __html: renderedHTML } : undefined,
    }
    if (display) return React.createElement('div', props)
    const className = {
      [classes.message]: true,
      [classes.pending]: pending,
      [classes.beginning]: index === 0,
      [classes.middle]: index !== 0
    }
    return React.createElement(StyledMath, { className: classNames(className), ...props })
  }
  return <TextMessageComponent
    message={message}
    messageId={`${messageId}-${index}`}
    pending={pending}
    openUrl={openUrl}
    key={`${messageId}-${index}`}
  />
}

interface MathMessageProps {
  onMathMessageRendered?: () => void
  display?: boolean
}

export const MathMessageComponent: React.FC<TextMessageComponentProps & MathMessageProps> = ({
  message,
  messageId,
  pending,
  openUrl,
  display = false,
  onMathMessageRendered
}) => {
  // Split message into regular text and math parts
  let texMessageSplit: string[]
  try {
    texMessageSplit = splitByTex(String.raw`${message}`, displayMathRegex)
  } catch (e) {
    console.error('Error extracting tex from message', e.message)
    return <TextMessageComponent message={message} messageId={messageId} pending={pending} openUrl={openUrl} />
  }

  return (
    <>{texMessageSplit.map((partialMessage, index) =>
        <MathComponent
          message={partialMessage}
          display={display}
          onMathMessageRendered={onMathMessageRendered}
          messageId={messageId}
          pending={pending}
          openUrl={openUrl}
          index={index}
          key={`${messageId}-${index}`}
        />
      )}
    </>
  )
}
