import React from 'react'
import { ComponentMeta } from '@storybook/react'
import { Typography } from '@mui/material'

import { withTheme } from '../../../storybook/decorators'
import RecipientPill, { PILL_ROW_GAP } from './RecipientPill'
import { UserProfile } from '@quiet/types'

/**
 * The pills that stand for recipients already picked in a new DM's "To:" field.
 *
 * Transcribed from "Members and roles" (Figma tXuRsUfP6VnSv99dox00C1, 919:47856), which carries
 * three variants: the resting pill, the pill hovered, and the pill with its close control hovered.
 * Hover the rows below to see the last two — the background goes #F7F7F7 to #F0F0F0, and the ✕
 * darkens only when the pointer is on it.
 */

const withPhoto: UserProfile = {
  userId: 'deniseUserId',
  nickname: 'denise',
  // A flat swatch, enough to prove the photo path renders in place of the Jdenticon.
  photo:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='16' height='16' fill='%23EAA23A'/></svg>",
  userData: { peerId: 'denisePeerId', onionAddress: 'denise.onion' },
  channels: [],
}

const withoutPhoto: UserProfile = {
  userId: 'gordonUserId',
  nickname: 'gordon',
  userData: { peerId: 'gordonPeerId', onionAddress: 'gordon.onion' },
  channels: [],
}

const Row: React.FC<{ caption: string; children: React.ReactNode }> = ({ caption, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
    <Typography variant='caption' style={{ opacity: 0.6 }}>
      {caption}
    </Typography>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: PILL_ROW_GAP }}>{children}</div>
  </div>
)

export const Pills = () => (
  <div style={{ padding: 24, width: 420 }}>
    <Row caption='With a profile photo'>
      <RecipientPill userProfile={withPhoto} userId={withPhoto.userId} label={withPhoto.nickname} onDelete={() => {}} />
    </Row>
    <Row caption='Without one — the Jdenticon stands in, so a pill always carries a thumbnail'>
      <RecipientPill
        userProfile={withoutPhoto}
        userId={withoutPhoto.userId}
        label={withoutPhoto.nickname}
        onDelete={() => {}}
      />
    </Row>
    <Row caption='A long nickname truncates rather than pushing the ✕ out of the field'>
      <RecipientPill
        userProfile={undefined}
        userId='longUserId'
        label='bartholomew-of-the-very-long-nickname'
        onDelete={() => {}}
      />
    </Row>
    <Row caption='Several recipients wrap onto further lines, 10px apart'>
      {['denise', 'gordon', 'annabelle', 'christopher', 'evangelina'].map(nickname => (
        <RecipientPill
          key={nickname}
          userProfile={undefined}
          userId={`${nickname}UserId`}
          label={nickname}
          onDelete={() => {}}
        />
      ))}
    </Row>
    <Row caption='Not removable — no close control'>
      <RecipientPill userProfile={undefined} userId='fixedUserId' label='denise' />
    </Row>
  </div>
)

const component: ComponentMeta<typeof RecipientPill> = {
  title: 'Components/DirectMessages/RecipientPill',
  decorators: [withTheme],
  component: RecipientPill,
}

export default component
