export const storybookLog =
  (message: string) =>
  (...args: unknown[]): void => {
    console.log(message)

    if (args.length > 0) {
      args.forEach(arg => {
        console.log(arg)
      })
    }
  }
