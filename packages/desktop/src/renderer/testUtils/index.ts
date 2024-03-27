export * from './generateMessages'
export * from './prepareStore'
export * from './renderComponent'
export * from './socket'

export const sleep = async (timeMs = 1000) => {
  await new Promise<void>(resolve =>
    setTimeout(() => {
      resolve()
    }, timeMs)
  )
}
