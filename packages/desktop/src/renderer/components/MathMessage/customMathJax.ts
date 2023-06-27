// Copied from https://github.com/CharlieMcVicker/mathjax-react
import { mathjax } from 'mathjax-full/js/mathjax'
import { TeX } from 'mathjax-full/js/input/tex'
import { MathML } from 'mathjax-full/js/input/mathml'
import { SVG } from 'mathjax-full/js/output/svg'
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html'
import { STATE } from 'mathjax-full/js/core/MathItem'

export const enum SourceLang {
  MathML = 'MathML',
  Tex = 'TeX',
}

// TODO import from mathjax-full
export interface SourceSpecification {
  src: string
  lang: SourceLang
}

// create and register adaptor bound to the real DOM
const adaptor = browserAdaptor()
RegisterHTMLHandler(adaptor)

//  Create input and output jax and a document using them on the content from
//  the HTML file (see:
//  https://github.com/mathjax/MathJax-demos-node/blob/master/direct/tex2svg)
const tex = new TeX({ packages: ['base', 'ams'] })
const mathml = new MathML({})
const svg = new SVG({ fontCache: 'none' })
const markErrors = [STATE.TYPESET + 1, null, onError]
const texHtml = mathjax.document('', {
  InputJax: tex,
  OutputJax: svg,
  renderActions: {
    markErrors,
  },
})
const mathmlHtml = mathjax.document('', {
  InputJax: mathml,
  OutputJax: svg,
  renderActions: {
    markErrors,
  },
})

function onError(math: any) {
  const { root, typesetRoot } = math
  if (root.toString().substr(0, 14) === 'math([merror([') {
    const merror = root.childNodes[0].childNodes[0]
    const text = merror.attributes.get('data-mjx-error') || merror.childNodes[0].childNodes[0].getText()
    adaptor.setAttribute(typesetRoot, 'data-mjx-error', text)
  }
}

function updateCSS(nodeID: string, text: string) {
  let styleNode = document.getElementById(nodeID)
  if (styleNode === null) {
    styleNode = document.createElement('style')
    styleNode.setAttribute('id', nodeID)
    document.head.appendChild(styleNode)
  }
  styleNode.innerHTML = text
}

/**
 * Does a single convert call to MathJax. Tex from inputText is converted and
 * options are the MathJax options
 */
export function convert(srcSpec: SourceSpecification, node: HTMLElement, display: boolean): string {
  const { src, lang } = srcSpec
  let html = texHtml
  if (lang === 'MathML') html = mathmlHtml
  const math: string = src.trim()
  const metrics = svg.getMetricsFor(node, display)
  const outerHTML = adaptor.outerHTML(
    html.convert(math, {
      display,
      ...metrics,
    })
  )
  html.updateDocument()
  updateCSS('MATHJAX-SVG-STYLESHEET', svg.cssStyles.cssText)
  return outerHTML
}

class CancelationException extends Error {}

export function convertPromise(
  srcSpec: SourceSpecification,
  node: HTMLElement,
  display: boolean,
  settings: any
): { promise: Promise<string>; cancel: () => void } {
  const { src, lang } = srcSpec
  if (!node) throw new Error()
  let html = texHtml
  if (lang === 'MathML') html = mathmlHtml
  const math: string = src.trim()
  let canceled = false
  const cancel = () => (canceled = true)
  const res: Promise<string | null> = mathjax
    .handleRetriesFor(function () {
      if (canceled) {
        throw new CancelationException()
      }
      const dom = html.convert(math, {
        display,
        ...settings,
        // ...metrics
      })
      return dom
    })
    .then((dom: any) => {
      // do stuff with dom
      html.updateDocument()
      updateCSS('MATHJAX-SVG-STYLESHEET', svg.cssStyles.cssText)
      const err = adaptor.getAttribute(dom, 'data-mjx-error')
      if (err) {
        throw new Error(err)
      }
      return adaptor.outerHTML(dom)
    })
    .catch(err => {
      if (!(err instanceof CancelationException)) {
        throw err
      } else {
        console.log('cancelled render!')
        return null
      }
    })
  return { promise: res.then(v => v || ''), cancel }
}
