export const remote = {
  app: {
    getPath: jest.fn(() => '/app/Zbay')
  },
  getGlobal: jest.fn(() => ({
    env: {}
  }))
}

export default {
  remote
}
