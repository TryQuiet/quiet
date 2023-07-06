import info from './info'

const { ios } = info

const write = async (element, text) => {
  if (ios) {
    await element.typeText(text)
  } else {
    await element.longPress()
    await element.typeText(text)
  }
}

export default write
