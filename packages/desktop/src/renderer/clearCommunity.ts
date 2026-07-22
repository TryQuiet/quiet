interface PersistorLike {
  pause: () => void
  flush: () => Promise<unknown>
  purge: () => Promise<unknown>
  persist: () => void
}

export interface ClearCommunityDependencies {
  persistor: PersistorLike
  dispatch: (action: unknown) => unknown
  resetAppAction: unknown
  requestBackendLeave: () => Promise<unknown> | unknown
  remountRoot: () => void
}

type ClearCommunityHandler = () => Promise<void>

let clearCommunityHandler: ClearCommunityHandler | undefined

export const configureClearCommunity = (handler: ClearCommunityHandler): void => {
  clearCommunityHandler = handler
}

export const clearCommunity = async (): Promise<void> => {
  if (!clearCommunityHandler) {
    throw new Error('Clear community has not been configured')
  }

  await clearCommunityHandler()
}

export const clearCommunityWithDependencies = async ({
  persistor,
  dispatch,
  resetAppAction,
  requestBackendLeave,
  remountRoot,
}: ClearCommunityDependencies): Promise<void> => {
  const leftCommunity = await requestBackendLeave()
  if (leftCommunity === false) {
    throw new Error('Backend failed to leave community')
  }

  persistor.pause()
  await persistor.flush()
  await persistor.purge()
  dispatch(resetAppAction)
  remountRoot()
  persistor.persist()
}
