export const storybookLog =
  (message: string) =>
    (...args: unknown[]): void => {
      console.info(message)

      if (args.length > 0) {
        args.forEach((arg) => { console.info(arg); })
      }
    }
