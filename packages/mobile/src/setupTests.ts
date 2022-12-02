/* eslint-disable */

import { io } from 'socket.io-client'

jest.mock('socket.io-client', () => ({
  io: jest.fn()
}))

export const ioMock = io as jest.Mock

jest.mock('pkijs/src/CryptoEngine', () => ({
  CryptoEngine: jest.fn(),
}));

jest.mock('pkijs/src/common', () => ({
  setEngine: jest.fn(),
}));

jest.mock('react-native-config', () => ({
  NODE_ENV: 'staging',
}));

jest.resetAllMocks()
