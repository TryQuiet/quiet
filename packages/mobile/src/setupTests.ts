/* eslint-disable */

jest.mock('pkijs/src/CryptoEngine', () => ({
  CryptoEngine: jest.fn(),
}));

jest.mock('pkijs/src/common', () => ({
  setEngine: jest.fn(),
}));

jest.mock('react-native-config', () => ({
  NODE_ENV: 'staging',
}));

jest.mock('react-native-find-free-port', () => ({
  getFirstStartingFrom: jest.fn()
}))
