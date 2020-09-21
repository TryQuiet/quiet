import createElectronStore from 'electron-store-webpack-wrapper'
export const migrationStore = createElectronStore({ name: 'migration' })
export default createElectronStore()
