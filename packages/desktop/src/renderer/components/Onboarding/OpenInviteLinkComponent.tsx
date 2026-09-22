import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { OnboardingBody } from './OnboardingBody'
import { monsterIllustration } from './icons'
import { textLinkStates } from '../ui/interactionStates'
import { JOIN_WITH_INVITE_LINK_HEADING } from '@quiet/common'

const Illustration = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.space.sm,
}))

/** A text link rendered as a button; states from `textLinkStates`. */
export const TextLink = styled('button')(({ theme }) => ({
  alignSelf: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  color: theme.palette.colors.linkBlue,
  font: 'inherit',
  ...textLinkStates(theme),
}))

export interface OpenInviteLinkComponentProps {
  onPasteLink: () => void
}

/** Open invite link · Figma 2811:2455. */
export const OpenInviteLinkComponent: React.FC<OpenInviteLinkComponentProps> = ({ onPasteLink }) => (
  <OnboardingBody
    leading={<Illustration src={monsterIllustration} alt='' aria-hidden />}
    heading={JOIN_WITH_INVITE_LINK_HEADING}
    intro={'Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)'}
    dataTestId='open-invite-link'
  >
    <TextLink type='button' onClick={onPasteLink} data-testid='paste-a-link'>
      <Typography variant='body1' component='span' color='inherit'>
        Paste a link
      </Typography>
    </TextLink>
  </OnboardingBody>
)

export default OpenInviteLinkComponent
