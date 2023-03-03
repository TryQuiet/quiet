export const displayMathRegex = /\$\$(.+?)\$\$/

export const splitByTex = (text: string, regex: RegExp): string[] => {
  let msgWIP = text
  let matchResult = text.match(regex)
  const results = []
  while (matchResult !== null) {
    const index = matchResult.index
    const text = msgWIP.substring(0, index).trim()
    results.push(text) // regular text
    results.push(matchResult[0]) // math expression
    msgWIP = msgWIP.replace(text, '')
    msgWIP = msgWIP.replace(regex, '').trim()
    matchResult = msgWIP.match(regex)
  }
  results.push(msgWIP) // Add remaining text
  return results.filter((r) => r !== '')
}
