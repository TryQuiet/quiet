export default function extractMath(text: string): string[] {
  const regex = /\$\$(.+?)\$\$/
  // const msg = String.raw`\sum_{i=0}^n i = \frac{n(n+1)}{2}`

  // const msg = String.raw`Hello! Does in-line LaTeX work? $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ Hello! Does in-line LaTeX work? $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$`

  // const msg2 = String.raw`Hello! Does in-line LaTeX work? $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ Some text`
  // const msg3 = String.raw`$$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ Some text`
  let msgWIP = text
  let matchResult = text.match(regex)
  // let previousIndex = 0
  const results = []
  while (matchResult !== null) {
    const index = matchResult.index
    const text = msgWIP.substring(0, index)
    results.push(text) // text
    results.push(matchResult[0])  // math expression
    msgWIP = msgWIP.replace(text, '')
    msgWIP = msgWIP.replace(regex, '')
    msgWIP = msgWIP.trim()
    matchResult = msgWIP.match(regex)
  }
  results.push(msgWIP)
  return results
}