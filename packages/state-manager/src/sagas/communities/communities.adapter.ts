import { type Community } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const communitiesAdapter = createEntityAdapter<Community>({
    selectId: community => community.id,
})
