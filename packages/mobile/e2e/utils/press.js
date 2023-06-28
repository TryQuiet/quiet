import info from './info'

const { ios } = info

const press = async (element, double = false) => {
  if (ios) {
    await element.tap()
  } else {
    if (double) await element.longPress() // Idle
    await element.longPress()
  }
}

export default press
