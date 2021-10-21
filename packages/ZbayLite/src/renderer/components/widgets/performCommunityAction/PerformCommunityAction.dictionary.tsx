import React, { ReactElement } from 'react'

import TextWithLink from '../../ui/TextWithLink/TextWithLink'

export interface PerformCommunityActionDictionary {
  header: string
  label: string
  placeholder: string
  hint?: string
  button?: string
  redirection?: ReactElement
}

export const CreateCommunityDictionary = (
  handleRedirection?: () => void
): PerformCommunityActionDictionary => {
  let link: ReactElement
  if (handleRedirection) {
    link = (
      <TextWithLink
        text={'You can %link instead'}
        links={[
          {
            tag: 'link',
            label: 'join a community',
            action: handleRedirection
          }
        ]}
      />
    )
  }
  return {
    header: 'Create your community',
    label: 'Community name',
    placeholder: 'Community name',
    hint: '',
    button: 'Continue',
    redirection: link
  }
}

export const JoinCommunityDictionary = (handleRedirection?: () => void): PerformCommunityActionDictionary => {
  let link: ReactElement
  if (handleRedirection) {
    link = (
      <TextWithLink
        text={'You can %link instead'}
        links={[
          {
            tag: 'link',
            label: 'create a new community',
            action: handleRedirection
          }
        ]}
      />
    )
  }
  return {
    header: 'Join community',
    label: 'Paste your invite link to join an existing community',
    placeholder: 'Invite link',
    hint: '',
    button: 'Continue',
    redirection: link
  }
}
