/* eslint-disable */

jest.mock('react-native-config', () => ({
  NODE_ENV: 'staging',

  PUBLIC_CHANNEL_ADDRESS:
    'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',

  S3: 'https://s3.amazonaws.com/release.zbay.mobile',

  WAGGLE_VERSION: 'v.dev',
  WAGGLE_MD5: '80c0008da6abd1775953f4c77542fab5',

  LIBS_VERSION: 'v.dev',
  LIBS_MD5: '5067f26e5b159808aa472498b7df39dc',
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/somedir',
  exists: jest.fn(),
  unlink: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('react-native-zip-archive', () => ({
  unzip: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  supportedAbis: jest.fn(() => Promise.resolve(['arm64-v8a'])),
}));

jest.mock('react-native-push-notification', () => ({
  PushNotification: jest.fn(),
}));

jest.mock('pkijs/src/CryptoEngine', () => ({
  CryptoEngine: jest.fn(),
}));

jest.mock('pkijs/src/common', () => ({
  setEngine: jest.fn(),
}));
