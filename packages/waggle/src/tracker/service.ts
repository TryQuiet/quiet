import { Tracker } from '.'

const main = async () => {
  const tracker = new Tracker(process.env.HIDDEN_SERVICE_SECRET)
  await tracker.init()
  await tracker.listen()
}

main()
