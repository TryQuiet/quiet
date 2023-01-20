import React from 'react'
import { displayMathRegex, splitByTex } from '../../../utils/functions/splitByTex'
import { TextMessageComponent, TextMessageComponentProps } from '../widgets/channels/TextMessage'
import { convertPromise, SourceLang } from './customMathJax'

interface UseMathProps {
  src: string
  display: boolean
  settings?: any
  onMathMessageRendered?: () => void
}

const useMathJax = (props: UseMathProps) => {
  const {src, display, settings, onMathMessageRendered} = props
  const [renderedHTML, setRenderedHTML] = React.useState<string>(null)
  const [node, setNode] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(function () {
    if (!node)
      return function () { };
    
    var converted = convertPromise({ src: src, lang: SourceLang.Tex }, node, display, settings)
    converted.promise.then((result: string) => {
      setRenderedHTML(result)
      // Notify channel to adjust scrollbar position
      onMathMessageRendered()
    }, setError);
    
    return function () {
      setError(null);
      converted.cancel();
    };
  }, [node, src, display, settings]);
  return {
    renderedHTML: renderedHTML,
    error: error,
    getProps: function () {
      return ({
        ref: setNode,
        dangerouslySetInnerHTML: renderedHTML !== null ? { __html: renderedHTML } : undefined,
      });
    },
  };
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
    <>
    {texMessageSplit.map((partialMessage: string, index: number) => {
      if (displayMathRegex.test(partialMessage)) {
        // Pass only part wrapped in $$(...)$$
        const extracted = partialMessage.match(displayMathRegex)[1]
        const getProps = useMathJax({ display, src: extracted.trim(), onMathMessageRendered }).getProps
        const elementProps = Object.assign({key: `${messageId}-${index}`}, getProps())
        let element: React.ReactElement = null
        if (display) {
          element = React.createElement("div", elementProps)
        } else {
          element = React.createElement("span", {style: {margin: '0 5px 0 5px'}, ...elementProps})
        }
        return element
      } else {
        return (
          <TextMessageComponent
            message={partialMessage}
            messageId={`${messageId}-${index}`}
            pending={pending}
            openUrl={openUrl}
            key={`${messageId}-${index}`}
          />
        )
      }
    })}
    </>
  )
}