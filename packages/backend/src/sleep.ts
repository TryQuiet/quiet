export const sleep = async (time = 1000) => {
  await new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}
