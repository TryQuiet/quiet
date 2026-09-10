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

export const createClearCommunity = (dependencies: ClearCommunityDependencies): (() => Promise<void>) => {
  let pending: Promise<void> | undefined
  return () => {
    if (!pending) {
      // Coalesce the entire operation, including the asynchronous persistence purge,
      // so repeated clicks cannot remount or clear a newly created community twice.
      pending = clearCommunityWithDependencies(dependencies).finally(() => {
        pending = undefined
      })
    }
    return pending
  }
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
  try {
    await persistor.flush()
    await persistor.purge()
    dispatch(resetAppAction)
    remountRoot()
  } finally {
    persistor.persist()
  }
}
