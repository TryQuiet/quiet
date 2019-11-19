export const remote = {
  app: {
    getPath: jest.fn(() => '/app/Zbay')
  },
  getGlobal: jest.fn(() => ({
    env: {}
  })),
  process: { on: jest.fn() }
}

export default {
  remote
}
