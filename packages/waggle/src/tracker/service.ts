import { Tracker } from '.'

const main = async () => {
  const tracker = new Tracker(process.env.HIDDEN_SERVICE_SECRET)
  try {
    await tracker.init()
  } catch (err) {
    console.log(`Couldn't initialize tracker: ${err as string}`)
  }
  try {
    await tracker.listen()
  } catch (err) {
    console.log(`Tracker couldn't start listening: ${err as string}`)
  }
}

main().catch((err) => {
  console.log(`Couldn't start Tracker: ${err as string}`)
})
