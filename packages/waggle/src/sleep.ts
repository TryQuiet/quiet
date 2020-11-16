export const sleep = (time = 1000) =>
  new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
