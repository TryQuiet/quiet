const buttercup = jest.genMockFromModule('buttercup/dist/buttercup-web')

buttercup.Credentials.fromPassword.mockImplementation(() => new buttercup.Credentials())

export const { Credentials, Datasources, Workspace, Archive } = buttercup
export default buttercup
