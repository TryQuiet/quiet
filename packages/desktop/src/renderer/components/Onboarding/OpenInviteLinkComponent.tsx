import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { OnboardingBody } from './OnboardingBody'
import { monsterIllustration } from './icons'

const Illustration = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.space.sm,
}))

const PasteLink = styled('button')(({ theme }) => ({
  alignSelf: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  color: theme.palette.colors.linkBlue,
  cursor: 'pointer',
  font: 'inherit',
}))

export interface OpenInviteLinkComponentProps {
  onPasteLink: () => void
}

/** Open invite link · Figma 2811:2455. */
export const OpenInviteLinkComponent: React.FC<OpenInviteLinkComponentProps> = ({ onPasteLink }) => (
  <OnboardingBody
    leading={<Illustration src={monsterIllustration} alt='' aria-hidden />}
    heading={'Join with invite link'}
    intro={'Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)'}
    dataTestId='open-invite-link'
  >
    <PasteLink type='button' onClick={onPasteLink} data-testid='paste-a-link'>
      <Typography variant='body1' component='span' color='inherit'>
        Paste a link
      </Typography>
    </PasteLink>
  </OnboardingBody>
)

export default OpenInviteLinkComponent
