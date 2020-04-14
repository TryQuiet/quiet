import electronStore from '../electronStore'

const storePassword = (masterPassword) => {
  try {
    electronStore.set('vaultPassword', masterPassword)
  } catch (err) {
    throw Error('Cannot save password in electroneStore')
  }
}

export default {
  storePassword
}
