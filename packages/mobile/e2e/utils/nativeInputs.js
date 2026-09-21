/* global device, element, by, waitFor */

// RN 0.81 replaces recycled backing inputs without copying their testID.
// Require the unique native field and its exact placeholder on iOS; ambiguity
// still fails instead of selecting an arbitrary element.
export const singleLineInput = async placeholder => {
  const ios = device.getPlatform() === 'ios'
  const input = element(ios ? by.type('RCTUITextField') : by.id('input'))
  await waitFor(input).toBeVisible().withTimeout(10000)
  if (ios && (await input.getAttributes()).placeholder !== placeholder) {
    throw new Error(`Expected the visible ${placeholder} field`)
  }
  return input
}

export const channelComposer = channel =>
  element(
    (device.getPlatform() === 'ios' ? by.type('RCTUITextView') : by.id('input')).withAncestor(by.id(`chat_${channel}`))
  )
