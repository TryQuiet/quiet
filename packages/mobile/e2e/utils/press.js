import platform from './platform'

const press = async (element, double = false) => {
  if (platform.ios) {
    await element.tap()
  } else {
    if (double) element.longPress() // Idle
    await element.longPress()
  }
}

export default press
