import { StoreKeys } from './store.keys'
import { CommunitiesState } from './communities/communities.slice'

// TODO: It might be easier to run migrations at a higher level that this (e.g.
// once the store has already been rehydrated), so that we have access to the
// entity API and slice reducers.
//
// TODO: Note that any migration here needs to be idempotent since these will
// also run on fresh Quiet installs. We can probably fix this if we want. See:
// https://github.com/rt2zz/redux-persist/blob/d8b01a085e3679db43503a3858e8d4759d6f22fa/src/createMigrate.ts#L21-L24
export const storeMigrations = {
  // MIGRATION: Move CommunitiesState.psk to Community.psk
  0: (state: any) => {
    // Removing psk from the CommunitiesState class causes type errors. Below
    // is one solution. Another alternative is making CommunitiesState a union
    // type, e.g. CommunitiesStateV1 | CommunitiesStateV2, or simply leaving
    // the psk field in CommunitiesState and marking it deprecated in a
    // comment.
    const prevState = state[StoreKeys.Communities] as CommunitiesState & { psk?: string | undefined }

    if (prevState.psk) {
      // At this time we only have a single community
      const currentCommunity = prevState.communities.entities[prevState.currentCommunity]

      if (currentCommunity) {
        currentCommunity.psk = prevState.psk
      }
    }

    return state
  },
  // TODO: Uncomment this migration after the previous migration has been
  // released.
  // 1: (state: any) => {
  //   const prevState = state[StoreKeys.Communities] as CommunitiesState & { psk?: string | undefined }

  //   delete prevState.psk
  // }
}
