import React, { ReactElement } from 'react'
import { communityNameField, inviteLinkField } from '../../forms/fields/communityFields'
import { FieldData } from '../../forms/types'
import TextWithLink from '../ui/TextWithLink/TextWithLink'

export interface PerformCommunityActionDictionary {
  header: string
  label: string
  placeholder: string
  hint?: string
  button: string
  field: FieldData
  redirection?: ReactElement
  id: string
}

export const CreateCommunityDictionary = (handleRedirection?: () => void): PerformCommunityActionDictionary => {
  let link: ReactElement | undefined
  if (handleRedirection) {
    link = (
      <TextWithLink
        text={'You can %link instead'}
        links={[
          {
            tag: 'link',
            label: 'join a community',
            action: handleRedirection,
          },
        ]}
        testIdPrefix={'CreateCommunity'}
      />
    )
  }
  return {
    header: 'Create your community',
    label: 'Community name',
    placeholder: 'Community name',
    hint: '',
    button: 'Continue',
    field: communityNameField(),
    redirection: link,
    id: 'createCommunity',
  }
}

export const JoinCommunityDictionary = (handleRedirection?: () => void): PerformCommunityActionDictionary => {
  let link: ReactElement | undefined
  if (handleRedirection) {
    link = (
      <TextWithLink
        text={'You can %link instead'}
        links={[
          {
            tag: 'link',
            label: 'create a new community',
            action: handleRedirection,
          },
        ]}
        testIdPrefix={'JoinCommunity'}
      />
    )
  }
  return {
    header: 'Join community',
    label: 'Paste your invite code to join an existing community',
    placeholder: 'Invite code',
    hint: '',
    button: 'Continue',
    field: inviteLinkField(),
    redirection: link,
    id: 'joinCommunity',
  }
}
