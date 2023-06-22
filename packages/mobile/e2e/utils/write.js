import platform from './platform'

const write = async (element, text) => {
  if (platform.ios) {
    await element.typeText(text)
  } else {
    await element.longPress()
    await element.typeText(text)
  }
}

export default write
