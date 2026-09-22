// Stands in for the `backend-bundle` module when jest resolves it.
//
// `backend-bundle`'s entry point is `packages/backend-bundle/bundle.cjs`, a gitignored webpack
// artifact that only exists once `@quiet/backend` has been bundled. Without it,
// `require.resolve('backend-bundle')` throws, so `src/main/main.test.ts` fails to load before it
// can reach its own `jest.mock('backend-bundle', ...)` call, and the suite is red in any checkout
// that has not built the backend.
//
// Nothing in the desktop test suite uses the bundle's exports - main.ts only resolves its path and
// forks it, and `fork` is mocked - so module resolution is all that is needed here.
//
// This mapping is scoped to jest via `moduleNameMapper` in package.json. The packaged app is
// unaffected: the electron main process is compiled by tsc, not bundled, so at runtime node
// resolves the real `bundle.cjs` through `packages/desktop/node_modules/backend-bundle`, and the
// webpack configs only build the renderer, which never imports `backend-bundle`.
//
// It lives under `__tests__/` because tsconfig.build.json and tsconfig.build.prepare.json both
// exclude that directory, which keeps it out of `dist/` and so out of the packaged app. jest's
// `testRegex` only matches `*.test.*`, so it is not picked up as a suite. tsconfig.json, which is
// what eslint type-checks against, deliberately does NOT exclude `__tests__` - otherwise this file
// would sit outside every TSConfig project and `npm run lint:no-fix` would fail to parse it.
export {}
