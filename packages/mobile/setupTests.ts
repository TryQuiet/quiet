/* eslint-disable */

jest.mock('pkijs', () => ({
  CryptoEngine: jest.fn(),
  setEngine: jest.fn()
}))

jest.mock('react-native-config', () => ({
  NODE_ENV: 'staging'
}))
