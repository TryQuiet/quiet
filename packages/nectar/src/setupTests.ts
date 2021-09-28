jest.mock('pkijs/src/CryptoEngine', () => ({
  CryptoEngine: jest.fn(),
}));

jest.mock('pkijs/src/common', () => ({
  setEngine: jest.fn(),
}));

jest.mock('@zbayapp/identity/lib/generateRootCA', () => ({
  createRootCA: jest.fn(),
}));
