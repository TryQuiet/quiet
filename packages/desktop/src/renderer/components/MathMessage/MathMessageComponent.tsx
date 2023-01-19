import React from 'react'
import { displayMathRegex, splitByTex } from '../../../utils/functions/splitByTex'
import { TextMessageComponent, TextMessageComponentProps } from '../widgets/channels/TextMessage'
import { convertPromise } from './customMathJax';

interface UseMath {
  src: string
  lang: string
  display: boolean
  settings?: any
  onMathMessageRendered?: () => void
}

const useMathJax = (props: UseMath) => {
  const {src, lang, display, settings, onMathMessageRendered} = props
  const [renderedHTML, setRenderedHTML] = React.useState<string>(null)
  const [node, setNode] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(function () {
    console.log('node, src, lang, display, settings', node, src, lang, display, settings)
    if (!node)
      return function () { };
    
    var converted = convertPromise({ src: src, lang: lang }, node, display, settings)
    converted.promise.then((result: string) => {
      console.log('math message promise resolved')
      setRenderedHTML(result)
      // Notify channel to adjust scrollbar position
      onMathMessageRendered()
    }, setError);
    
    return function () {
      setError(null);
      converted.cancel();
    };
  }, [node, src, lang, display, settings]);
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

  const texMessage = texMessageSplit.map((partialMessage: string, index: number) => {
    if (displayMathRegex.test(partialMessage)) {
      // Pass only part wrapped in $$(...)$$
      const extracted = partialMessage.match(displayMathRegex)[1]
      const getProps = useMathJax({ display, src: extracted.trim(), lang: 'TeX', onMathMessageRendered }).getProps
      return display ? React.createElement("div", getProps()) : React.createElement("span", getProps())
    } else {
      return <TextMessageComponent message={partialMessage} messageId={`${messageId}-${index}`} pending={pending} openUrl={openUrl} key={`${messageId}-${index}`} />
    }
  })

  return <>{texMessage}</>
}