import { createEntityAdapter } from '@reduxjs/toolkit';
import { Community } from './communities.slice';

export const communitiesAdapter = createEntityAdapter<Community>({
  selectId: (community) => community.id,
});
